// Full-page navigation to the payment provider; isolated so component tests can observe it.
export function leaveFor(url: string) {
	window.location.assign(url);
}
