CREATE TABLE external_sales (
	id TEXT PRIMARY KEY NOT NULL,
	product_id TEXT NOT NULL UNIQUE REFERENCES products(id),
	actor_email TEXT NOT NULL CHECK (length(trim(actor_email)) > 0),
	reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER external_sale_requires_available
BEFORE INSERT ON external_sales
BEGIN
	SELECT RAISE(ABORT, 'Unit unavailable')
	WHERE NOT EXISTS (
		SELECT 1 FROM inventory
		WHERE product_id = NEW.product_id AND state = 'available'
	);
	UPDATE inventory SET state = 'sold'
	WHERE product_id = NEW.product_id AND state = 'available';
END;
