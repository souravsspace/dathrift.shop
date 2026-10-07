<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { manualProofSchema } from '../checkout/manual-proof';
	import { formatBdt as price } from '../site';
	import Icon from './Icon.svelte';

	type Field = 'plan' | 'trx_id' | 'sender_number';

	let {
		reference,
		total,
		shipping,
		expiresAt,
		payTo,
		form
	}: {
		reference: string;
		total: number;
		shipping: number;
		expiresAt: string;
		payTo: string;
		form: { errors?: Partial<Record<Field, string>>; error?: string } | null | undefined;
	} = $props();

	let plan = $state<'full' | 'delivery'>('full');
	let trx = $state('');
	let sender = $state('');
	let sending = $state(false);
	let copied = $state(false);
	let local = $state<Partial<Record<Field, string>>>({});
	let errors = $derived({ ...(form?.errors ?? {}), ...local });
	let amount = $derived(plan === 'delivery' ? shipping : total);
	let onDelivery = $derived(total - shipping);

	// D1 stores UTC as "YYYY-MM-DD HH:MM:SS".
	let deadline = $derived(new Date(`${expiresAt.replace(' ', 'T')}Z`).getTime());
	let now = $state(Date.now());
	let left = $derived(Math.max(0, deadline - now));
	let clock = $derived(
		`${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')}`
	);

	onMount(() => {
		let refreshed = false;
		const tick = setInterval(() => {
			now = Date.now();
			// When time is up the server releases the hold; reload to show it.
			if (!refreshed && deadline - now <= 0) {
				refreshed = true;
				void invalidateAll();
			}
		}, 1000);
		return () => clearInterval(tick);
	});

	let shown = $derived(`${payTo.slice(0, 5)}-${payTo.slice(5)}`);

	async function copyNumber() {
		try {
			await navigator.clipboard.writeText(payTo);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// Clipboard blocked: the number stays visible to type in.
		}
	}
</script>

