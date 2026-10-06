-- A piece with sales or order history is archived instead of deleted, so its records stay intact.
ALTER TABLE products ADD COLUMN archived_at TEXT;

CREATE TRIGGER archived_product_stays_private
BEFORE UPDATE OF publication_state ON products
WHEN NEW.publication_state = 'published' AND NEW.archived_at IS NOT NULL
BEGIN
	SELECT RAISE(ABORT, 'Archived product');
END;
