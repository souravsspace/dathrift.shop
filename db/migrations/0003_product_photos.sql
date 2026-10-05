CREATE TABLE product_photos (
	product_id TEXT NOT NULL REFERENCES products(id),
	position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 8),
	r2_key TEXT NOT NULL UNIQUE CHECK (length(trim(r2_key)) > 0),
	alt_text TEXT NOT NULL CHECK (length(trim(alt_text)) > 0),
	PRIMARY KEY (product_id, position)
);
