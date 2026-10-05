// Drizzle wraps driver errors; SQL trigger messages may sit on the cause chain.
export function databaseErrorText(error: unknown): string {
	if (!(error instanceof Error)) return '';
	return `${error.message} ${databaseErrorText(error.cause)}`;
}
