/* global migrate, TextField */

migrate(
	(app) => {
		const products = app.findCollectionByNameOrId('products');
		products.fields.add(new TextField({ name: 'description' }));
		app.save(products);
	},
	(app) => {
		const products = app.findCollectionByNameOrId('products');
		products.fields.removeByName('description');
		app.save(products);
	}
);
