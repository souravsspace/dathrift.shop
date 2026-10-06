// Steadfast prices delivery from Dhaka by zone; checkout lists areas the same way.
type Area = { district: string; area: string; name: string; fee_bdt: number };
type Zone = 'inside' | 'near' | 'outside' | 'test';

const NEAR_DHAKA = ['dhaka-suburbs', 'gazipur', 'narayanganj'];
const labels: Record<Zone, string> = {
	inside: 'Inside Dhaka',
	near: 'Near Dhaka',
	outside: 'Outside Dhaka',
	test: 'Test only'
};

const zoneOf = (district: string): Zone =>
	district.startsWith('test-')
		? 'test'
		: district === 'dhaka-city'
			? 'inside'
			: NEAR_DHAKA.includes(district)
				? 'near'
				: 'outside';

export function groupAreas<T extends Area>(areas: T[]) {
	const order: Zone[] = ['inside', 'near', 'outside', 'test'];
	return order
		.map((zone) => ({
			label: labels[zone],
			areas: areas
				.filter((area) => zoneOf(area.district) === zone)
				.sort((a, b) =>
					a.district === 'dhaka-suburbs'
						? -1
						: b.district === 'dhaka-suburbs'
							? 1
							: a.name.localeCompare(b.name)
				)
		}))
		.filter((group) => group.areas.length);
}
