CREATE TABLE orders (
	id TEXT PRIMARY KEY NOT NULL,
	status_token TEXT NOT NULL UNIQUE,
	status TEXT NOT NULL DEFAULT 'pending_payment'
		CHECK (status IN ('pending_payment', 'paid', 'payment_review', 'cancelled', 'expired')),
	address_json TEXT NOT NULL CHECK (json_valid(address_json)),
	shipping_bdt INTEGER NOT NULL CHECK (shipping_bdt > 0),
	subtotal_bdt INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_bdt >= 0),
	total_bdt INTEGER NOT NULL CHECK (total_bdt > 0 AND total_bdt <= 9007199254740991),
	preview_only INTEGER NOT NULL DEFAULT 0 CHECK (preview_only IN (0, 1)),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	expires_at TEXT NOT NULL DEFAULT (datetime('now', '+15 minutes'))
);

CREATE TABLE order_items (
	order_id TEXT NOT NULL REFERENCES orders(id),
	product_id TEXT NOT NULL REFERENCES products(id),
	price_bdt INTEGER NOT NULL CHECK (price_bdt > 0),
	PRIMARY KEY (order_id, product_id)
);

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
	UPDATE inventory SET state = 'reserved'
	WHERE product_id = NEW.product_id AND state = 'available';
END;

CREATE TRIGGER sum_order_item
AFTER INSERT ON order_items
BEGIN
	UPDATE orders SET subtotal_bdt = subtotal_bdt + NEW.price_bdt,
		total_bdt = total_bdt + NEW.price_bdt
	WHERE id = NEW.order_id;
END;
