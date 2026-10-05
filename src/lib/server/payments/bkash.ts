import type { PaymentProvider, ProviderPayment } from './provider';

// Only the bKash sandbox is wired; live checkout needs separate owner approval and a code change.
const SANDBOX_ORIGIN = 'https://tokenized.sandbox.bka.sh';
const API = '/v2/tokenized-checkout';
const TIMEOUT_MS = 30_000;
const REFRESH_MARGIN_MS = 5 * 60_000;

export type BkashConfig = {
	baseUrl: string;
	username: string;
	password: string;
	appKey: string;
	appSecret: string;
};

type StoredToken = {
	idToken: string;
	refreshToken: string;
	expiresAt: number;
	refreshExpiresAt: number;
};

export type TokenStore = {
	read(): Promise<StoredToken | null>;
	write(token: StoredToken): Promise<void>;
};

type Fetch = typeof fetch;

export function bkashConfigFrom(env: Record<string, unknown>): BkashConfig | null {
	const values = [
		env.BKASH_BASE_URL,
		env.BKASH_USERNAME,
		env.BKASH_PASSWORD,
		env.BKASH_APP_KEY,
		env.BKASH_APP_SECRET
	];
	if (values.some((value) => typeof value !== 'string' || !value.trim())) return null;
	const [baseUrl, username, password, appKey, appSecret] = values as string[];
	if (baseUrl.replace(/\/$/, '') !== SANDBOX_ORIGIN) return null;
	return { baseUrl: SANDBOX_ORIGIN, username, password, appKey, appSecret };
}

type TokenDb = {
	prepare(sql: string): {
		bind(...values: (string | number)[]): {
			first(): Promise<Record<string, unknown> | null>;
			run(): Promise<unknown>;
		};
	};
};

export function d1TokenStore(db: TokenDb): TokenStore {
	return {
		async read() {
			const row = await db
				.prepare(
					`SELECT id_token, refresh_token, expires_at, refresh_expires_at
				 FROM payment_tokens WHERE provider = ?`
				)
				.bind('bkash')
				.first();
			if (!row) return null;
			return {
				idToken: row.id_token as string,
				refreshToken: row.refresh_token as string,
				expiresAt: Number(row.expires_at),
				refreshExpiresAt: Number(row.refresh_expires_at)
			};
		},
		async write(token) {
			await db
				.prepare(
					`INSERT INTO payment_tokens
				 (provider, id_token, refresh_token, expires_at, refresh_expires_at)
				 VALUES (?, ?, ?, ?, ?)
				 ON CONFLICT (provider) DO UPDATE SET id_token = excluded.id_token,
				 refresh_token = excluded.refresh_token, expires_at = excluded.expires_at,
				 refresh_expires_at = excluded.refresh_expires_at`
				)
				.bind('bkash', token.idToken, token.refreshToken, token.expiresAt, token.refreshExpiresAt)
				.run();
		}
	};
}

class BkashError extends Error {
	constructor(readonly code: string) {
		super(`bKash error ${code}`);
	}
}

const text = (value: unknown) => (typeof value === 'string' && value ? value : null);

function toPayment(body: Record<string, unknown>): ProviderPayment {
	const paymentId = text(body.paymentId);
	if (!paymentId) throw new BkashError('invalid_response');
	const transactionStatus = body.transactionStatus;
	return {
		paymentId,
		trxId: text(body.trxId),
		status:
			transactionStatus === 'Completed'
				? 'completed'
				: transactionStatus === 'Initiated'
					? 'initiated'
					: 'unknown',
		amountBdt: Number(body.amount),
		currency: String(body.currency ?? ''),
		invoice: String(body.merchantInvoiceNumber ?? body.merchantInvoice ?? '')
	};
}

export function bkashProvider(
	config: BkashConfig,
	tokens: TokenStore,
	fetcher: Fetch = fetch
): PaymentProvider {
	async function post(path: string, body: unknown, headers: Record<string, string>) {
		const response = await fetcher(`${config.baseUrl}${API}${path}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
		let json: Record<string, unknown>;
		try {
			json = await response.json();
		} catch {
			throw new BkashError(`http_${response.status}`);
		}
		if (json.externalCode) throw new BkashError(String(json.externalCode));
		if (!response.ok) throw new BkashError(`http_${response.status}`);
		return json;
	}

	async function token() {
		const now = Date.now();
		const stored = await tokens.read();
		if (stored && stored.expiresAt - REFRESH_MARGIN_MS > now) return stored.idToken;
		const credentials = { username: config.username, password: config.password };
		const body =
			stored && stored.refreshExpiresAt > now
				? await post(
						'/auth/refresh-token',
						{
							app_key: config.appKey,
							app_secret: config.appSecret,
							refresh_token: stored.refreshToken
						},
						credentials
					)
				: await post(
						'/auth/grant-token',
						{ app_key: config.appKey, app_secret: config.appSecret },
						credentials
					);
		const idToken = text(body.id_token);
		const refreshToken = text(body.refresh_token);
		if (body.statusCode !== '0000' || !idToken || !refreshToken)
			throw new BkashError(String(body.statusCode ?? 'token'));
		await tokens.write({
			idToken,
			refreshToken,
			expiresAt: now + Number(body.expires_in ?? 3600) * 1000,
			refreshExpiresAt:
				stored && stored.refreshExpiresAt > now ? stored.refreshExpiresAt : now + 29 * 86_400_000
		});
		return idToken;
	}

	const authorized = async (path: string, body: unknown) =>
		post(path, body, { Authorization: await token(), 'X-App-Key': config.appKey });

	return {
		name: 'bkash',
		async create(input) {
			const body = await authorized('/payment/create', {
				payerReference: input.payerReference,
				callbackURL: input.callbackUrl,
				amount: String(input.amountBdt),
				currency: 'BDT',
				intent: 'sale',
				merchantInvoiceNumber: input.invoice
			});
			const paymentId = text(body.paymentId);
			const redirect = text(body.bkashURL ?? body.bKashURL);
			if (!paymentId || !redirect) throw new BkashError('invalid_response');
			const url = new URL(redirect);
			if (url.protocol !== 'https:' || !/(^|\.)bkash\.com$/.test(url.hostname))
				throw new BkashError('invalid_redirect');
			return { paymentId, redirectUrl: redirect };
		},
		execute: async (paymentId) => toPayment(await authorized('/payment/execute', { paymentId })),
		query: async (paymentId) => toPayment(await authorized('/query/payment', { paymentId }))
	};
}
