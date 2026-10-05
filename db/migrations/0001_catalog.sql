CREATE TABLE products (
	id TEXT PRIMARY KEY NOT NULL,
	slug TEXT NOT NULL UNIQUE,
	name TEXT NOT NULL,
	category TEXT NOT NULL CHECK (category IN ('tops', 'bottoms', 'outerwear', 'dresses')),
	price_bdt INTEGER NOT NULL CHECK (typeof(price_bdt) = 'integer' AND price_bdt > 0),
	publication_state TEXT NOT NULL DEFAULT 'draft' CHECK (publication_state IN ('draft', 'published')),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
