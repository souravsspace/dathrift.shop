// D1 stores CURRENT_TIMESTAMP as UTC text ("2026-10-06 18:30:00"); staff read Bangladesh time.
const withYear = new Intl.DateTimeFormat('en-GB', {
	timeZone: 'Asia/Dhaka',
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	hour: 'numeric',
	minute: '2-digit',
	hour12: true
});

export function bangladeshTime(value: string | null | undefined): string {
	if (!value) return '';
	const date = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value.replace(' ', 'T')}Z`);
	return Number.isNaN(date.getTime()) ? value : withYear.format(date);
}
