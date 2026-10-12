// URL slug from a name: Latin letters and digits joined by single hyphens. Names with no
// Latin characters (for example Bangla) give an empty slug, so staff type one instead.
export function slugify(name: string, maxLength = 80): string {
	return slugInput(name, maxLength).replace(/-+$/, '');
}

// The same cleaning for a slug field while staff type: spaces and capitals become a valid slug
// at once, and a trailing hyphen stays so the next word can follow it.
export function slugInput(value: string, maxLength = 160): string {
	return value
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+/, '')
		.slice(0, maxLength);
}
