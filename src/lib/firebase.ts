import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

/** Public web config. Delt projekt `p5-firebase-eebc1`; alt bag prefix `farvelskaerm_*`. */
const firebaseConfig = {
	apiKey: 'AIzaSyDU1QQ5IOx65YauKjemsexCpfgNBblrQRc',
	authDomain: 'p5-firebase-eebc1.firebaseapp.com',
	projectId: 'p5-firebase-eebc1',
	storageBucket: 'p5-firebase-eebc1.appspot.com',
	messagingSenderId: '757530790495',
	appId: '1:757530790495:web:3b63a4a12d2afdad97e9ea'
};

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _db: Firestore | undefined;

export function app(): FirebaseApp {
	return (_app ??= getApps()[0] ?? initializeApp(firebaseConfig));
}

export function auth(): Auth {
	return (_auth ??= getAuth(app()));
}

export function db(): Firestore {
	return (_db ??= getFirestore(app()));
}

export const COL = {
	book: 'farvelskaerm_book',
	chapters: 'farvelskaerm_chapters'
} as const;

export const OWNER_EMAIL = 'simmoe@gmail.com';
