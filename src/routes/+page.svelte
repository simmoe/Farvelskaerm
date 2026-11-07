<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { authState } from '#lib/auth.svelte.ts';
	import { book } from '#lib/book.svelte.ts';
	import { content, format, pastePlain } from '#lib/editable.ts';

	let tocOpen = $state(false);
	let active = $state('top');

	const owner = $derived(authState.isOwner);
	const parser = new DOMParser();

	function headings(html: string): string[] {
		const docu = parser.parseFromString(html, 'text/html');
		return [...docu.querySelectorAll('h3')].map((h) => h.textContent?.trim() || '…');
	}

	const toc = $derived(
		book.chapters.map((ch, i) => ({
			id: ch.id,
			n: i + 1,
			title: ch.title,
			sections: headings(ch.html)
		}))
	);

	function target(key: string): HTMLElement | null {
		const m = key.match(/^ch-(.+)-s(\d+)$/);
		if (m) {
			return document.querySelectorAll<HTMLElement>(`#ch-${CSS.escape(m[1])} .body h3`)[+m[2]] ?? null;
		}
		return document.getElementById(key);
	}

	function go(key: string) {
		tocOpen = false;
		target(key)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		history.replaceState(null, '', key === 'top' ? location.pathname : `#${key}`);
	}

	function spy() {
		const line = innerHeight * 0.3;
		let current = 'top';
		const keys = ['top', 'intro'];
		for (const t of toc) {
			keys.push(`ch-${t.id}`);
			t.sections.forEach((_, j) => keys.push(`ch-${t.id}-s${j}`));
		}
		for (const key of keys) {
			const el = target(key);
			if (el && el.getBoundingClientRect().top <= line) current = key;
		}
		active = current;
	}

	let raf = 0;
	function onScroll() {
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(spy);
	}

	function singleLine(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			(e.currentTarget as HTMLElement).blur();
		}
	}

	function shortcuts(e: KeyboardEvent) {
		if (!(e.metaKey || e.ctrlKey) || !e.altKey) return;
		const map: Record<string, Parameters<typeof format>[0]> = {
			Digit0: 'p',
			Digit3: 'h3',
			Digit9: 'blockquote'
		};
		const cmd = map[e.code];
		if (cmd) {
			e.preventDefault();
			format(cmd);
		}
	}

	async function addChapter() {
		const id = await book.addChapter();
		await tick();
		const h = document.querySelector<HTMLElement>(`#ch-${CSS.escape(id)} h2`);
		h?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		h?.focus();
		document.execCommand('selectAll');
	}

	function removeChapter(id: string, title: string) {
		if (confirm(`Slet kapitlet «${title}»?`)) book.removeChapter(id);
	}

	const tools: { cmd: Parameters<typeof format>[0]; label: string; title: string }[] = [
		{ cmd: 'p', label: '¶', title: 'Brødtekst (⌘⌥0)' },
		{ cmd: 'h3', label: 'Afsnit', title: 'Afsnitsoverskrift (⌘⌥3)' },
		{ cmd: 'blockquote', label: '“ ”', title: 'Citat (⌘⌥9)' },
		{ cmd: 'bold', label: 'F', title: 'Fed (⌘B)' },
		{ cmd: 'italic', label: 'K', title: 'Kursiv (⌘I)' },
		{ cmd: 'ul', label: '•', title: 'Punktliste' },
		{ cmd: 'ol', label: '1.', title: 'Nummereret liste' }
	];

	const statusText = $derived(
		book.status === 'saving'
			? 'Gemmer …'
			: book.status === 'saved'
				? 'Gemt'
				: book.status === 'error'
					? `Ikke gemt: ${book.error}`
					: ''
	);

	onMount(() => {
		authState.start();
		book.start();
		const hash = location.hash.slice(1);
		if (hash) setTimeout(() => go(decodeURIComponent(hash)), 400);
		spy();
	});
</script>

<svelte:window onscroll={onScroll} onresize={onScroll} />

<button class="toc-toggle" onclick={() => (tocOpen = !tocOpen)} aria-expanded={tocOpen}>
	{tocOpen ? 'Luk' : 'Indhold'}
</button>

