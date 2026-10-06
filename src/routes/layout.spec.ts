import { readdirSync, readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('does not render starter demo links in the storefront shell', () => {
	const layout = readFileSync('src/routes/+layout.svelte', 'utf8');
	expect(layout).not.toContain('DemoLinks');
});

it('uses the daThriftShop logo as favicon, touch icon and manifest icon', () => {
	const layout = readFileSync('src/routes/+layout.svelte', 'utf8');
	expect(layout).toContain('href="/favicon.ico"');
	expect(layout).toContain('href="/icons/apple-touch-icon.png"');
	expect(layout).toContain('href="/site.webmanifest"');
	expect(layout).not.toContain('favicon.svg');
	const manifest = JSON.parse(readFileSync('static/site.webmanifest', 'utf8')) as {
		icons: { src: string }[];
	};
	for (const icon of [
		'static/favicon.ico',
		'static/icons/favicon-32.png',
		'static/icons/apple-touch-icon.png',
		...manifest.icons.map((item) => `static${item.src}`)
	])
		expect(readFileSync(icon).length).toBeGreaterThan(0);
});

it('records the design direction contract in the emitted page', () => {
	expect(readFileSync('src/app.html', 'utf8')).toContain('seed 23e8f4a5');
});

it('spells the shop name daThriftShop wherever it is shown', () => {
	const manifest = JSON.parse(readFileSync('static/site.webmanifest', 'utf8')) as {
		name: string;
		short_name: string;
	};
	expect(manifest.name).toBe('daThriftShop');
	expect(manifest.short_name).toBe('daThriftShop');
	// The domain (dathrift.shop) and internal identifiers stay lowercase; a bare word is the name.
	const bareName = /(?<![\w./@-])dathrift(?![\w.:/-])/i;
	const files = readdirSync('src', { recursive: true, encoding: 'utf8' }).filter(
		(file) => file.endsWith('.svelte') || file === 'foundation/monitor.ts'
	);
	expect(files.filter((file) => bareName.test(readFileSync(`src/${file}`, 'utf8')))).toEqual([]);
});

it('draws the taka sign from a self-hosted glyph in both brand faces', () => {
	const css = readFileSync('src/routes/layout.css', 'utf8');
	for (const family of ['Archivo', 'Martian Mono']) {
		const face = new RegExp(
			`@font-face \\{[^}]*font-family: '${family}';[^}]*taka\\.woff2[^}]*unicode-range: U\\+09F3;`
		);
		expect(css).toMatch(face);
	}
	expect(readFileSync('static/fonts/taka.woff2').length).toBeGreaterThan(0);
	expect(readFileSync('static/fonts/noto-sans-bengali-OFL.txt', 'utf8')).toContain('Open Font');
});
