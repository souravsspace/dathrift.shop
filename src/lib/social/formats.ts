// The post sizes staff prepare for Instagram and Facebook, in the order the editor shows them.
// The original format keeps each photo at its stored size, so its width and height are 0 here.
export type SocialKind = 'post' | 'story' | 'marketplace' | 'original';

export type SocialFormat = {
	id: string;
	label: string;
	platform: 'instagram' | 'facebook' | 'any';
	kind: SocialKind;
	width: number;
	height: number;
};

export const SOCIAL_FORMATS = [
	{
		id: 'ig-square',
		label: 'Instagram post 1:1',
		platform: 'instagram',
		kind: 'post',
		width: 1080,
		height: 1080
	},
	{
		id: 'ig-portrait',
		label: 'Instagram post 4:5',
		platform: 'instagram',
		kind: 'post',
		width: 1080,
		height: 1350
	},
	{
		id: 'ig-story',
		label: 'Instagram story',
		platform: 'instagram',
		kind: 'story',
		width: 1080,
		height: 1920
	},
	{
		id: 'fb-square',
		label: 'Facebook post 1:1',
		platform: 'facebook',
		kind: 'post',
		width: 1080,
		height: 1080
	},
	{
		id: 'fb-landscape',
		label: 'Facebook post 16:9',
		platform: 'facebook',
		kind: 'post',
		width: 1920,
		height: 1080
	},
	{
		id: 'fb-story',
		label: 'Facebook story',
		platform: 'facebook',
		kind: 'story',
		width: 1080,
		height: 1920
	},
	{
		id: 'fb-marketplace',
		label: 'Facebook Marketplace',
		platform: 'facebook',
		kind: 'marketplace',
		width: 1080,
		height: 1080
	},
	{
		id: 'original',
		label: 'Original size',
		platform: 'any',
		kind: 'original',
		width: 0,
		height: 0
	}
] as const satisfies readonly SocialFormat[];

export type SocialFormatId = (typeof SOCIAL_FORMATS)[number]['id'];

export const isSocialFormat = (value: unknown): value is SocialFormatId =>
	SOCIAL_FORMATS.some((format) => format.id === value);

// Matches the CHECK limits in the product_social_posts migration.
export const MAX_SOCIAL_TEXT = 5000;
