export type ProviderStatus = 'initiated' | 'completed' | 'failed' | 'cancelled' | 'unknown';

export type ProviderPayment = {
	paymentId: string;
	trxId: string | null;
	status: ProviderStatus;
	amountBdt: number;
	currency: string;
	invoice: string;
};

export type CreatePaymentInput = {
	amountBdt: number;
	invoice: string;
	callbackUrl: string;
	payerReference: string;
};

export type PaymentProvider = {
	name: 'bkash' | 'mock';
	create(input: CreatePaymentInput): Promise<{ paymentId: string; redirectUrl: string }>;
	execute(paymentId: string): Promise<ProviderPayment>;
	query(paymentId: string): Promise<ProviderPayment>;
};

// bKash invoice numbers must stay short and alphanumeric; the order UUID without dashes fits.
export const invoiceForOrder = (orderId: string) => orderId.replace(/-/g, '');
