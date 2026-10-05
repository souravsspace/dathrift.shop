-- Track which order holds each reserved unit so closing one order never frees another's hold.
ALTER TABLE inventory ADD COLUMN reserved_order_id TEXT REFERENCES orders(id);

ALTER TABLE orders ADD COLUMN checkout_key TEXT;
CREATE UNIQUE INDEX orders_checkout_key ON orders(checkout_key);

DROP TRIGGER reserve_one_off_item;
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

CREATE TABLE payments (
	payment_id TEXT PRIMARY KEY NOT NULL,
	order_id TEXT NOT NULL UNIQUE REFERENCES orders(id),
	provider TEXT NOT NULL CHECK (provider IN ('bkash', 'mock')),
	amount_bdt INTEGER NOT NULL CHECK (typeof(amount_bdt) = 'integer' AND amount_bdt > 0),
	status TEXT NOT NULL DEFAULT 'created'
		CHECK (status IN ('created', 'completed', 'failed', 'cancelled')),
	trx_id TEXT UNIQUE,
	redirect_url TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER payment_matches_order_total
BEFORE INSERT ON payments
BEGIN
	SELECT RAISE(ABORT, 'Payment does not match order') WHERE NOT EXISTS (
		SELECT 1 FROM orders
		WHERE id = NEW.order_id AND total_bdt = NEW.amount_bdt AND status = 'pending_payment'
	);
END;

CREATE TABLE order_events (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	order_id TEXT NOT NULL REFERENCES orders(id),
	actor TEXT NOT NULL DEFAULT 'system',
	action TEXT NOT NULL,
	note TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Paid, cancelled and expired are final except for owner review of a late provider success.
CREATE TRIGGER order_status_transition
BEFORE UPDATE OF status ON orders
WHEN OLD.status <> NEW.status
BEGIN
	SELECT RAISE(ABORT, 'Invalid order transition') WHERE NOT (
		(OLD.status = 'pending_payment'
			AND NEW.status IN ('paid', 'cancelled', 'expired', 'payment_review'))
		OR (OLD.status IN ('cancelled', 'expired') AND NEW.status = 'payment_review')
		OR (OLD.status = 'payment_review' AND NEW.status IN ('paid', 'cancelled'))
	);
	SELECT RAISE(ABORT, 'Units not held') WHERE NEW.status = 'paid' AND EXISTS (
		SELECT 1 FROM order_items AS oi
		JOIN inventory AS i ON i.product_id = oi.product_id
		WHERE oi.order_id = NEW.id
		AND (i.state <> 'reserved' OR i.reserved_order_id IS NOT NEW.id)
	);
END;

CREATE TRIGGER sell_paid_order_units
AFTER UPDATE OF status ON orders
WHEN NEW.status = 'paid' AND OLD.status <> 'paid'
BEGIN
	UPDATE inventory SET state = 'sold'
	WHERE reserved_order_id = NEW.id AND state = 'reserved';
END;

CREATE TRIGGER release_closed_order_units
AFTER UPDATE OF status ON orders
WHEN NEW.status IN ('cancelled', 'expired') AND OLD.status <> NEW.status
BEGIN
	UPDATE inventory SET state = 'available', reserved_order_id = NULL
	WHERE reserved_order_id = NEW.id AND state = 'reserved';
END;

CREATE TRIGGER log_order_status
AFTER UPDATE OF status ON orders
WHEN OLD.status <> NEW.status
BEGIN
	INSERT INTO order_events (order_id, action) VALUES (NEW.id, NEW.status);
END;
