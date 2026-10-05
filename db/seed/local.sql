-- TEST ONLY. Apply with Wrangler --local only. Never use as live merchandise.
INSERT OR IGNORE INTO products
	(id, slug, name, category, brand, price_bdt, publication_state, description,
	 condition_notes, size_label, measurements_json, fit_note)
VALUES
	('test-draft', 'test-unpublished-skirt', 'TEST ONLY — Unpublished skirt', 'bottoms', NULL,
	 900, 'draft', 'Local draft for staff workflow checks.', 'Small hem repair needed.',
	 'M', '{"waist_in":30,"inseam_in":26.5}', 'Relaxed through the leg.'),
	('test-dress', 'test-cream-midi-dress', 'TEST ONLY — Cream midi dress', 'dresses', NULL,
	 1450, 'published', 'Soft cream midi dress for local storefront checks.',
	 'Faint mark near the back hem; photographed.', 'M',
	 '{"chest_in":36,"length_in":44}', 'Relaxed waist, fitted shoulders.'),
	('test-shirt', 'test-olive-cotton-shirt', 'TEST ONLY — Olive cotton shirt', 'tops', NULL,
	 850, 'published', 'Olive cotton button shirt for local storefront checks.',
	 'Light fading at cuffs; all buttons present.', 'L',
	 '{"chest_in":41.5,"length_in":28.5}', 'Boxy fit.'),
	('test-sold', 'test-sold-denim-jacket', 'TEST ONLY — Sold denim jacket', 'outerwear', NULL,
	 1750, 'published', 'Sold-state fixture for local storefront checks.',
	 'Wear at elbows; photographed.', 'M',
	 '{"chest_in":42.5,"length_in":26}', 'Regular fit.');

INSERT OR IGNORE INTO inventory (product_id, state) VALUES
	('test-draft', 'available'),
	('test-dress', 'available'),
	('test-shirt', 'available'),
	('test-sold', 'sold');

INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES
	('test-draft', 1, 'test-only/unpublished-skirt.svg', 'TEST ONLY: skirt illustration'),
	('test-dress', 1, 'test-only/cream-dress.webp', 'Generated test-only cream midi dress visual'),
	('test-shirt', 1, 'test-only/olive-shirt.webp', 'Generated test-only olive shirt visual'),
	('test-sold', 1, 'test-only/denim-jacket.webp', 'Generated test-only denim jacket visual');

-- Keep an existing local fixture database aligned with the current demo assets.
INSERT OR IGNORE INTO delivery_areas (district_key, area_key, display_name, fee_bdt, preview_only)
VALUES ('test-dhaka', 'test-central', 'TEST ONLY — Central area', 80, 1),
	('test-other', 'test-town', 'TEST ONLY — Other town', 130, 1);

UPDATE product_photos SET r2_key = 'test-only/cream-dress.webp',
	alt_text = 'Generated test-only cream midi dress visual'
	WHERE product_id = 'test-dress' AND position = 1;
UPDATE product_photos SET r2_key = 'test-only/olive-shirt.webp',
	alt_text = 'Generated test-only olive shirt visual'
	WHERE product_id = 'test-shirt' AND position = 1;
UPDATE product_photos SET r2_key = 'test-only/denim-jacket.webp',
	alt_text = 'Generated test-only denim jacket visual'
	WHERE product_id = 'test-sold' AND position = 1;

INSERT OR IGNORE INTO home_feature (slot, product_id) VALUES ('hero', 'test-dress');
