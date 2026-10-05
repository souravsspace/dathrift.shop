<script lang="ts">
	let { current }: { current: 'products' | 'orders' } = $props();
</script>

<header class="admin-header">
	<a class="admin-brand" href="/" aria-label="daThriftShop home">
		<img src="/brand/dathrift-logo.webp" alt="" width="32" height="32" />
		<span>daThriftShop</span>
		<small>Staff</small>
	</a>
	<nav class="admin-nav" aria-label="Staff navigation">
		<a href="/admin" aria-current={current === 'products' ? 'page' : undefined}>Products</a>
		<a href="/admin/orders" aria-current={current === 'orders' ? 'page' : undefined}>Orders</a>
	</nav>
</header>
