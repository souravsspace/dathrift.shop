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

/**
 * Attached to the still hanger: when a mouse or pen arrives, its tag (.swinger) swings once away
 * from the pointer like a pendulum and settles. Pointer moves and re-entries during the swing
 * are ignored, so a restless cursor can never restart or jolt it; touch taps straight through.
 */
export const swing: Attachment<HTMLElement> = (node) => {
	if (calm()) return;
	const tag = node.querySelector<HTMLElement>('.swinger') ?? node;
	let swinging = false;
	const enter = (event: PointerEvent) => {
		if (swinging || event.pointerType === 'touch') return;
		const rect = node.getBoundingClientRect();
		const away = event.clientX < rect.left + rect.width / 2 ? 1 : -1;
		swinging = true;
		const controls = animate(
			tag,
			{ rotate: [0, away * 5, away * -2.6, away * 1.2, away * -0.4, 0] },
			{ duration: 1.3, times: [0, 0.18, 0.42, 0.64, 0.84, 1], ease: 'easeInOut' }
		);
		void controls.finished.finally(() => (swinging = false));
	};
	node.addEventListener('pointerenter', enter);
	return () => node.removeEventListener('pointerenter', enter);
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
