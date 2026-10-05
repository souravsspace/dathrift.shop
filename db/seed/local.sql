-- TEST ONLY. Apply with Wrangler --local only. Never use as live merchandise.
INSERT OR IGNORE INTO products
	(id, slug, name, category, brand, price_bdt, publication_state, description,
	 condition_notes, size_label, measurements_json, fit_note)
VALUES
	('test-draft', 'test-unpublished-skirt', 'TEST ONLY — Unpublished skirt', 'bottoms', NULL,
	 900, 'draft', 'Local draft for staff workflow checks.', 'Small hem repair needed.',
	 'M', '{"waist_cm":76,"inseam_cm":67}', 'Relaxed through the leg.'),
	('test-dress', 'test-cream-midi-dress', 'TEST ONLY — Cream midi dress', 'dresses', NULL,
	 1450, 'published', 'Soft cream midi dress for local storefront checks.',
	 'Faint mark near the back hem; photographed.', 'M',
	 '{"chest_cm":92,"length_cm":112}', 'Relaxed waist, fitted shoulders.'),
	('test-shirt', 'test-olive-cotton-shirt', 'TEST ONLY — Olive cotton shirt', 'tops', NULL,
	 850, 'published', 'Olive cotton button shirt for local storefront checks.',
	 'Light fading at cuffs; all buttons present.', 'L',
	 '{"chest_cm":106,"length_cm":73}', 'Boxy fit.'),
	('test-sold', 'test-sold-denim-jacket', 'TEST ONLY — Sold denim jacket', 'outerwear', NULL,
	 1750, 'published', 'Sold-state fixture for local storefront checks.',
	 'Wear at elbows; photographed.', 'M',
	 '{"chest_cm":108,"length_cm":66}', 'Regular fit.');

INSERT OR IGNORE INTO inventory (product_id, state) VALUES
	('test-draft', 'available'),
	('test-dress', 'available'),
	('test-shirt', 'available'),
	('test-sold', 'sold');

INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES
	('test-draft', 1, 'test-only/unpublished-skirt.svg', 'TEST ONLY: skirt illustration'),
	('test-dress', 1, 'test-only/cream-midi-dress.svg', 'TEST ONLY: cream midi dress illustration'),
	('test-shirt', 1, 'test-only/olive-cotton-shirt.svg', 'TEST ONLY: olive shirt illustration'),
	('test-sold', 1, 'test-only/sold-denim-jacket.svg', 'TEST ONLY: denim jacket illustration');
