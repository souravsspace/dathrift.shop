<script lang="ts">
	import { enhance } from '$app/forms';
	import AdminHeader from '../../../../lib/components/AdminHeader.svelte';
	import AdminToast from '../../../../lib/components/AdminToast.svelte';
	import { bangladeshTime } from '../../../../lib/admin-time';
	import { actorLabel, eventLabel, orderStage, stageLabels } from '../../../../lib/order-stage';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let order = $derived(data.order);
	let held = $derived(order.status === 'payment_review' || order.status === 'pending_payment');
	let stage = $derived(orderStage(order.status, order.fulfillment?.state));
	const price = (amount: number) => `৳${new Intl.NumberFormat('en-BD').format(amount)}`;

	const steps = ['preparing', 'dispatched', 'delivered'] as const;
	const stepLabels: Record<(typeof steps)[number], string> = {
		preparing: 'Preparing',
		dispatched: 'Dispatched',
		delivered: 'Delivered'
	};
	const couriers = ['Pathao', 'Steadfast'];
	const paymentLabels: Record<string, string> = {
		created: 'Started, not completed',
		completed: 'Completed',
		failed: 'Failed',
		cancelled: 'Cancelled'
	};
	// Fulfillment only moves forward, one step at a time.
	let reached = $derived(order.fulfillment ? steps.indexOf(order.fulfillment.state) : -1);
	let next = $derived(steps[reached + 1] ?? null);

	// The result of the last form post shows once, until it leaves or staff close it.
	let dismissed = $state.raw<ActionData | null>(null);
	let notice = $derived(
		!form || form === dismissed
			? null
			: 'error' in form && form.error
				? { kind: 'error' as const, text: form.error }
				: 'message' in form && form.message
					? { kind: 'success' as const, text: form.message }
					: null
	);
	let manual = $derived(order.manual);
	let checkable = $derived(
		order.status === 'payment_review' && !!manual?.submitted_at && !manual.reviewed_at
	);
	// With "delivery charge only", the courier collects the rest in cash.
	let collect = $derived(manual?.plan === 'delivery' ? order.total_bdt - order.shipping_bdt : 0);
	let phoneHref = $derived(`tel:${order.address.phone.replace(/[^\d+]/g, '')}`);
</script>

