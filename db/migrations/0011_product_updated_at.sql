-- Truthful sitemap lastmod: products record when their page content or stock state changed.
ALTER TABLE products ADD COLUMN updated_at TEXT;
UPDATE products SET updated_at = created_at;

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

CREATE TRIGGER touch_product_stock
AFTER UPDATE OF state ON inventory
WHEN NEW.state <> OLD.state
BEGIN
	UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.product_id;
END;

CREATE TRIGGER touch_product_photos
AFTER INSERT ON product_photos
BEGIN
	UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.product_id;
END;
