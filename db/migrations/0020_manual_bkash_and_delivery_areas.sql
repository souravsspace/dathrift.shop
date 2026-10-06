-- Manual bKash Send Money: until the shop has merchant API access, a buyer sends the amount to
-- the shop's personal bKash number and gives the transaction ID or the number they paid from.
-- Staff confirm it in the bKash app before the order counts as paid.
CREATE TABLE manual_payments (
	order_id TEXT PRIMARY KEY NOT NULL REFERENCES orders(id),
	pay_to TEXT NOT NULL CHECK (pay_to GLOB '01[3-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
	plan TEXT CHECK (plan IN ('full', 'delivery')),
	amount_bdt INTEGER CHECK (amount_bdt IS NULL OR (typeof(amount_bdt) = 'integer' AND amount_bdt > 0)),
	trx_id TEXT UNIQUE CHECK (trx_id IS NULL OR (length(trx_id) BETWEEN 8 AND 12 AND trx_id NOT GLOB '*[^A-Z0-9]*')),
	sender_number TEXT CHECK (sender_number IS NULL OR sender_number GLOB '01[3-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
	submitted_at TEXT,
	reviewed_by TEXT,
	reviewed_at TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CHECK (submitted_at IS NULL OR (plan IS NOT NULL AND amount_bdt IS NOT NULL
		AND (trx_id IS NOT NULL OR sender_number IS NOT NULL)))
);

-- The amount must be the whole order total, or the delivery charge when the rest is paid on delivery.
CREATE TRIGGER manual_payment_matches_order
BEFORE UPDATE OF submitted_at ON manual_payments
WHEN NEW.submitted_at IS NOT NULL
BEGIN
	SELECT RAISE(ABORT, 'Payment does not match order') WHERE NOT EXISTS (
		SELECT 1 FROM orders AS o WHERE o.id = NEW.order_id AND (
			(NEW.plan = 'full' AND NEW.amount_bdt = o.total_bdt)
			OR (NEW.plan = 'delivery' AND NEW.amount_bdt = o.shipping_bdt)
		)
	);
END;

-- Steadfast Regular home delivery from Dhaka, parcels up to 1 kg (steadfast.com.bd/pricing,
-- read 2026-10-07): Dhaka City 75, Dhaka suburbs / Gazipur / Narayanganj 105, elsewhere 135.
INSERT OR IGNORE INTO delivery_areas (district_key, area_key, display_name, fee_bdt, preview_only) VALUES
	('dhaka-city', 'all', 'Dhaka City', 75, 0),
	('dhaka-suburbs', 'all', 'Dhaka suburbs (outside Dhaka City)', 105, 0),
	('bagerhat', 'all', 'Bagerhat', 135, 0),
	('bandarban', 'all', 'Bandarban', 135, 0),
	('barguna', 'all', 'Barguna', 135, 0),
	('barishal', 'all', 'Barishal', 135, 0),
	('bhola', 'all', 'Bhola', 135, 0),
	('bogura', 'all', 'Bogura', 135, 0),
	('brahmanbaria', 'all', 'Brahmanbaria', 135, 0),
	('chandpur', 'all', 'Chandpur', 135, 0),
	('chapainawabganj', 'all', 'Chapainawabganj', 135, 0),
	('chattogram', 'all', 'Chattogram', 135, 0),
	('chuadanga', 'all', 'Chuadanga', 135, 0),
	('coxs-bazar', 'all', 'Cox''s Bazar', 135, 0),
	('cumilla', 'all', 'Cumilla', 135, 0),
	('dinajpur', 'all', 'Dinajpur', 135, 0),
	('faridpur', 'all', 'Faridpur', 135, 0),
	('feni', 'all', 'Feni', 135, 0),
	('gaibandha', 'all', 'Gaibandha', 135, 0),
	('gazipur', 'all', 'Gazipur', 105, 0),
	('gopalganj', 'all', 'Gopalganj', 135, 0),
	('habiganj', 'all', 'Habiganj', 135, 0),
	('jamalpur', 'all', 'Jamalpur', 135, 0),
	('jashore', 'all', 'Jashore', 135, 0),
	('jhalokati', 'all', 'Jhalokati', 135, 0),
	('jhenaidah', 'all', 'Jhenaidah', 135, 0),
	('joypurhat', 'all', 'Joypurhat', 135, 0),
	('khagrachhari', 'all', 'Khagrachhari', 135, 0),
	('khulna', 'all', 'Khulna', 135, 0),
	('kishoreganj', 'all', 'Kishoreganj', 135, 0),
	('kurigram', 'all', 'Kurigram', 135, 0),
	('kushtia', 'all', 'Kushtia', 135, 0),
	('lakshmipur', 'all', 'Lakshmipur', 135, 0),
	('lalmonirhat', 'all', 'Lalmonirhat', 135, 0),
	('madaripur', 'all', 'Madaripur', 135, 0),
	('magura', 'all', 'Magura', 135, 0),
	('manikganj', 'all', 'Manikganj', 135, 0),
	('meherpur', 'all', 'Meherpur', 135, 0),
	('moulvibazar', 'all', 'Moulvibazar', 135, 0),
	('munshiganj', 'all', 'Munshiganj', 135, 0),
	('mymensingh', 'all', 'Mymensingh', 135, 0),
	('naogaon', 'all', 'Naogaon', 135, 0),
	('narail', 'all', 'Narail', 135, 0),
	('narayanganj', 'all', 'Narayanganj', 105, 0),
	('narsingdi', 'all', 'Narsingdi', 135, 0),
	('natore', 'all', 'Natore', 135, 0),
	('netrokona', 'all', 'Netrokona', 135, 0),
	('nilphamari', 'all', 'Nilphamari', 135, 0),
	('noakhali', 'all', 'Noakhali', 135, 0),
	('pabna', 'all', 'Pabna', 135, 0),
	('panchagarh', 'all', 'Panchagarh', 135, 0),
	('patuakhali', 'all', 'Patuakhali', 135, 0),
	('pirojpur', 'all', 'Pirojpur', 135, 0),
	('rajbari', 'all', 'Rajbari', 135, 0),
	('rajshahi', 'all', 'Rajshahi', 135, 0),
	('rangamati', 'all', 'Rangamati', 135, 0),
	('rangpur', 'all', 'Rangpur', 135, 0),
	('satkhira', 'all', 'Satkhira', 135, 0),
	('shariatpur', 'all', 'Shariatpur', 135, 0),
	('sherpur', 'all', 'Sherpur', 135, 0),
	('sirajganj', 'all', 'Sirajganj', 135, 0),
	('sunamganj', 'all', 'Sunamganj', 135, 0),
	('sylhet', 'all', 'Sylhet', 135, 0),
	('tangail', 'all', 'Tangail', 135, 0),
	('thakurgaon', 'all', 'Thakurgaon', 135, 0);
