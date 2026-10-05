CREATE TABLE inventory (
	product_id TEXT PRIMARY KEY NOT NULL REFERENCES products(id),
	state TEXT NOT NULL DEFAULT 'available' CHECK (state IN ('available', 'reserved', 'sold'))
);
