export const SITE_ORIGIN = 'https://dathrift.shop';

export const formatBdt = (amount: number) => `৳${new Intl.NumberFormat('en-BD').format(amount)}`;
