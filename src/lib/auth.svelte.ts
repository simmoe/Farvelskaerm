import {
	onAuthStateChanged,
	signInWithPopup,
	GoogleAuthProvider,
	signOut as fbSignOut,
	type User
} from 'firebase/auth';
import { auth, OWNER_EMAIL } from './firebase';

class AuthState {
	user = $state<User | null>(null);
	loading = $state(true);
	#started = false;

	start() {
		if (this.#started) return;
		this.#started = true;
		onAuthStateChanged(auth(), (u) => {
			this.user = u;
			this.loading = false;
		});
	}

	get isOwner(): boolean {
		return !!this.user?.emailVerified && this.user.email === OWNER_EMAIL;
	}

	async login() {
		const provider = new GoogleAuthProvider();
		provider.setCustomParameters({ prompt: 'select_account' });
		await signInWithPopup(auth(), provider);
	}

	async logout() {
		await fbSignOut(auth());
	}
}

export const authState = new AuthState();
