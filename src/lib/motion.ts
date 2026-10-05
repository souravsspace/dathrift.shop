import { animate, inView, stagger } from 'motion';
import type { Attachment } from 'svelte/attachments';

// One motion grammar for the storefront: tags hang from an eyelet and swing on springs, status
// marks land with a single stamp press, and the rack settles into place once as it scrolls in.
// Content is always visible by default; motion only runs when the visitor allows it.
const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const easeOut = [0.16, 1, 0.3, 1] as const;

/** Children marked [data-reveal] rise into place the first time the container scrolls in. */
export const reveal: Attachment<HTMLElement> = (node) => {
	if (calm()) return;
	const items = [...node.querySelectorAll<HTMLElement>('[data-reveal]')];
	const below = items.filter((item) => item.getBoundingClientRect().top > window.innerHeight);
	if (!below.length) return;
	for (const item of below) item.style.opacity = '0';
	const stop = inView(
		node,
		() => {
			animate(
				below,
				{ opacity: [0, 1], transform: ['translateY(28px)', 'translateY(0px)'] },
				{ duration: 0.7, ease: easeOut, delay: stagger(0.05) }
			);
		},
		{ amount: 0.1 }
	);
	return () => {
		stop();
		for (const item of below) item.style.opacity = '';
	};
};

/** A tag swings on its eyelet when a pointer arrives, then settles under spring damping. */
export const swing: Attachment<HTMLElement> = (node) => {
	if (calm()) return;
	let lastX = 0;
	const enter = (event: PointerEvent) => {
		const rect = node.getBoundingClientRect();
		const from = event.clientX < rect.left + rect.width / 2 ? 1 : -1;
		lastX = event.clientX;
		animate(
			node,
			{ rotate: [from * 7, 0] },
			{ type: 'spring', stiffness: 160, damping: 5, mass: 0.8 }
		);
	};
	const move = (event: PointerEvent) => {
		const push = Math.max(-4, Math.min(4, (event.clientX - lastX) * 0.4));
		lastX = event.clientX;
		if (Math.abs(push) > 1.5)
			animate(node, { rotate: [push, 0] }, { type: 'spring', stiffness: 160, damping: 6 });
	};
	node.addEventListener('pointerenter', enter);
	node.addEventListener('pointermove', move);
	return () => {
		node.removeEventListener('pointerenter', enter);
		node.removeEventListener('pointermove', move);
	};
};

/** The hero tag drops onto its thread once and swings to rest. */
export const hang: Attachment<HTMLElement> = (node) => {
	if (calm()) return;
	animate(
		node,
		{ transform: ['translateY(-48px) rotate(-10deg)', 'translateY(0px) rotate(0deg)'] },
		{ type: 'spring', stiffness: 90, damping: 7, mass: 1, delay: 0.15 }
	);
};

/** A status mark lands with one press and then stays still. */
export const stampPress: Attachment<HTMLElement> = (node) => {
	if (calm()) return;
	animate(
		node,
		{
			opacity: [0, 1],
			// Composes with the stamp's resting CSS rotation.
			transform: ['scale(1.9) rotate(-6deg)', 'scale(1) rotate(0deg)'],
			filter: ['blur(3px)', 'blur(0px)']
		},
		{ duration: 0.32, ease: [0.5, 0, 0.75, 0] }
	);
};
