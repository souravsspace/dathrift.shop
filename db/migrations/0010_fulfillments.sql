-- Fulfillment is separate from payment and only exists for provider-verified paid orders.
CREATE TABLE fulfillments (
	order_id TEXT PRIMARY KEY NOT NULL REFERENCES orders(id),
	state TEXT NOT NULL CHECK (state IN ('preparing', 'dispatched', 'delivered')),
	courier TEXT,
	tracking_code TEXT CHECK (tracking_code IS NULL OR length(trim(tracking_code)) BETWEEN 1 AND 100),
	actor_email TEXT NOT NULL CHECK (length(trim(actor_email)) > 0),
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER fulfillment_requires_paid_order
BEFORE INSERT ON fulfillments
BEGIN
	SELECT RAISE(ABORT, 'Order not paid')
	WHERE NOT EXISTS (SELECT 1 FROM orders WHERE id = NEW.order_id AND status = 'paid');
END;

CREATE TRIGGER fulfillment_moves_forward
BEFORE UPDATE OF state ON fulfillments
WHEN OLD.state <> NEW.state
BEGIN
	SELECT RAISE(ABORT, 'Invalid fulfillment transition') WHERE NOT (
		(OLD.state = 'preparing' AND NEW.state = 'dispatched')
		OR (OLD.state = 'dispatched' AND NEW.state = 'delivered')
	);
END;

CREATE TRIGGER log_fulfillment
AFTER UPDATE ON fulfillments
BEGIN
	INSERT INTO order_events (order_id, actor, action, note)
	VALUES (NEW.order_id, NEW.actor_email, 'fulfillment_' || NEW.state, NEW.tracking_code);
END;

CREATE TRIGGER log_fulfillment_start
AFTER INSERT ON fulfillments
BEGIN
	INSERT INTO order_events (order_id, actor, action, note)
	VALUES (NEW.order_id, NEW.actor_email, 'fulfillment_' || NEW.state, NEW.tracking_code);
END;