<svelte:head>
	<title>Order {data.order.reference} — daThriftShop</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="admin-shell">
	<AdminHeader current="orders" />
	<main class="admin-main admin-editor">
		<a class="admin-back" href="/admin/orders"
			><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5" /></svg>Back to
			orders</a
		>
		<header class="admin-head">
			<h1>Order {order.reference}</h1>
			<p class="admin-head-meta">
				<span>Placed {bangladeshTime(order.created_at)}</span>
				<span class="order-head-total">{price(order.total_bdt)}</span>
				{#if order.preview_only}<span class="admin-chip">Test only</span>{/if}
			</p>
			<div class="admin-stamps">
				<span class="desk-status order-stage-{stage}">{stageLabels[stage]}</span>
			</div>
		</header>

		{#if data.is_owner && held && order.payment}
			<section class="admin-panel order-review" aria-labelledby="review-title">
				<div class="admin-panel-head"><h2 id="review-title">Owner review</h2></div>
				<p class="admin-hint">
					Only bKash's own answer can mark this order paid. Close it only after confirming in bKash
					records that no charge stands, or that it was refunded.
				</p>
				<div class="order-review-actions">
					<form method="POST" action="?/recheck" use:enhance>
						<button type="submit">Recheck with bKash</button>
					</form>
					<form method="POST" action="?/close" use:enhance>
						<label class="admin-check"
							><input type="checkbox" name="confirm" value="checked-provider" required /> I checked bKash
							records for this payment</label
						>
						<button type="submit" class="admin-action-outline"
							>Close order and release pieces</button
						>
					</form>
				</div>
			</section>
		{:else if order.status === 'payment_review' && !manual}
			<p class="admin-held-note" role="status">
				The owner needs to check this payment in bKash before anything else happens.
			</p>
		{/if}

		{#if checkable && manual}
			<section class="admin-panel order-review" aria-labelledby="manual-check-title">
				<div class="admin-panel-head">
					<h2 id="manual-check-title">Check the bKash payment</h2>
				</div>
				<p class="admin-hint">
					Open the bKash app for {manual.pay_to} and look for a Send Money of
					<strong>{price(manual.amount_bdt ?? 0)}</strong>{#if manual.trx_id}&nbsp;with transaction
						ID
						<code>{manual.trx_id}</code>{/if}{#if manual.sender_number}&nbsp;{manual.trx_id
							? 'or '
							: ''}from
						<strong>{manual.sender_number}</strong>{/if}. The pieces stay held as sold out until you
					decide.
				</p>
				<div class="order-review-actions">
					<form method="POST" action="?/confirmManual" use:enhance>
						<label class="admin-check"
							><input type="checkbox" name="confirm" value="found-in-bkash" required /> I found this payment
							in the bKash app</label
						>
						<button type="submit">Payment found · mark paid</button>
					</form>
					<form method="POST" action="?/rejectManual" use:enhance>
						<label class="admin-check"
							><input type="checkbox" name="confirm" value="not-in-bkash" required /> I could not find
							it in bKash</label
						>
						<button type="submit" class="admin-action-outline"
							>Not found · close order and release pieces</button
						>
					</form>
				</div>
			</section>
		{/if}

		<div class="admin-layout order-layout">
			<div class="admin-layout-main">
				{#if order.status === 'paid'}
					<section class="admin-panel order-fulfillment" aria-labelledby="fulfillment-title">
						<div class="admin-panel-head"><h2 id="fulfillment-title">Fulfillment</h2></div>
						{#if collect}<p class="admin-held-note" role="note">
								Cash on delivery: the courier must collect <strong>{price(collect)}</strong>. The
								buyer paid only the delivery charge by bKash.
							</p>{/if}
						<ol class="order-steps">
							{#each steps as step, index (step)}
								<li
									class:done={index <= reached}
									aria-current={index === reached ? 'step' : undefined}
								>
									<span class="order-step-mark" aria-hidden="true"
										>{#if index <= reached}<svg viewBox="0 0 20 20"
												><path d="M5.5 10.5l3 3 6-7" /></svg
											>{:else}{index + 1}{/if}</span
									>
									<span class="order-step-text">
										<strong>{stepLabels[step]}</strong>
										{#if step === 'dispatched' && index <= reached && order.fulfillment?.tracking_code}<small
												>{order.fulfillment.courier ?? 'Courier'} · {order.fulfillment
													.tracking_code}</small
											>{/if}
									</span>
								</li>
							{/each}
						</ol>
						{#if next}
							<form class="order-next" method="POST" action="?/fulfillment" use:enhance>
								<input type="hidden" name="state" value={next} />
								{#if next === 'preparing'}
									<p class="order-next-title">Start packing this order</p>
									<p class="admin-hint">Marks the parcel as being prepared. Nothing is sent yet.</p>
									<button type="submit">Start preparing</button>
								{:else if next === 'dispatched'}
									<p class="order-next-title">Hand the parcel to a courier</p>
									<fieldset class="order-couriers">
										<legend>Courier</legend>
										{#each couriers as courier (courier)}
											<label
												><input type="radio" name="courier" value={courier} required /><span
													>{courier}</span
												></label
											>
										{/each}
									</fieldset>
									<label for="fulfillment-tracking">Tracking code</label>
									<input
										id="fulfillment-tracking"
										name="tracking_code"
										maxlength="100"
										required
										autocapitalize="characters"
										autocomplete="off"
										spellcheck="false"
									/>
									<button type="submit">Mark dispatched</button>
								{:else}
									<p class="order-next-title">Confirm the buyer has it</p>
									<p class="admin-hint">
										{order.fulfillment?.courier ?? 'Courier'} · {order.fulfillment?.tracking_code ??
											'no tracking code'}
									</p>
									<button type="submit">Mark delivered</button>
								{/if}
							</form>
						{:else}
							<p class="order-next order-next-done">Delivered. Nothing left to do on this order.</p>
						{/if}
					</section>
				{/if}

				<section class="admin-panel order-pieces" aria-labelledby="pieces-title">
					<div class="admin-panel-head">
						<h2 id="pieces-title">Pieces</h2>
						<p>{order.items.length} {order.items.length === 1 ? 'piece' : 'pieces'}</p>
					</div>
					<ul class="order-lines">
						{#each order.items as item (item.slug)}
							<li>
								<span
									>{item.name}{#if item.code}<small class="order-item-code">{item.code}</small
										>{/if}</span
								><span>{price(item.price_bdt)}</span>
							</li>
						{/each}
						<li class="order-line-quiet">
							<span>Delivery</span><span>{price(order.shipping_bdt)}</span>
						</li>
						<li class="order-line-total">
							<span>Total</span><span>{price(order.total_bdt)}</span>
						</li>
					</ul>
				</section>

				<section class="admin-panel order-history-panel" aria-labelledby="history-title">
					<div class="admin-panel-head"><h2 id="history-title">History</h2></div>
					<ol class="order-history">
						{#each order.events as event, index (index)}
							<li>
								<strong>{eventLabel(event.action)}</strong>
								<small
									>{actorLabel(event.actor)}{event.note ? ` · ${event.note}` : ''} · {bangladeshTime(
										event.created_at
									)}</small
								>
							</li>
						{/each}
					</ol>
				</section>
			</div>

			<div class="admin-layout-side">
				<section class="admin-panel order-contact-panel" aria-labelledby="customer-title">
					<div class="admin-panel-head"><h2 id="customer-title">Deliver to</h2></div>
					<div class="order-contact">
						<strong>{order.address.name}</strong>
						<a href={phoneHref}>{order.address.phone}</a>
						<p>{order.address.line1}</p>
						<p>{order.area ?? `${order.address.district} / ${order.address.area}`}</p>
					</div>
				</section>

				<section class="admin-panel order-payment" aria-labelledby="payment-title">
					<div class="admin-panel-head"><h2 id="payment-title">Payment</h2></div>
					{#if order.payment}
						<dl class="admin-facts">
							<dt>Provider</dt>
							<dd>{order.payment.provider === 'mock' ? 'Test wallet' : 'bKash'}</dd>
							<dt>Status</dt>
							<dd>{paymentLabels[order.payment.status] ?? order.payment.status}</dd>
							<dt>Amount</dt>
							<dd>{price(order.payment.amount_bdt)}</dd>
							<dt>Payment ID</dt>
							<dd><code>{order.payment.payment_id}</code></dd>
							<dt>Transaction</dt>
							<dd><code>{order.payment.trx_id ?? '—'}</code></dd>
						</dl>
					{:else if manual}
						<dl class="admin-facts">
							<dt>Method</dt>
							<dd>bKash Send Money to {manual.pay_to}</dd>
							{#if manual.submitted_at}
								<dt>Sent</dt>
								<dd>
									{price(manual.amount_bdt ?? 0)} · {manual.plan === 'delivery'
										? 'delivery charge only'
										: 'full total'}
								</dd>
								<dt>Transaction</dt>
								<dd><code>{manual.trx_id ?? '—'}</code></dd>
								<dt>Paid from</dt>
								<dd>{manual.sender_number ?? '—'}</dd>
								<dt>Reported</dt>
								<dd>{bangladeshTime(manual.submitted_at)}</dd>
								{#if collect}<dt>Cash on delivery</dt>
									<dd>{price(collect)}</dd>{/if}
								{#if manual.reviewed_by}<dt>Checked by</dt>
									<dd>{actorLabel(manual.reviewed_by)}</dd>{/if}
							{:else}
								<dt>Status</dt>
								<dd>
									Waiting for the buyer to send money (hold ends {bangladeshTime(order.expires_at)})
								</dd>
							{/if}
						</dl>
					{:else}
						<p class="admin-hint">No provider payment was created.</p>
					{/if}
				</section>
			</div>
		</div>
		{#if notice}<AdminToast
				kind={notice.kind}
				text={notice.text}
				onclose={() => (dismissed = form)}
			/>{/if}
	</main>
</div>
