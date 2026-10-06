<script lang="ts" module>
	// Outline icons from Lucide (lucide-static 1.52.0, ISC License, https://lucide.dev), stored as
	// path data so the storefront ships one consistent 24px, 2px-stroke set without a dependency.
	const paths = {
		'arrow-left': ['m12 19-7-7 7-7', 'M19 12H5'],
		'arrow-right': ['M5 12h14', 'm12 5 7 7-7 7'],
		'arrow-up': ['m5 12 7-7 7 7', 'M12 19V5'],
		'arrow-up-down': ['m21 16-4 4-4-4', 'M17 20V4', 'm3 8 4-4 4 4', 'M7 4v16'],
		bookmark: [
			'M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z'
		],
		'bookmark-check': [
			'M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z',
			'm9 10 2 2 4-4'
		],
		check: ['M20 6 9 17l-5-5'],
		'chevron-down': ['m6 9 6 6 6-6'],
		'chevron-left': ['m15 18-6-6 6-6'],
		'chevron-right': ['m9 18 6-6-6-6'],
		'circle-check': ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0', 'm16 9-5.5 5.5L8 12'],
		'circle-x': ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0', 'm15 9-6 6', 'm9 9 6 6'],
		clock: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0', 'M12 6v6l4 2'],
		copy: [
			'M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2z',
			'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'
		],
		'hand-coins': [
			'M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17',
			'm7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9',
			'm2 16 6 6',
			'M13.1 9a2.9 2.9 0 1 0 5.8 0a2.9 2.9 0 1 0 -5.8 0',
			'M3 5a3 3 0 1 0 6 0a3 3 0 1 0 -6 0'
		],
		house: [
			'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8',
			'M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'
		],
		info: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0', 'M12 16v-4', 'M12 8h.01'],
		'layout-grid': [
			'M4 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1z',
			'M15 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1z',
			'M15 14h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1z',
			'M4 14h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1z'
		],
		lock: [
			'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-7a2 2 0 0 1 2 -2z',
			'M7 11V7a5 5 0 0 1 10 0v4'
		],
		'map-pin': [
			'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0',
			'M9 10a3 3 0 1 0 6 0a3 3 0 1 0 -6 0'
		],
		package: [
			'M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z',
			'M12 22V12',
			'M3.29 7L12 12 20.71 7',
			'm7.5 4.27 9 5.15'
		],
		ruler: [
			'M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z',
			'm14.5 12.5 2-2',
			'm11.5 9.5 2-2',
			'm8.5 6.5 2-2',
			'm17.5 15.5 2-2'
		],
		'scan-search': [
			'M3 7V5a2 2 0 0 1 2-2h2',
			'M17 3h2a2 2 0 0 1 2 2v2',
			'M21 17v2a2 2 0 0 1-2 2h-2',
			'M7 21H5a2 2 0 0 1-2-2v-2',
			'M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0',
			'm16 16-1.9-1.9'
		],
		search: ['m21 21-4.34-4.34', 'M3 11a8 8 0 1 0 16 0a8 8 0 1 0 -16 0'],
		shirt: [
			'M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z'
		],
		'shopping-bag': [
			'M16 10a4 4 0 0 1-8 0',
			'M3.103 6.034h17.794',
			'M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z'
		],
		smartphone: [
			'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-16a2 2 0 0 1 2 -2z',
			'M12 18h.01'
		],
		'sliders-horizontal': [
			'M10 5H3',
			'M12 19H3',
			'M14 3v4',
			'M16 17v4',
			'M21 12h-9',
			'M21 19h-5',
			'M21 5h-7',
			'M8 10v4',
			'M8 12H3'
		],
		tag: [
			'M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z',
			'M7 7.5a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0'
		],
		'timer-off': [
			'M10 2h4',
			'M4.6 11a8 8 0 0 0 1.7 8.7 8 8 0 0 0 8.7 1.7',
			'M7.4 7.4a8 8 0 0 1 10.3 1 8 8 0 0 1 .9 10.2',
			'm2 2 20 20',
			'M12 12v-2'
		],
		'trash-2': [
			'M10 11v6',
			'M14 11v6',
			'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
			'M3 6h18',
			'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'
		],
		truck: [
			'M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2',
			'M15 18H9',
			'M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14',
			'M15 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
			'M5 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0'
		],
		wallet: [
			'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1',
			'M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4'
		],
		x: ['M18 6 6 18', 'm6 6 12 12']
	} as const;

	export type IconName = keyof typeof paths;
</script>

<script lang="ts">
	let {
		name,
		size = 20,
		label
	}: {
		name: IconName;
		size?: number;
		/** Only for an icon that carries meaning on its own; icons beside text stay hidden. */
		label?: string;
	} = $props();
</script>

<svg
	class="icon"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
	focusable="false"
	>{#each paths[name] as d (d)}<path {d} />{/each}</svg
>

<style>
	.icon {
		flex: none;
		display: block;
	}
</style>