<aside class="toc" class:open={tocOpen}>
	<nav>
		<a
			class="toc-book"
			class:active={active === 'top'}
			href="#top"
			onclick={(e) => {
				e.preventDefault();
				go('top');
			}}>{book.meta.title}</a
		>
		<ol>
			<li>
				<a
					class:active={active === 'intro'}
					href="#intro"
					onclick={(e) => {
						e.preventDefault();
						go('intro');
					}}>Indledning</a
				>
			</li>
			{#each toc as t (t.id)}
				<li>
					<a
						class="toc-chapter"
						class:active={active === `ch-${t.id}`}
						href="#ch-{t.id}"
						onclick={(e) => {
							e.preventDefault();
							go(`ch-${t.id}`);
						}}><span class="num">{t.n}</span>{t.title}</a
					>
					{#if t.sections.length}
						<ol>
							{#each t.sections as s, j}
								<li>
									<a
										class:active={active === `ch-${t.id}-s${j}`}
										href="#ch-{t.id}-s{j}"
										onclick={(e) => {
											e.preventDefault();
											go(`ch-${t.id}-s${j}`);
										}}><span class="num">{t.n}.{j + 1}</span>{s}</a
									>
								</li>
							{/each}
						</ol>
					{/if}
				</li>
			{/each}
		</ol>
	</nav>

	<footer class="toc-foot">
		{#if authState.loading}
			<span></span>
		{:else if authState.user}
			<span>{owner ? 'Redigerer' : 'Kun læseadgang'}</span>
			<button onclick={() => authState.logout()}>Log ud</button>
		{:else}
			<button onclick={() => authState.login()}>Log ind</button>
		{/if}
	</footer>
</aside>

{#if owner}
	<div class="toolbar" role="toolbar" aria-label="Formatering">
		{#each tools as t}
			<button
				title={t.title}
				class="tool-{t.cmd}"
				onmousedown={(e) => {
					e.preventDefault();
					format(t.cmd);
				}}>{t.label}</button
			>
		{/each}
		<span class="status" class:error={book.status === 'error'}>{statusText}</span>
	</div>
{/if}

<main class="page" class:editing={owner} onkeydown={owner ? shortcuts : undefined}>
	<header class="titlepage" id="top">
		<h1
			contenteditable={owner ? 'plaintext-only' : 'false'}
			spellcheck="false"
			onkeydown={singleLine}
			oninput={(e) => book.setMeta({ title: e.currentTarget.textContent ?? '' })}
			{@attach content(book.meta.title, 'text')}
		></h1>
		<p
			class="subtitle"
			contenteditable={owner ? 'plaintext-only' : 'false'}
			onkeydown={singleLine}
			oninput={(e) => book.setMeta({ subtitle: e.currentTarget.textContent ?? '' })}
			{@attach content(book.meta.subtitle, 'text')}
		></p>
		<div class="rule" aria-hidden="true"></div>
		<p
			class="author"
			contenteditable={owner ? 'plaintext-only' : 'false'}
			onkeydown={singleLine}
			oninput={(e) => book.setMeta({ author: e.currentTarget.textContent ?? '' })}
			{@attach content(book.meta.author, 'text')}
		></p>
	</header>

	<section
		id="intro"
		class="intro text"
		contenteditable={owner}
		onpaste={pastePlain}
		oninput={(e) => book.setMeta({ html: e.currentTarget.innerHTML })}
		{@attach content(book.meta.html)}
	></section>

	{#each book.chapters as ch, i (ch.id)}
		<section class="chapter" id="ch-{ch.id}" style:--n={`"${i + 1}"`}>
			<div class="chapter-label">Kapitel {i + 1}</div>
			<h2
				contenteditable={owner ? 'plaintext-only' : 'false'}
				onkeydown={singleLine}
				oninput={(e) => book.setChapter(ch.id, { title: e.currentTarget.textContent ?? '' })}
				{@attach content(ch.title, 'text')}
			></h2>
			{#if owner}
				<div class="chapter-tools">
					<button disabled={i === 0} onclick={() => book.moveChapter(ch.id, -1)}>Flyt op</button>
					<button
						disabled={i === book.chapters.length - 1}
						onclick={() => book.moveChapter(ch.id, 1)}>Flyt ned</button
					>
					<button onclick={() => removeChapter(ch.id, ch.title)}>Slet</button>
				</div>
			{/if}
			<div class="ornament" aria-hidden="true">⁂</div>
			<div
				class="body text"
				contenteditable={owner}
				onpaste={pastePlain}
				oninput={(e) => book.setChapter(ch.id, { html: e.currentTarget.innerHTML })}
				{@attach content(ch.html)}
			></div>
		</section>
	{/each}

	{#if owner}
		<button class="add-chapter" onclick={addChapter}>+ Nyt kapitel</button>
	{/if}

	<footer class="colophon">© {book.meta.author} · {new Date().getFullYear()}</footer>
</main>
