import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

it('keeps application code and supported tooling in TypeScript', () => {
	const appJavaScript = readdirSync(resolve('src'), { recursive: true }).filter((file) =>
		String(file).endsWith('.js')
	);
	const legacyConfig = [
		'jsconfig.json',
		'eslint.config.js',
		'playwright.config.js',
		'prettier.config.js',
		'vite.config.js'
	].filter((file) => existsSync(resolve(file)));

	expect({ appJavaScript, legacyConfig, hasTsconfig: existsSync(resolve('tsconfig.json')) }).toEqual({
		appJavaScript: [],
		legacyConfig: [],
		hasTsconfig: true
	});
});
