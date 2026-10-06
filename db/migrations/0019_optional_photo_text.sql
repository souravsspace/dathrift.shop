-- A photo description is optional. A blank one is stored as '' and the storefront falls back to
-- the piece name and photo number. SQLite cannot drop the old nonblank CHECK, so rebuild the table.
CREATE TABLE product_photos_new (
	product_id TEXT NOT NULL REFERENCES products(id),
	position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 10),
	r2_key TEXT NOT NULL UNIQUE CHECK (length(trim(r2_key)) > 0),
	alt_text TEXT NOT NULL DEFAULT '',
	PRIMARY KEY (product_id, position)
);

INSERT INTO product_photos_new (product_id, position, r2_key, alt_text)
SELECT product_id, position, r2_key, alt_text FROM product_photos;

DROP TABLE product_photos;
ALTER TABLE product_photos_new RENAME TO product_photos;

CREATE TRIGGER touch_product_photos
AFTER INSERT ON product_photos
BEGIN
	UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.product_id;
END;
