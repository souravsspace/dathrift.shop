import { page } from 'vitest/browser';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AdminToast from './AdminToast.svelte';

it('closes a confirmation by itself and on the close button', async () => {
	vi.useFakeTimers();
	const onclose = vi.fn();
	render(AdminToast, { text: 'Piece published', onclose });
	await expect.element(page.getByRole('status')).toHaveTextContent('Piece published');
	vi.advanceTimersByTime(5000);
	expect(onclose).toHaveBeenCalledOnce();
	vi.useRealTimers();
	await page.getByRole('button', { name: 'Dismiss message' }).click();
	expect(onclose).toHaveBeenCalledTimes(2);
});

it('keeps an error until staff close it', async () => {
	vi.useFakeTimers();
	const onclose = vi.fn();
	render(AdminToast, { text: 'Could not save', kind: 'error', onclose });
	await expect.element(page.getByRole('alert')).toHaveTextContent('Could not save');
	vi.advanceTimersByTime(60000);
	expect(onclose).not.toHaveBeenCalled();
	vi.useRealTimers();
});
