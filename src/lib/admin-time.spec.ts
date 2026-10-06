import { expect, it } from 'vitest';
import { bangladeshTime } from './admin-time';

it('shows a stored UTC timestamp in Bangladesh time', () => {
	expect(bangladeshTime('2026-10-06 18:30:00')).toBe('7 Oct 2026, 12:30 am');
	expect(bangladeshTime('2026-10-06T04:05:00Z')).toBe('6 Oct 2026, 10:05 am');
	expect(bangladeshTime(null)).toBe('');
	expect(bangladeshTime('not a date')).toBe('not a date');
});
