-- The owner picks one published piece to lead the home page. A single 'hero' row; when that
-- piece is sold or unpublished the storefront falls back to the newest available piece.
CREATE TABLE home_feature (
	slot TEXT PRIMARY KEY NOT NULL CHECK (slot = 'hero'),
	product_id TEXT NOT NULL REFERENCES products(id),
	featured_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
