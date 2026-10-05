import { bkashConfigFrom, bkashProvider, d1TokenStore } from './bkash';
import type { PaymentProvider } from './provider';
import { testWallet } from './test-wallet';

export function paymentProviderFor(
	env: Record<string, unknown>,
	db: Parameters<typeof d1TokenStore>[0],
	isLocalDev: boolean
): PaymentProvider | null {
	const mode = env.PAYMENT_PROVIDER;
	if (mode === 'bkash-sandbox') {
		const config = bkashConfigFrom(env);
		return config ? bkashProvider(config, d1TokenStore(db)) : null;
	}
	if (isLocalDev && (mode === undefined || mode === '' || mode === 'test-wallet'))
		return testWallet;
	return null;
}
