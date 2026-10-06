import { expect, it } from 'vitest';
import { groupAreas } from './delivery-zones';

it('groups delivery areas by Steadfast zone, Dhaka first, then by name', () => {
	const area = (district: string, name: string, fee: number) => ({
		district,
		area: 'all',
		name,
		fee_bdt: fee
	});
	const groups = groupAreas([
		area('sylhet', 'Sylhet', 135),
		area('gazipur', 'Gazipur', 105),
		area('test-dhaka', 'TEST ONLY — Central area', 80),
		area('bagerhat', 'Bagerhat', 135),
		area('dhaka-suburbs', 'Dhaka suburbs (outside Dhaka City)', 105),
		area('dhaka-city', 'Dhaka City', 75)
	]);
	expect(groups.map((group) => [group.label, group.areas.map((item) => item.name)])).toEqual([
		['Inside Dhaka', ['Dhaka City']],
		['Near Dhaka', ['Dhaka suburbs (outside Dhaka City)', 'Gazipur']],
		['Outside Dhaka', ['Bagerhat', 'Sylhet']],
		['Test only', ['TEST ONLY — Central area']]
	]);
});
