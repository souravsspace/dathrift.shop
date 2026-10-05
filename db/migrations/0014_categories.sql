-- Staff-managed categories. Each one names the measurements its pieces must show before
-- publishing: 'top' (chest, length), 'bottom' (waist, inseam) or 'none' (bags, shoes, jewellery).
PRAGMA defer_foreign_keys = on;

CREATE TABLE categories (
	slug TEXT PRIMARY KEY NOT NULL CHECK (
		length(slug) BETWEEN 1 AND 60 AND slug NOT GLOB '*[^a-z0-9-]*'
		AND slug NOT GLOB '-*' AND slug NOT GLOB '*-' AND slug NOT GLOB '*--*'
	),
	name TEXT NOT NULL UNIQUE COLLATE NOCASE CHECK (length(trim(name)) BETWEEN 1 AND 60),
	measurement_set TEXT NOT NULL CHECK (measurement_set IN ('top', 'bottom', 'none')),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (slug, name, measurement_set) VALUES
	('tops', 'Tops', 'top'),
	('bottoms', 'Bottoms', 'bottom'),
	('outerwear', 'Outerwear', 'top'),
	('dresses', 'Dresses', 'top');

-- SQLite cannot drop the old fixed category CHECK, so rebuild products. Triggers on other
-- tables that read products are dropped first and recreated unchanged at the end; rows are
-- re-inserted after the rename so the deferred foreign keys from child tables resolve again.
DROP TRIGGER touch_product_stock;
DROP TRIGGER reserve_one_off_item;
DROP TRIGGER touch_product_photos;

CREATE TABLE products_copy AS SELECT * FROM products;

CREATE TABLE products_new (
	id TEXT PRIMARY KEY NOT NULL,
	slug TEXT NOT NULL UNIQUE,
	name TEXT NOT NULL,
	category TEXT NOT NULL REFERENCES categories(slug),
	price_bdt INTEGER NOT NULL CHECK (typeof(price_bdt) = 'integer' AND price_bdt > 0),
	publication_state TEXT NOT NULL DEFAULT 'draft' CHECK (publication_state IN ('draft', 'published')),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	brand TEXT,
	description TEXT,
	condition_notes TEXT,
	size_label TEXT,
	measurements_json TEXT CHECK (measurements_json IS NULL OR json_valid(measurements_json)),
	fit_note TEXT,
	updated_at TEXT
);

DROP TABLE products;
ALTER TABLE products_new RENAME TO products;

INSERT INTO products (id, slug, name, category, price_bdt, publication_state, created_at, brand,
	description, condition_notes, size_label, measurements_json, fit_note, updated_at)
SELECT id, slug, name, category, price_bdt, publication_state, created_at, brand,
	description, condition_notes, size_label, measurements_json, fit_note, updated_at
FROM products_copy;

DROP TABLE products_copy;

CREATE TRIGGER stamp_new_product
AFTER INSERT ON products
WHEN NEW.updated_at IS NULL
BEGIN
	UPDATE products SET updated_at = NEW.created_at WHERE id = NEW.id;
END;

CREATE TRIGGER touch_product
AFTER UPDATE ON products
WHEN NEW.updated_at IS OLD.updated_at
BEGIN
	UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER product_slug_not_redirected
BEFORE INSERT ON products
BEGIN
	SELECT RAISE(ABORT, 'Slug unavailable')
	WHERE EXISTS (SELECT 1 FROM slug_redirects WHERE old_slug = NEW.slug);
END;

CREATE TRIGGER product_slug_change_not_redirected
BEFORE UPDATE OF slug ON products
WHEN NEW.slug <> OLD.slug
BEGIN
	SELECT RAISE(ABORT, 'Slug unavailable')
	WHERE EXISTS (SELECT 1 FROM slug_redirects WHERE old_slug = NEW.slug);
END;

CREATE TRIGGER touch_product_stock
AFTER UPDATE OF state ON inventory
WHEN NEW.state <> OLD.state
BEGIN
	UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.product_id;
END;

CREATE TRIGGER reserve_one_off_item
BEFORE INSERT ON order_items
BEGIN
	SELECT RAISE(ABORT, 'Unit unavailable') WHERE NOT EXISTS (
		SELECT 1 FROM products AS p
		JOIN inventory AS i ON i.product_id = p.id
		JOIN orders AS o ON o.id = NEW.order_id
		WHERE p.id = NEW.product_id AND p.publication_state = 'published'
		AND i.state = 'available' AND p.price_bdt = NEW.price_bdt
		AND o.status = 'pending_payment'
	);
	UPDATE inventory SET state = 'reserved', reserved_order_id = NEW.order_id
	WHERE product_id = NEW.product_id AND state = 'available';
END;

CREATE TRIGGER touch_product_photos
AFTER INSERT ON product_photos
BEGIN
	UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.product_id;
END;