<section class="pay card" aria-labelledby="pay-title">
	<div class="pay-head">
		<h2 id="pay-title"><Icon name="wallet" size={22} />Pay with bKash</h2>
		<p class="timer" role="timer" aria-live="off">
			<Icon name="clock" size={16} />Pieces held for <strong>{clock}</strong>
		</p>
	</div>

	<form
		method="POST"
		action="?/pay"
		novalidate
		use:enhance={({ cancel }) => {
			const result = manualProofSchema.safeParse({ plan, trx_id: trx, sender_number: sender });
			local = {};
			if (!result.success) {
				for (const issue of result.error.issues) {
					const field = issue.path[0] as Field;
					local[field] ??= issue.message;
				}
				cancel();
				return;
			}
			sending = true;
			return async ({ update }) => {
				await update({ reset: false });
				sending = false;
			};
		}}
	>
		<fieldset class="plans">
			<legend>1. Choose what to send now</legend>
			<label class="plan" class:chosen={plan === 'full'}>
				<input type="radio" name="plan" value="full" bind:group={plan} />
				<span class="plan-text">
					<strong>Full total</strong>
					<span>Nothing to pay at the door.</span>
				</span>
				<span class="price">{price(total)}</span>
			</label>
			<label class="plan" class:chosen={plan === 'delivery'}>
				<input type="radio" name="plan" value="delivery" bind:group={plan} />
				<span class="plan-text">
					<strong>Delivery charge only</strong>
					<span>Pay {price(onDelivery)} in cash when the parcel arrives.</span>
				</span>
				<span class="price">{price(shipping)}</span>
			</label>
			{#if errors.plan}<p class="field-error">
					<Icon name="circle-x" size={16} />{errors.plan}
				</p>{/if}
		</fieldset>

		<div class="send">
			<p class="step-title">2. Send {price(amount)} by bKash Send Money</p>
			<div class="number">
				<span class="number-label"><Icon name="smartphone" size={18} />bKash personal number</span>
				<span class="number-value mono">{shown}</span>
				<button class="button button-outline copy" type="button" onclick={copyNumber}>
					<Icon name={copied ? 'check' : 'copy'} size={18} />{copied ? 'Copied' : 'Copy'}
				</button>
			</div>
			<ol class="how">
				<li>Open the bKash app and tap <strong>Send Money</strong> (not Payment).</li>
				<li>
					Enter <strong class="mono">{payTo}</strong> and the amount
					<strong>{price(amount)}</strong>.
				</li>
				<li>
					Write <strong class="mono">{reference}</strong> as the reference, then confirm with your PIN.
				</li>
				<li>Copy the transaction ID (TrxID) from the confirmation or the SMS.</li>
			</ol>
		</div>

		<fieldset class="proof">
			<legend>3. Tell us about your payment</legend>
			<div class="field">
				<label for="trx-id">bKash transaction ID</label>
				<input
					class="input mono-input"
					id="trx-id"
					name="trx_id"
					bind:value={trx}
					autocomplete="off"
					autocapitalize="characters"
					spellcheck="false"
					maxlength="20"
					placeholder="8N7A6D5C4B"
					aria-invalid={errors.trx_id ? 'true' : undefined}
					aria-describedby={errors.trx_id ? 'trx-error' : undefined}
				/>
				{#if errors.trx_id}<p class="field-error" id="trx-error">
						<Icon name="circle-x" size={16} />{errors.trx_id}
					</p>{/if}
			</div>
			<p class="or"><span>or</span></p>
			<div class="field">
				<label for="sender-number">bKash number you paid from</label>
				<input
					class="input"
					id="sender-number"
					name="sender_number"
					bind:value={sender}
					type="tel"
					inputmode="tel"
					autocomplete="tel"
					placeholder="01712345678"
					aria-invalid={errors.sender_number ? 'true' : undefined}
					aria-describedby={errors.sender_number ? 'sender-error' : undefined}
				/>
				{#if errors.sender_number}<p class="field-error" id="sender-error">
						<Icon name="circle-x" size={16} />{errors.sender_number}
					</p>{/if}
			</div>
		</fieldset>

		{#if form?.error}<p class="form-error" role="alert">
				<Icon name="circle-x" size={18} />{form.error}
			</p>{/if}

		<button class="button button-ink button-block" type="submit" disabled={sending || !left}>
			<Icon name="check" size={18} />{sending ? 'Sending…' : `I have sent ${price(amount)}`}
		</button>
		<p class="hint">
			Your pieces stay held as sold out while we check the payment in bKash. Nothing ships until
			then.
		</p>
	</form>
</section>

<style>
	.pay {
		display: grid;
		gap: 20px;
		padding: clamp(18px, 3vw, 28px);
	}

	.pay-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 10px 20px;
	}

	.pay-head h2 {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 0;
		font-size: var(--text-h3);
		font-stretch: 85%;
		font-weight: 760;
	}

	.pay-head h2 :global(svg) {
		color: var(--color-bottle);
	}

	.timer {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		margin: 0;
		padding: 6px 12px;
		border-radius: 999px;
		background: var(--color-ivory);
		font-size: var(--text-small);
	}

	.timer strong {
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
	}

	form {
		display: grid;
		gap: 22px;
	}

	fieldset {
		display: grid;
		gap: 10px;
		margin: 0;
		padding: 0;
		border: 0;
	}

	legend,
	.step-title {
		margin: 0 0 4px;
		padding: 0;
		font-size: var(--text-body);
		font-weight: 750;
	}

	.plan {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 14px;
		min-height: 64px;
		padding: 12px 16px;
		border: 1.5px solid var(--line-strong);
		border-radius: var(--radius);
		cursor: pointer;
		transition:
			border-color 160ms var(--ease-out),
			background-color 160ms var(--ease-out);
	}

	.plan.chosen {
		border-color: var(--color-ink);
		background: color-mix(in srgb, var(--color-ivory) 55%, transparent);
	}

	.plan input {
		width: 20px;
		height: 20px;
		margin: 0;
		color: var(--color-ink);
	}

	.plan-text {
		display: grid;
		gap: 2px;
	}

	.plan-text span {
		color: var(--color-ink-soft);
		font-size: var(--text-small);
	}

	.plan .price {
		font-size: var(--text-h3);
	}

	.send {
		display: grid;
		gap: 12px;
	}

	.number {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 6px 14px;
		padding: 16px 18px;
		border-radius: var(--radius);
		background: var(--color-ink);
		color: var(--color-paper);
	}

	.number-label {
		display: flex;
		grid-column: 1 / -1;
		align-items: center;
		gap: 8px;
		color: rgb(251 235 214 / 0.72);
		font-size: var(--text-small);
	}

	.number-value {
		font-size: clamp(1.35rem, 5vw, 2rem);
		font-weight: 600;
		letter-spacing: 0.02em;
		white-space: nowrap;
	}

	/* Buyers type this number, so on phones it keeps one line and Copy moves under it. */
	@media (max-width: 480px) {
		.number {
			grid-template-columns: minmax(0, 1fr);
		}

		.copy {
			justify-self: start;
		}
	}

	.copy {
		min-height: 44px;
		padding: 0 16px;
		border-color: rgb(251 235 214 / 0.3);
		background: transparent;
		color: var(--color-paper);
		font-size: var(--text-small);
	}

	.copy:hover:not(:disabled) {
		border-color: var(--color-gold);
	}

	.how {
		display: grid;
		gap: 8px;
		margin: 0;
		padding-left: 22px;
		color: var(--color-ink-soft);
		font-size: var(--text-small);
		line-height: 1.55;
	}

	.how strong {
		color: var(--color-ink);
	}

	.mono-input {
		font-family: var(--font-mono);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.mono-input::placeholder {
		text-transform: none;
	}

	.or {
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 0;
		color: var(--color-ink-soft);
		font-size: var(--text-small);
	}

	.or::before,
	.or::after {
		flex: 1;
		height: 1px;
		background: var(--line);
		content: '';
	}

	.field-error {
		display: flex;
		align-items: flex-start;
		gap: 6px;
		margin: 0;
		color: var(--color-rust);
		font-size: var(--text-small);
		font-weight: 600;
		line-height: 1.45;
	}

	.field-error :global(svg) {
		margin-top: 2px;
	}

	.input[aria-invalid='true'] {
		border-color: var(--color-rust);
	}

	.hint {
		text-align: center;
	}

	@media (max-width: 600px) {
		.plan {
			grid-template-columns: auto minmax(0, 1fr);
		}

		.plan .price {
			grid-column: 2;
		}
	}
</style>
