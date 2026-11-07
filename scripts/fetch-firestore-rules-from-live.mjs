#!/usr/bin/env node
/**
 * Download the live Firestore rules source for p5-firebase-eebc1.
 * Use before editing or deploying firestore.rules — merge into repo file, never replace blind.
 *
 *   node scripts/fetch-firestore-rules-from-live.mjs
 *   node scripts/fetch-firestore-rules-from-live.mjs --out firestore.rules.live
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT = 'p5-firebase-eebc1';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
	console.error(`rules:fetch: ${message}`);
	process.exit(1);
}

function readAccessToken(refresh = false) {
	const configPath = join(homedir(), '.config/configstore/firebase-tools.json');
	if (refresh) {
		execFileSync('firebase', ['projects:list', '--json'], { cwd: root, stdio: 'ignore' });
	}
	const config = JSON.parse(readFileSync(configPath, 'utf8'));
	const token = config.tokens?.access_token;
	if (!token) fail('Firebase-login mangler. Kør firebase login.');
	return token;
}

async function firebaseFetch(url, options = {}) {
	let token = readAccessToken();
	for (let attempt = 0; attempt < 2; attempt += 1) {
		const response = await fetch(url, {
			...options,
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
				...options.headers
			}
		});
		if (response.status === 401 && attempt === 0) {
			token = readAccessToken(true);
			continue;
		}
		if (!response.ok) fail(`${response.status}: ${await response.text()}`);
		return response.json();
	}
	throw new Error('Firebase-login kunne ikke fornyes.');
}

async function liveFirestoreRulesSource() {
	const releases = await firebaseFetch(
		`https://firebaserules.googleapis.com/v1/projects/${PROJECT}/releases`
	);
	const release = (releases.releases ?? []).find((r) => r.name?.endsWith('/cloud.firestore'));
	if (!release?.rulesetName) fail('Ingen cloud.firestore release fundet.');
	const ruleset = await firebaseFetch(`https://firebaserules.googleapis.com/v1/${release.rulesetName}`);
	const file = ruleset.source?.files?.[0];
	if (!file?.content) fail('Ruleset mangler source.content.');
	return file.content;
}

const outArg = process.argv.indexOf('--out');
const outPath =
	outArg >= 0
		? resolve(process.argv[outArg + 1] ?? '')
		: join(root, 'firestore.rules.live');

if (!outPath) fail('--out kræver en sti.');

const source = await liveFirestoreRulesSource();
writeFileSync(outPath, source.endsWith('\n') ? source : `${source}\n`, 'utf8');
console.log(`Skrev live rules til ${outPath}`);
