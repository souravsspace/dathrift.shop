export const SITE_ORIGIN = 'https://dathrift.shop';

export const categoryLabels: Record<string, string> = {
	tops: 'Tops',
	bottoms: 'Bottoms',
	outerwear: 'Outerwear',
	dresses: 'Dresses'
};

export const formatBdt = (amount: number) => `৳${new Intl.NumberFormat('en-BD').format(amount)}`;
