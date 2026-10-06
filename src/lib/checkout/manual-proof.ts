import { z } from 'zod';
import { PHONE_MESSAGE, isMobile, normalizePhone } from './address';

/** Upper case without spaces or dashes, as bKash prints it (for example 8N7A6D5C4B). */
export const normalizeTrxId = (value: string) => value.replace(/[\s-]/g, '').toUpperCase();

const optional = z
	.string()
	.optional()
	.transform((value) => value?.trim() ?? '');

// What a buyer gives after sending money by bKash: the amount they chose, and the transaction ID
// or the number they paid from (either is enough for staff to find the payment).
export const manualProofSchema = z
	.object({
		plan: optional,
		trx_id: optional,
		sender_number: optional
	})
	.transform((proof, context) => {
		// Checked here rather than with z.enum so every field reports at once.
		const plans = ['full', 'delivery'] as const;
		const plan = plans.find((value) => value === proof.plan) ?? null;
		if (!plan)
			context.addIssue({ code: 'custom', path: ['plan'], message: 'Choose how much you sent.' });
		const trx = normalizeTrxId(proof.trx_id);
		const sender = normalizePhone(proof.sender_number);
		if (!trx && !sender)
			context.addIssue({
				code: 'custom',
				path: ['trx_id'],
				message: 'Enter the transaction ID or the bKash number you paid from.'
			});
		if (trx && !/^[A-Z0-9]{8,12}$/.test(trx))
			context.addIssue({
				code: 'custom',
				path: ['trx_id'],
				message: 'A bKash transaction ID is 8 to 12 letters and numbers, like 8N7A6D5C4B.'
			});
		if (sender && !isMobile(sender))
			context.addIssue({ code: 'custom', path: ['sender_number'], message: PHONE_MESSAGE });
		return {
			plan: plan ?? 'full',
			trx_id: trx || null,
			sender_number: sender || null
		};
	});

export type ManualProof = z.output<typeof manualProofSchema>;
