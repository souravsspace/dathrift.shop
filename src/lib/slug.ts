// URL slug from a name: Latin letters and digits joined by single hyphens. Names with no
// Latin characters (for example Bangla) give an empty slug, so staff type one instead.
export function slugify(name: string, maxLength = 80): string {
	return name
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.slice(0, maxLength)
		.replace(/^-+|-+$/g, '');
}
