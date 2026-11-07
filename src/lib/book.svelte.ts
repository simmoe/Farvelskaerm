import {
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	writeBatch
} from 'firebase/firestore';
import { COL, db } from './firebase';
import { SEED_CHAPTERS, SEED_META } from './seed';

export type Meta = { title: string; subtitle: string; author: string; html: string };
export type Chapter = { id: string; order: number; title: string; html: string };

type Status = 'idle' | 'saving' | 'saved' | 'error';

const SAVE_DELAY = 700;

class Book {
	meta = $state<Meta>({ ...SEED_META });
	chapters = $state<Chapter[]>(SEED_CHAPTERS.map((c) => ({ ...c })));
	status = $state<Status>('idle');
	error = $state('');

	#started = false;
	#patches = new Map<string, Record<string, unknown>>();
	#timers = new Map<string, ReturnType<typeof setTimeout>>();

	start() {
		if (this.#started) return;
		this.#started = true;

		onSnapshot(
			doc(db(), COL.book, 'meta'),
			(snap) => {
				if (!snap.exists() || this.#patches.has('meta')) return;
				this.meta = { ...SEED_META, ...(snap.data() as Partial<Meta>) };
			},
			(err) => console.warn('meta', err.code)
		);

		onSnapshot(
			query(collection(db(), COL.chapters), orderBy('order')),
			(snap) => {
				if (snap.empty) return;
				this.chapters = snap.docs.map((d) => {
					const local = this.chapters.find((c) => c.id === d.id);
					if (local && this.#patches.has(d.id)) return local;
					const data = d.data();
					return {
						id: d.id,
						order: data.order ?? 0,
						title: data.title ?? '',
						html: data.html ?? ''
					};
				});
			},
			(err) => console.warn('chapters', err.code)
		);

		addEventListener('beforeunload', () => this.flush());
	}

	setMeta(patch: Partial<Meta>) {
		Object.assign(this.meta, patch);
		this.#schedule('meta', patch);
	}

	setChapter(id: string, patch: Partial<Omit<Chapter, 'id'>>) {
		const ch = this.chapters.find((c) => c.id === id);
		if (ch) Object.assign(ch, patch);
		this.#schedule(id, patch);
	}

	#ref(key: string) {
		return key === 'meta' ? doc(db(), COL.book, 'meta') : doc(db(), COL.chapters, key);
	}

	#schedule(key: string, patch: Record<string, unknown>) {
		this.#patches.set(key, { ...this.#patches.get(key), ...patch });
		clearTimeout(this.#timers.get(key));
		this.status = 'saving';
		this.#timers.set(
			key,
			setTimeout(() => this.#write(key), SAVE_DELAY)
		);
	}

	async #write(key: string) {
		const patch = this.#patches.get(key);
		this.#timers.delete(key);
		if (!patch) return;
		try {
			await setDoc(this.#ref(key), { ...patch, updatedAt: serverTimestamp() }, { merge: true });
			if (this.#patches.get(key) === patch) this.#patches.delete(key);
			if (this.#patches.size === 0) this.status = 'saved';
			this.error = '';
		} catch (err) {
			this.status = 'error';
			this.error = (err as { code?: string }).code ?? String(err);
		}
	}

	flush() {
		for (const key of [...this.#timers.keys()]) {
			clearTimeout(this.#timers.get(key));
			void this.#write(key);
		}
	}

	async addChapter() {
		this.flush();
		const ref = doc(collection(db(), COL.chapters));
		const order = Math.max(0, ...this.chapters.map((c) => c.order)) + 1;
		const ch: Chapter = { id: ref.id, order, title: 'Nyt kapitel', html: '<p><br></p>' };
		this.chapters.push(ch);
		const { id: _id, ...data } = ch;
		await this.#guard(() => setDoc(ref, { ...data, updatedAt: serverTimestamp() }));
		return ref.id;
	}

	async moveChapter(id: string, dir: -1 | 1) {
		const list = [...this.chapters].sort((a, b) => a.order - b.order);
		const i = list.findIndex((c) => c.id === id);
		const j = i + dir;
		if (i < 0 || j < 0 || j >= list.length) return;
		[list[i], list[j]] = [list[j], list[i]];
		const batch = writeBatch(db());
		list.forEach((c, n) => {
			c.order = n + 1;
			batch.set(doc(db(), COL.chapters, c.id), { order: c.order }, { merge: true });
		});
		this.chapters = list;
		await this.#guard(() => batch.commit());
	}

	async removeChapter(id: string) {
		clearTimeout(this.#timers.get(id));
		this.#timers.delete(id);
		this.#patches.delete(id);
		this.chapters = this.chapters.filter((c) => c.id !== id);
		await this.#guard(() => deleteDoc(doc(db(), COL.chapters, id)));
	}

	async #guard(fn: () => Promise<unknown>) {
		this.status = 'saving';
		try {
			await fn();
			this.status = 'saved';
			this.error = '';
		} catch (err) {
			this.status = 'error';
			this.error = (err as { code?: string }).code ?? String(err);
		}
	}
}

export const book = new Book();
