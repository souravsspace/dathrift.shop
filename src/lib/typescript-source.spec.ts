import { existsSync, readFileSync, readdirSync } from 'node:fs';
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

	expect({
		appJavaScript,
		legacyConfig,
		hasTsconfig: existsSync(resolve('tsconfig.json'))
	}).toEqual({
		appJavaScript: [],
		legacyConfig: [],
		hasTsconfig: true
	});
});

it('uses domain names instead of phase numbers in runtime source and configuration', () => {
	const phaseLabel = new RegExp('phase' + '[0-9]', 'i');
	const files = [
		...readdirSync('src', { recursive: true }),
		...readdirSync('db', { recursive: true })
	]
		.map(String)
		.filter((file) => /\.(ts|sql)$/.test(file));
	const offenders = files.filter((file) => {
		const root = existsSync(resolve('src', file)) ? 'src' : 'db';
		return phaseLabel.test(file) || phaseLabel.test(readFileSync(resolve(root, file), 'utf8'));
	});
	const configs = readdirSync('.').filter((file) => /^wrangler.*\.jsonc$/.test(file));

	expect({ offenders, configs: configs.filter((file) => phaseLabel.test(file)) }).toEqual({
		offenders: [],
		configs: []
	});
});
