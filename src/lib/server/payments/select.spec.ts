import { expect, it } from 'vitest';
import { localDatabase } from '../testing/local-d1';
import { paymentProviderFor } from './select';

const sandbox = {
	PAYMENT_PROVIDER: 'bkash-sandbox',
	BKASH_BASE_URL: 'https://tokenized.sandbox.bka.sh',
	BKASH_USERNAME: 'u',
	BKASH_PASSWORD: 'p',
	BKASH_APP_KEY: 'k',
	BKASH_APP_SECRET: 's'
};

it('enables the local test wallet only in development and bKash only with sandbox config', () => {
	const { db } = localDatabase({ seed: false });
	expect(paymentProviderFor({}, db, true)?.name).toBe('mock');
	expect(paymentProviderFor({}, db, false)).toBeNull();
	expect(paymentProviderFor({ PAYMENT_PROVIDER: 'test-wallet' }, db, false)).toBeNull();
	expect(paymentProviderFor(sandbox, db, false)?.name).toBe('bkash');
	expect(paymentProviderFor({ ...sandbox, BKASH_APP_SECRET: '' }, db, true)).toBeNull();
	expect(paymentProviderFor({ PAYMENT_PROVIDER: 'off' }, db, true)).toBeNull();
});
