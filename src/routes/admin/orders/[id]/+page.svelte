<script lang="ts">
	import AdminHeader from '../../../../lib/components/AdminHeader.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let order = $derived(data.order);
	let held = $derived(order.status === 'payment_review' || order.status === 'pending_payment');
	const price = (amount: number) => `৳${new Intl.NumberFormat('en-BD').format(amount)}`;
</script>

<svelte:head>
	<title>Order {data.order.reference} — daThriftShop</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="admin-shell">
	<AdminHeader current="orders" />
	<main class="admin-main">
		<div class="admin-intro">
			<div>
				<h1>Order {order.reference}</h1>
				<p>Created {order.created_at}{order.preview_only ? ' · TEST ONLY order' : ''}</p>
			</div>
		</div>
		{#if form && 'message' in form && form.message}<p class="admin-success" role="status">
				{form.message}
			</p>{/if}
		{#if form && 'error' in form && form.error}<p class="admin-error" role="alert">
				{form.error}
			</p>{/if}

		<div class="admin-columns">
			<section class="admin-panel" aria-labelledby="customer-title">
				<div class="admin-panel-heading"><h2 id="customer-title">Customer and delivery</h2></div>
				<dl class="admin-facts">
					<dt>Name</dt>
					<dd>{order.address.name}</dd>
					<dt>Phone</dt>
					<dd>{order.address.phone}</dd>
					<dt>Address</dt>
					<dd>{order.address.line1}</dd>
					<dt>Area</dt>
					<dd>{order.area ?? `${order.address.district} / ${order.address.area}`}</dd>
				</dl>
				<h2>Pieces</h2>
				<ul class="order-items">
					{#each order.items as item (item.slug)}
						<li><span>{item.name}</span><span>{price(item.price_bdt)}</span></li>
					{/each}
					<li><span>Delivery</span><span>{price(order.shipping_bdt)}</span></li>
					<li><strong>Total</strong><strong>{price(order.total_bdt)}</strong></li>
				</ul>
			</section>

			<section class="admin-panel" aria-labelledby="payment-title">
				<div class="admin-panel-heading"><h2 id="payment-title">Payment</h2></div>
				{#if order.payment}
					<dl class="admin-facts">
						<dt>Provider</dt>
						<dd>{order.payment.provider === 'mock' ? 'Test wallet' : 'bKash'}</dd>
						<dt>Payment ID</dt>
						<dd><code>{order.payment.payment_id}</code></dd>
						<dt>Status</dt>
						<dd>{order.payment.status}</dd>
						<dt>Transaction</dt>
						<dd>{order.payment.trx_id ?? '—'}</dd>
					</dl>
				{:else}
					<p class="admin-hint">No provider payment was created.</p>
				{/if}

				{#if data.is_owner && held && order.payment}
					<div class="admin-review">
						<h2>Owner review</h2>
						<p class="admin-hint">
							Only bKash's own answer can mark this order paid. Close it only after confirming in
							bKash records that no charge stands, or that it was refunded.
						</p>
						<form method="POST" action="?/recheck">
							<button type="submit">Recheck with bKash</button>
						</form>
						<form method="POST" action="?/close">
							<label class="admin-check"
								><input type="checkbox" name="confirm" value="checked-provider" required /> I checked
								bKash records for this payment</label
							>
							<button type="submit">Close order and release pieces</button>
						</form>
					</div>
				{/if}

				{#if order.status === 'paid'}
					<h2>Fulfillment</h2>
					<p class="admin-hint">
						Current: {order.fulfillment?.state ?? 'not started'}{order.fulfillment?.tracking_code
							? ` · ${order.fulfillment.courier ?? 'Courier'} ${order.fulfillment.tracking_code}`
							: ''}
					</p>
					<form method="POST" action="?/fulfillment">
						<label for="fulfillment-state">Fulfillment state</label>
						<select id="fulfillment-state" name="state" required>
							<option value="preparing">Preparing</option>
							<option value="dispatched">Dispatched</option>
							<option value="delivered">Delivered</option>
						</select>
						<label for="fulfillment-courier">Courier</label>
						<input id="fulfillment-courier" name="courier" maxlength="60" placeholder="Steadfast" />
						<label for="fulfillment-tracking">Tracking code</label>
						<input id="fulfillment-tracking" name="tracking_code" maxlength="100" />
						<button type="submit">Update fulfillment</button>
					</form>
				{/if}
			</section>
		</div>

		<section class="admin-panel admin-list" aria-labelledby="history-title">
			<div class="admin-panel-heading"><h2 id="history-title">History</h2></div>
			<ul>
				{#each order.events as event, index (index)}
					<li>
						<div>
							<strong>{event.action}</strong><small
								>{event.actor}{event.note ? ` · ${event.note}` : ''}</small
							>
						</div>
						<div class="admin-row-meta"><small>{event.created_at}</small></div>
					</li>
				{/each}
			</ul>
		</section>
	</main>
</div>
