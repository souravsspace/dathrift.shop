/* global migrate, Collection */

migrate(
	(app) => {
		const products = new Collection({
			type: 'base',
			name: 'products',
			listRule: 'published = true',
			viewRule: 'published = true',
			createRule: null,
			updateRule: null,
			deleteRule: null,
			fields: [
				{
					name: 'slug',
					type: 'text',
					required: true,
					min: 3,
					max: 120,
					pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
				},
				{ name: 'title', type: 'text', required: true, min: 2, max: 140 },
				{ name: 'price_taka', type: 'number', required: true, onlyInt: true, min: 1 },
				{ name: 'published', type: 'bool' },
				{
					name: 'stock_state',
					type: 'select',
					required: true,
					maxSelect: 1,
					values: ['available', 'reserved', 'sold']
				},
				{ name: 'reservation_ref', type: 'text', hidden: true, max: 80 },
				{ name: 'reserved_until', type: 'date', hidden: true }
			],
			indexes: ['CREATE UNIQUE INDEX idx_products_slug ON products (slug)']
		});

		app.save(products);
	},
	(app) => {
		app.delete(app.findCollectionByNameOrId('products'));
	}
);
