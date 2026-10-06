-- TEST ONLY demo pieces and orders for the local admin. Apply with Wrangler --local only.
-- Every statement runs only when its row is missing, so applying it twice changes nothing.

INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-01', 'test-demo-indigo-block-print-kurta', 'TEST ONLY — Indigo block-print kurta', 'tops', 1150, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'M',
	'{"chest_in":39,"length_in":26.5}', 'TEST ONLY — demo fit.', '2026-09-08 05:01:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-01');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-01', 1, 'test-only/demo/01.webp', 'TEST ONLY: indigo block-print kurta');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-02', 'test-demo-mustard-knit-cardigan', 'TEST ONLY — Mustard knit cardigan', 'outerwear', 1350, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'L',
	'{"chest_in":44,"length_in":29}', 'TEST ONLY — demo fit.', '2026-09-15 05:02:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-02');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-02', 1, 'test-only/demo/02.webp', 'TEST ONLY: mustard knit cardigan');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-03', 'test-demo-black-pleated-midi-skirt', 'TEST ONLY — Black pleated midi skirt', 'bottoms', 950, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'S',
	'{"waist_in":31,"inseam_in":29.5}', 'TEST ONLY — demo fit.', '2026-09-22 05:03:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-03');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-03', 1, 'test-only/demo/03.webp', 'TEST ONLY: black pleated midi skirt');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-04', 'test-demo-rose-silk-slip-dress', 'TEST ONLY — Rose silk slip dress', 'dresses', 1850, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'S',
	'{"chest_in":34,"length_in":44.5}', 'TEST ONLY — demo fit.', '2026-09-29 05:04:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-04');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-04', 1, 'test-only/demo/04.webp', 'TEST ONLY: rose silk slip dress');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-05', 'test-demo-grey-wool-trousers', 'TEST ONLY — Grey wool trousers', 'bottoms', 1250, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'M',
	'{"waist_in":33,"inseam_in":29.5}', 'TEST ONLY — demo fit.', '2026-09-01 05:05:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-05');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-05', 1, 'test-only/demo/05.webp', 'TEST ONLY: grey wool trousers');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-06', 'test-demo-white-poplin-shirt', 'TEST ONLY — White poplin shirt', 'tops', 780, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'L',
	'{"chest_in":38,"length_in":26.5}', 'TEST ONLY — demo fit.', '2026-09-08 05:06:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-06');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-06', 1, 'test-only/demo/06.webp', 'TEST ONLY: white poplin shirt');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-07', 'test-demo-olive-field-jacket', 'TEST ONLY — Olive field jacket', 'outerwear', 2100, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'L',
	'{"chest_in":44,"length_in":29}', 'TEST ONLY — demo fit.', '2026-09-15 05:07:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-07');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-07', 1, 'test-only/demo/07.webp', 'TEST ONLY: olive field jacket');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-08', 'test-demo-teal-wrap-dress', 'TEST ONLY — Teal wrap dress', 'dresses', 1400, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'M',
	'{"chest_in":34,"length_in":44.5}', 'TEST ONLY — demo fit.', '2026-09-22 05:08:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-08');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-08', 1, 'test-only/demo/08.webp', 'TEST ONLY: teal wrap dress');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-09', 'test-demo-cream-cable-jumper', 'TEST ONLY — Cream cable jumper', 'tops', 1100, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'M',
	'{"chest_in":41,"length_in":26.5}', 'TEST ONLY — demo fit.', '2026-09-29 05:09:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-09');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-09', 1, 'test-only/demo/09.webp', 'TEST ONLY: cream cable jumper');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-10', 'test-demo-brown-leather-jacket', 'TEST ONLY — Brown leather jacket', 'outerwear', 3200, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'M',
	'{"chest_in":42,"length_in":29}', 'TEST ONLY — demo fit.', '2026-09-01 05:10:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-10');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-10', 1, 'test-only/demo/10.webp', 'TEST ONLY: brown leather jacket');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-11', 'test-demo-navy-chinos', 'TEST ONLY — Navy chinos', 'bottoms', 900, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'L',
	'{"waist_in":33,"inseam_in":29.5}', 'TEST ONLY — demo fit.', '2026-09-08 05:11:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-11');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-11', 1, 'test-only/demo/11.webp', 'TEST ONLY: navy chinos');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-12', 'test-demo-floral-tea-dress', 'TEST ONLY — Floral tea dress', 'dresses', 1250, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'S',
	'{"chest_in":34,"length_in":44.5}', 'TEST ONLY — demo fit.', '2026-09-15 05:12:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-12');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-12', 1, 'test-only/demo/12.webp', 'TEST ONLY: floral tea dress');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-13', 'test-demo-striped-boat-neck-tee', 'TEST ONLY — Striped boat-neck tee', 'tops', 550, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'S',
	'{"chest_in":39,"length_in":26.5}', 'TEST ONLY — demo fit.', '2026-09-22 05:13:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-13');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-13', 1, 'test-only/demo/13.webp', 'TEST ONLY: striped boat-neck tee');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-14', 'test-demo-camel-trench-coat', 'TEST ONLY — Camel trench coat', 'outerwear', 2800, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'M',
	'{"chest_in":46,"length_in":29}', 'TEST ONLY — demo fit.', '2026-09-29 05:14:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-14');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-14', 1, 'test-only/demo/14.webp', 'TEST ONLY: camel trench coat');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-15', 'test-demo-rust-linen-trousers', 'TEST ONLY — Rust linen trousers', 'bottoms', 1050, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'M',
	'{"waist_in":31,"inseam_in":29.5}', 'TEST ONLY — demo fit.', '2026-09-01 05:15:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-15');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-15', 1, 'test-only/demo/15.webp', 'TEST ONLY: rust linen trousers');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-16', 'test-demo-black-velvet-blazer', 'TEST ONLY — Black velvet blazer', 'outerwear', 2400, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'M',
	'{"chest_in":43,"length_in":29}', 'TEST ONLY — demo fit.', '2026-09-08 05:16:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-16');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-16', 1, 'test-only/demo/16.webp', 'TEST ONLY: black velvet blazer');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-17', 'test-demo-sage-shirt-dress', 'TEST ONLY — Sage shirt dress', 'dresses', 1300, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'L',
	'{"chest_in":35,"length_in":44.5}', 'TEST ONLY — demo fit.', '2026-09-15 05:17:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-17');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-17', 1, 'test-only/demo/17.webp', 'TEST ONLY: sage shirt dress');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-18', 'test-demo-denim-overshirt', 'TEST ONLY — Denim overshirt', 'tops', 1200, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'L',
	'{"chest_in":38,"length_in":26.5}', 'TEST ONLY — demo fit.', '2026-09-22 05:18:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-18');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-18', 1, 'test-only/demo/18.webp', 'TEST ONLY: denim overshirt');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-19', 'test-demo-plum-corduroy-skirt', 'TEST ONLY — Plum corduroy skirt', 'bottoms', 850, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'S',
	'{"waist_in":29,"inseam_in":29.5}', 'TEST ONLY — demo fit.', '2026-09-29 05:19:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-19');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-19', 1, 'test-only/demo/19.webp', 'TEST ONLY: plum corduroy skirt');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-20', 'test-demo-charcoal-peacoat', 'TEST ONLY — Charcoal peacoat', 'outerwear', 2600, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'L',
	'{"chest_in":42,"length_in":29}', 'TEST ONLY — demo fit.', '2026-09-01 05:20:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-20');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-20', 1, 'test-only/demo/20.webp', 'TEST ONLY: charcoal peacoat');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-21', 'test-demo-lemon-cotton-blouse', 'TEST ONLY — Lemon cotton blouse', 'tops', 700, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'S',
	'{"chest_in":41,"length_in":26.5}', 'TEST ONLY — demo fit.', '2026-09-08 05:21:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-21');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-21', 1, 'test-only/demo/21.webp', 'TEST ONLY: lemon cotton blouse');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-22', 'test-demo-emerald-satin-dress', 'TEST ONLY — Emerald satin dress', 'dresses', 1950, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'M',
	'{"chest_in":36,"length_in":44.5}', 'TEST ONLY — demo fit.', '2026-09-15 05:22:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-22');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-22', 1, 'test-only/demo/22.webp', 'TEST ONLY: emerald satin dress');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-23', 'test-demo-khaki-cargo-trousers', 'TEST ONLY — Khaki cargo trousers', 'bottoms', 980, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'L',
	'{"waist_in":33,"inseam_in":29.5}', 'TEST ONLY — demo fit.', '2026-09-22 05:23:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-23');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-23', 1, 'test-only/demo/23.webp', 'TEST ONLY: khaki cargo trousers');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-24', 'test-demo-ivory-crochet-top', 'TEST ONLY — Ivory crochet top', 'tops', 880, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'M',
	'{"chest_in":38,"length_in":26.5}', 'TEST ONLY — demo fit.', '2026-09-29 05:24:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-24');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-24', 1, 'test-only/demo/24.webp', 'TEST ONLY: ivory crochet top');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-25', 'test-demo-burgundy-midi-dress', 'TEST ONLY — Burgundy midi dress', 'dresses', 1500, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'M',
	'{"chest_in":35,"length_in":44.5}', 'TEST ONLY — demo fit.', '2026-09-01 05:25:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-25');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-25', 1, 'test-only/demo/25.webp', 'TEST ONLY: burgundy midi dress');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-26', 'test-demo-light-wash-jeans', 'TEST ONLY — Light-wash jeans', 'bottoms', 1100, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'M',
	'{"waist_in":30,"inseam_in":29.5}', 'TEST ONLY — demo fit.', '2026-09-08 05:26:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-26');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-26', 1, 'test-only/demo/26.webp', 'TEST ONLY: light-wash jeans');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-27', 'test-demo-checked-flannel-shirt', 'TEST ONLY — Checked flannel shirt', 'tops', 750, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'L',
	'{"chest_in":41,"length_in":26.5}', 'TEST ONLY — demo fit.', '2026-09-15 05:27:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-27');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-27', 1, 'test-only/demo/27.webp', 'TEST ONLY: checked flannel shirt');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-28', 'test-demo-navy-quilted-vest', 'TEST ONLY — Navy quilted vest', 'outerwear', 1450, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'M',
	'{"chest_in":45,"length_in":29}', 'TEST ONLY — demo fit.', '2026-09-22 05:28:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-28');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-28', 1, 'test-only/demo/28.webp', 'TEST ONLY: navy quilted vest');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-29', 'test-demo-polka-dot-sundress', 'TEST ONLY — Polka-dot sundress', 'dresses', 1050, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'S',
	'{"chest_in":35,"length_in":44.5}', 'TEST ONLY — demo fit.', '2026-09-29 05:29:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-29');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-29', 1, 'test-only/demo/29.webp', 'TEST ONLY: polka-dot sundress');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-30', 'test-demo-tan-suede-skirt', 'TEST ONLY — Tan suede skirt', 'bottoms', 1600, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'S',
	'{"waist_in":28,"inseam_in":29.5}', 'TEST ONLY — demo fit.', '2026-09-01 05:30:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-30');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-30', 1, 'test-only/demo/30.webp', 'TEST ONLY: tan suede skirt');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-31', 'test-demo-grey-hoodie', 'TEST ONLY — Grey hoodie', 'tops', 820, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'L',
	'{"chest_in":39,"length_in":26.5}', 'TEST ONLY — demo fit.', '2026-09-08 05:31:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-31');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-31', 1, 'test-only/demo/31.webp', 'TEST ONLY: grey hoodie');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-32', 'test-demo-forest-parka', 'TEST ONLY — Forest parka', 'outerwear', 2900, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'XL',
	'{"chest_in":44,"length_in":29}', 'TEST ONLY — demo fit.', '2026-09-15 05:32:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-32');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-32', 1, 'test-only/demo/32.webp', 'TEST ONLY: forest parka');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-33', 'test-demo-lilac-knit-dress', 'TEST ONLY — Lilac knit dress', 'dresses', 1350, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'M',
	'{"chest_in":35,"length_in":44.5}', 'TEST ONLY — demo fit.', '2026-09-22 05:33:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-33');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-33', 1, 'test-only/demo/33.webp', 'TEST ONLY: lilac knit dress');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-34', 'test-demo-black-wide-leg-trousers', 'TEST ONLY — Black wide-leg trousers', 'bottoms', 1150, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'M',
	'{"waist_in":32,"inseam_in":29.5}', 'TEST ONLY — demo fit.', '2026-09-29 05:34:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-34');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-34', 1, 'test-only/demo/34.webp', 'TEST ONLY: black wide-leg trousers');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-35', 'test-demo-blue-gingham-shirt', 'TEST ONLY — Blue gingham shirt', 'tops', 690, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'M',
	'{"chest_in":43,"length_in":26.5}', 'TEST ONLY — demo fit.', '2026-09-01 05:35:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-35');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-35', 1, 'test-only/demo/35.webp', 'TEST ONLY: blue gingham shirt');
INSERT OR IGNORE INTO products (id, slug, name, category, price_bdt, publication_state, description,
	condition_notes, size_label, measurements_json, fit_note, created_at)
VALUES ('demo-piece-36', 'test-demo-oatmeal-wool-coat', 'TEST ONLY — Oatmeal wool coat', 'outerwear', 3100, 'published',
	'Demo piece for checking the local admin desk.', 'TEST ONLY — demo condition.', 'L',
	'{"chest_in":43,"length_in":29}', 'TEST ONLY — demo fit.', '2026-09-08 05:36:00');
INSERT OR IGNORE INTO inventory (product_id) VALUES ('demo-piece-36');
INSERT OR IGNORE INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('demo-piece-36', 1, 'test-only/demo/36.webp', 'TEST ONLY: oatmeal wool coat');

-- demo order 01 (0cb1e29c-658c-4a14-95e6-0af593bd04cf): payment_review
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('0cb1e29c-658c-4a14-95e6-0af593bd04cf', 'test-demo-token-1', '{"name": "Sadia Rahman", "phone": "01515678905", "line1": "Apt 5A, Green Road, Farmgate", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-01 07:13:00', datetime('2026-10-01 07:13:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '0cb1e29c-658c-4a14-95e6-0af593bd04cf', 'demo-piece-01', 1150 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '0cb1e29c-658c-4a14-95e6-0af593bd04cf' AND product_id = 'demo-piece-01');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo1', '0cb1e29c-658c-4a14-95e6-0af593bd04cf', 'mock', 1230 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = '0cb1e29c-658c-4a14-95e6-0af593bd04cf');
UPDATE orders SET status = 'payment_review' WHERE id = '0cb1e29c-658c-4a14-95e6-0af593bd04cf' AND status = 'pending_payment';

-- demo order 02 (8e81973e-0bec-47b0-b898-d190f9ebdacc): paid
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('8e81973e-0bec-47b0-b898-d190f9ebdacc', 'test-demo-token-2', '{"name": "Tasnim Haque", "phone": "01319012309", "line1": "Road 11, Bashundhara R/A", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-01 14:26:00', datetime('2026-10-01 14:26:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '8e81973e-0bec-47b0-b898-d190f9ebdacc', 'demo-piece-02', 1350 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '8e81973e-0bec-47b0-b898-d190f9ebdacc' AND product_id = 'demo-piece-02');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo2', '8e81973e-0bec-47b0-b898-d190f9ebdacc', 'mock', 1430 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = '8e81973e-0bec-47b0-b898-d190f9ebdacc');
UPDATE payments SET status = 'completed', trx_id = 'TESTtrx2' WHERE order_id = '8e81973e-0bec-47b0-b898-d190f9ebdacc' AND status = 'created';
UPDATE orders SET status = 'paid' WHERE id = '8e81973e-0bec-47b0-b898-d190f9ebdacc' AND status = 'pending_payment';
INSERT INTO fulfillments (order_id, state, courier, tracking_code, actor_email) SELECT '8e81973e-0bec-47b0-b898-d190f9ebdacc', 'delivered', 'Steadfast', 'TEST-SF-1002', 'local-preview' WHERE NOT EXISTS (SELECT 1 FROM fulfillments WHERE order_id = '8e81973e-0bec-47b0-b898-d190f9ebdacc');

-- demo order 03 (6b4cb242-4a23-4596-a217-beaddbc496cb): pending_payment
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('6b4cb242-4a23-4596-a217-beaddbc496cb', 'test-demo-token-3', '{"name": "Jannatul Ferdous", "phone": "01613456713", "line1": "House 9, Wari", "district": "test-other", "area": "test-town"}', 130, 130, 1, '2026-10-01 21:39:00', datetime('now', '+30 days'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '6b4cb242-4a23-4596-a217-beaddbc496cb', 'demo-piece-03', 950 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '6b4cb242-4a23-4596-a217-beaddbc496cb' AND product_id = 'demo-piece-03');

-- demo order 04 (92276658-1e27-41c0-8a6a-63ec24ede6a4): expired
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('92276658-1e27-41c0-8a6a-63ec24ede6a4', 'test-demo-token-4', '{"name": "Tanvir Ahmed", "phone": "01812345602", "line1": "Flat 3B, Lake View, Gulshan 1", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-01 04:52:00', datetime('2026-10-01 04:52:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '92276658-1e27-41c0-8a6a-63ec24ede6a4', 'demo-piece-04', 1850 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '92276658-1e27-41c0-8a6a-63ec24ede6a4' AND product_id = 'demo-piece-04');
UPDATE orders SET status = 'expired' WHERE id = '92276658-1e27-41c0-8a6a-63ec24ede6a4' AND status = 'pending_payment';

-- demo order 05 (ae97ba94-d0ed-482f-8f6d-05584ef8aa38): paid
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('ae97ba94-d0ed-482f-8f6d-05584ef8aa38', 'test-demo-token-5', '{"name": "Imran Hossain", "phone": "01716789006", "line1": "House 8, Road 2, Banani", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-01 11:05:00', datetime('2026-10-01 11:05:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT 'ae97ba94-d0ed-482f-8f6d-05584ef8aa38', 'demo-piece-05', 1250 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 'ae97ba94-d0ed-482f-8f6d-05584ef8aa38' AND product_id = 'demo-piece-05');
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT 'ae97ba94-d0ed-482f-8f6d-05584ef8aa38', 'demo-piece-06', 780 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 'ae97ba94-d0ed-482f-8f6d-05584ef8aa38' AND product_id = 'demo-piece-06');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo5', 'ae97ba94-d0ed-482f-8f6d-05584ef8aa38', 'mock', 2110 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = 'ae97ba94-d0ed-482f-8f6d-05584ef8aa38');
UPDATE payments SET status = 'completed', trx_id = 'TESTtrx5' WHERE order_id = 'ae97ba94-d0ed-482f-8f6d-05584ef8aa38' AND status = 'created';
UPDATE orders SET status = 'paid' WHERE id = 'ae97ba94-d0ed-482f-8f6d-05584ef8aa38' AND status = 'pending_payment';
INSERT INTO fulfillments (order_id, state, courier, tracking_code, actor_email) SELECT 'ae97ba94-d0ed-482f-8f6d-05584ef8aa38', 'delivered', 'Steadfast', 'TEST-SF-1005', 'local-preview' WHERE NOT EXISTS (SELECT 1 FROM fulfillments WHERE order_id = 'ae97ba94-d0ed-482f-8f6d-05584ef8aa38');

-- demo order 06 (923a7369-94e3-4f91-9a61-dbe22e44158b): expired
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('923a7369-94e3-4f91-9a61-dbe22e44158b', 'test-demo-token-6', '{"name": "Sabbir Rahman", "phone": "01710123410", "line1": "House 3, Agrabad, Chattogram", "district": "test-other", "area": "test-town"}', 130, 130, 1, '2026-10-02 18:18:00', datetime('2026-10-02 18:18:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '923a7369-94e3-4f91-9a61-dbe22e44158b', 'demo-piece-07', 2100 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '923a7369-94e3-4f91-9a61-dbe22e44158b' AND product_id = 'demo-piece-07');
UPDATE orders SET status = 'expired' WHERE id = '923a7369-94e3-4f91-9a61-dbe22e44158b' AND status = 'pending_payment';

-- demo order 07 (18f135d2-5f55-4203-b018-50c5a38fd547): paid
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('18f135d2-5f55-4203-b018-50c5a38fd547', 'test-demo-token-7', '{"name": "Mehedi Hasan", "phone": "01514567814", "line1": "Flat 6D, Badda", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-02 01:31:00', datetime('2026-10-02 01:31:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '18f135d2-5f55-4203-b018-50c5a38fd547', 'demo-piece-08', 1400 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '18f135d2-5f55-4203-b018-50c5a38fd547' AND product_id = 'demo-piece-08');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo7', '18f135d2-5f55-4203-b018-50c5a38fd547', 'mock', 1480 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = '18f135d2-5f55-4203-b018-50c5a38fd547');
UPDATE payments SET status = 'completed', trx_id = 'TESTtrx7' WHERE order_id = '18f135d2-5f55-4203-b018-50c5a38fd547' AND status = 'created';
UPDATE orders SET status = 'paid' WHERE id = '18f135d2-5f55-4203-b018-50c5a38fd547' AND status = 'pending_payment';
INSERT INTO fulfillments (order_id, state, courier, tracking_code, actor_email) SELECT '18f135d2-5f55-4203-b018-50c5a38fd547', 'dispatched', 'Steadfast', 'TEST-SF-1007', 'local-preview' WHERE NOT EXISTS (SELECT 1 FROM fulfillments WHERE order_id = '18f135d2-5f55-4203-b018-50c5a38fd547');

-- demo order 08 (907a70c3-1012-4037-b64c-e4228c38fb29): paid
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('907a70c3-1012-4037-b64c-e4228c38fb29', 'test-demo-token-8', '{"name": "Farhana Akter", "phone": "01913456703", "line1": "Sector 7, Road 14, Uttara", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-02 08:44:00', datetime('2026-10-02 08:44:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '907a70c3-1012-4037-b64c-e4228c38fb29', 'demo-piece-09', 1100 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '907a70c3-1012-4037-b64c-e4228c38fb29' AND product_id = 'demo-piece-09');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo8', '907a70c3-1012-4037-b64c-e4228c38fb29', 'mock', 1180 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = '907a70c3-1012-4037-b64c-e4228c38fb29');
UPDATE payments SET status = 'completed', trx_id = 'TESTtrx8' WHERE order_id = '907a70c3-1012-4037-b64c-e4228c38fb29' AND status = 'created';
UPDATE orders SET status = 'paid' WHERE id = '907a70c3-1012-4037-b64c-e4228c38fb29' AND status = 'pending_payment';
INSERT INTO fulfillments (order_id, state, courier, tracking_code, actor_email) SELECT '907a70c3-1012-4037-b64c-e4228c38fb29', 'dispatched', 'Steadfast', 'TEST-SF-1008', 'local-preview' WHERE NOT EXISTS (SELECT 1 FROM fulfillments WHERE order_id = '907a70c3-1012-4037-b64c-e4228c38fb29');

-- demo order 09 (7f150524-34b9-45df-9e77-69b10f4205b4): pending_payment
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('7f150524-34b9-45df-9e77-69b10f4205b4', 'test-demo-token-9', '{"name": "Mim Chowdhury", "phone": "01817890107", "line1": "Flat 2C, Shantinagar", "district": "test-other", "area": "test-town"}', 130, 130, 1, '2026-10-02 15:57:00', datetime('now', '+30 days'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '7f150524-34b9-45df-9e77-69b10f4205b4', 'demo-piece-10', 3200 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '7f150524-34b9-45df-9e77-69b10f4205b4' AND product_id = 'demo-piece-10');

-- demo order 10 (c6f87718-6d76-407e-881e-d162ae2eb154): paid
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('c6f87718-6d76-407e-881e-d162ae2eb154', 'test-demo-token-10', '{"name": "Lamia Sultana", "phone": "01811234511", "line1": "Zindabazar, Sylhet", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-02 22:10:00', datetime('2026-10-02 22:10:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT 'c6f87718-6d76-407e-881e-d162ae2eb154', 'demo-piece-11', 900 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 'c6f87718-6d76-407e-881e-d162ae2eb154' AND product_id = 'demo-piece-11');
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT 'c6f87718-6d76-407e-881e-d162ae2eb154', 'demo-piece-12', 1250 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 'c6f87718-6d76-407e-881e-d162ae2eb154' AND product_id = 'demo-piece-12');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo10', 'c6f87718-6d76-407e-881e-d162ae2eb154', 'mock', 2230 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = 'c6f87718-6d76-407e-881e-d162ae2eb154');
UPDATE payments SET status = 'completed', trx_id = 'TESTtrx10' WHERE order_id = 'c6f87718-6d76-407e-881e-d162ae2eb154' AND status = 'created';
UPDATE orders SET status = 'paid' WHERE id = 'c6f87718-6d76-407e-881e-d162ae2eb154' AND status = 'pending_payment';
INSERT INTO fulfillments (order_id, state, courier, tracking_code, actor_email) SELECT 'c6f87718-6d76-407e-881e-d162ae2eb154', 'preparing', NULL, NULL, 'local-preview' WHERE NOT EXISTS (SELECT 1 FROM fulfillments WHERE order_id = 'c6f87718-6d76-407e-881e-d162ae2eb154');

-- demo order 11 (ec66a787-95e7-41d1-b731-af10506bf2ef): expired
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('ec66a787-95e7-41d1-b731-af10506bf2ef', 'test-demo-token-11', '{"name": "Anika Tabassum", "phone": "01715678915", "line1": "House 31, Lalmatia", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-02 05:23:00', datetime('2026-10-02 05:23:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT 'ec66a787-95e7-41d1-b731-af10506bf2ef', 'demo-piece-13', 550 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 'ec66a787-95e7-41d1-b731-af10506bf2ef' AND product_id = 'demo-piece-13');
UPDATE orders SET status = 'expired' WHERE id = 'ec66a787-95e7-41d1-b731-af10506bf2ef' AND status = 'pending_payment';

-- demo order 12 (3f98e277-4cbd-47ad-9c90-a9587403e430): cancelled
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('3f98e277-4cbd-47ad-9c90-a9587403e430', 'test-demo-token-12', '{"name": "Rafiq Islam", "phone": "01614567804", "line1": "House 22, Block C, Mirpur 10", "district": "test-other", "area": "test-town"}', 130, 130, 1, '2026-10-03 12:36:00', datetime('2026-10-03 12:36:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '3f98e277-4cbd-47ad-9c90-a9587403e430', 'demo-piece-14', 2800 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '3f98e277-4cbd-47ad-9c90-a9587403e430' AND product_id = 'demo-piece-14');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo12', '3f98e277-4cbd-47ad-9c90-a9587403e430', 'mock', 2930 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = '3f98e277-4cbd-47ad-9c90-a9587403e430');
UPDATE payments SET status = 'cancelled' WHERE order_id = '3f98e277-4cbd-47ad-9c90-a9587403e430' AND status = 'created';
UPDATE orders SET status = 'cancelled' WHERE id = '3f98e277-4cbd-47ad-9c90-a9587403e430' AND status = 'pending_payment';

-- demo order 13 (c7a2ea20-b2f1-4c94-ae05-319acb5c7427): cancelled
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('c7a2ea20-b2f1-4c94-ae05-319acb5c7427', 'test-demo-token-13', '{"name": "Arif Khan", "phone": "01918901208", "line1": "House 40, Mohammadpur", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-03 19:49:00', datetime('2026-10-03 19:49:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT 'c7a2ea20-b2f1-4c94-ae05-319acb5c7427', 'demo-piece-15', 1050 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 'c7a2ea20-b2f1-4c94-ae05-319acb5c7427' AND product_id = 'demo-piece-15');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo13', 'c7a2ea20-b2f1-4c94-ae05-319acb5c7427', 'mock', 1130 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = 'c7a2ea20-b2f1-4c94-ae05-319acb5c7427');
UPDATE payments SET status = 'cancelled' WHERE order_id = 'c7a2ea20-b2f1-4c94-ae05-319acb5c7427' AND status = 'created';
UPDATE orders SET status = 'cancelled' WHERE id = 'c7a2ea20-b2f1-4c94-ae05-319acb5c7427' AND status = 'pending_payment';

-- demo order 14 (4cdd2055-930d-4eaf-94f4-733f3e7d1bfb): pending_payment
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('4cdd2055-930d-4eaf-94f4-733f3e7d1bfb', 'test-demo-token-14', '{"name": "Rakib Hasan", "phone": "01912345612", "line1": "Shaheb Bazar, Rajshahi", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-03 02:02:00', datetime('now', '+30 days'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '4cdd2055-930d-4eaf-94f4-733f3e7d1bfb', 'demo-piece-16', 2400 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '4cdd2055-930d-4eaf-94f4-733f3e7d1bfb' AND product_id = 'demo-piece-16');

-- demo order 15 (57ee05cd-e009-42c7-bebf-f20686734721): cancelled
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('57ee05cd-e009-42c7-bebf-f20686734721', 'test-demo-token-15', '{"name": "Nusrat Jahan", "phone": "01711234501", "line1": "House 12, Road 5, Dhanmondi", "district": "test-other", "area": "test-town"}', 130, 130, 1, '2026-10-03 09:15:00', datetime('2026-10-03 09:15:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '57ee05cd-e009-42c7-bebf-f20686734721', 'demo-piece-17', 1300 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '57ee05cd-e009-42c7-bebf-f20686734721' AND product_id = 'demo-piece-17');
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '57ee05cd-e009-42c7-bebf-f20686734721', 'demo-piece-18', 1200 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '57ee05cd-e009-42c7-bebf-f20686734721' AND product_id = 'demo-piece-18');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo15', '57ee05cd-e009-42c7-bebf-f20686734721', 'mock', 2630 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = '57ee05cd-e009-42c7-bebf-f20686734721');
UPDATE payments SET status = 'cancelled' WHERE order_id = '57ee05cd-e009-42c7-bebf-f20686734721' AND status = 'created';
UPDATE orders SET status = 'cancelled' WHERE id = '57ee05cd-e009-42c7-bebf-f20686734721' AND status = 'pending_payment';

-- demo order 16 (9be4bcfc-49b6-4a08-b2e6-cc3ababced20): cancelled
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('9be4bcfc-49b6-4a08-b2e6-cc3ababced20', 'test-demo-token-16', '{"name": "Sadia Rahman", "phone": "01515678905", "line1": "Apt 5A, Green Road, Farmgate", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-03 16:28:00', datetime('2026-10-03 16:28:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '9be4bcfc-49b6-4a08-b2e6-cc3ababced20', 'demo-piece-19', 850 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '9be4bcfc-49b6-4a08-b2e6-cc3ababced20' AND product_id = 'demo-piece-19');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo16', '9be4bcfc-49b6-4a08-b2e6-cc3ababced20', 'mock', 930 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = '9be4bcfc-49b6-4a08-b2e6-cc3ababced20');
UPDATE payments SET status = 'cancelled' WHERE order_id = '9be4bcfc-49b6-4a08-b2e6-cc3ababced20' AND status = 'created';
UPDATE orders SET status = 'cancelled' WHERE id = '9be4bcfc-49b6-4a08-b2e6-cc3ababced20' AND status = 'pending_payment';

-- demo order 17 (830e07bc-1e39-4f10-92bd-4acefaecbd38): payment_review
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('830e07bc-1e39-4f10-92bd-4acefaecbd38', 'test-demo-token-17', '{"name": "Tasnim Haque", "phone": "01319012309", "line1": "Road 11, Bashundhara R/A", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-03 23:41:00', datetime('2026-10-03 23:41:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '830e07bc-1e39-4f10-92bd-4acefaecbd38', 'demo-piece-20', 2600 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '830e07bc-1e39-4f10-92bd-4acefaecbd38' AND product_id = 'demo-piece-20');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo17', '830e07bc-1e39-4f10-92bd-4acefaecbd38', 'mock', 2680 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = '830e07bc-1e39-4f10-92bd-4acefaecbd38');
UPDATE orders SET status = 'payment_review' WHERE id = '830e07bc-1e39-4f10-92bd-4acefaecbd38' AND status = 'pending_payment';

-- demo order 18 (5790f82e-c1d3-4cff-aa3a-f4d46b0a18e8): paid
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('5790f82e-c1d3-4cff-aa3a-f4d46b0a18e8', 'test-demo-token-18', '{"name": "Jannatul Ferdous", "phone": "01613456713", "line1": "House 9, Wari", "district": "test-other", "area": "test-town"}', 130, 130, 1, '2026-10-04 06:54:00', datetime('2026-10-04 06:54:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '5790f82e-c1d3-4cff-aa3a-f4d46b0a18e8', 'demo-piece-21', 700 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '5790f82e-c1d3-4cff-aa3a-f4d46b0a18e8' AND product_id = 'demo-piece-21');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo18', '5790f82e-c1d3-4cff-aa3a-f4d46b0a18e8', 'mock', 830 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = '5790f82e-c1d3-4cff-aa3a-f4d46b0a18e8');
UPDATE payments SET status = 'completed', trx_id = 'TESTtrx18' WHERE order_id = '5790f82e-c1d3-4cff-aa3a-f4d46b0a18e8' AND status = 'created';
UPDATE orders SET status = 'paid' WHERE id = '5790f82e-c1d3-4cff-aa3a-f4d46b0a18e8' AND status = 'pending_payment';
INSERT INTO fulfillments (order_id, state, courier, tracking_code, actor_email) SELECT '5790f82e-c1d3-4cff-aa3a-f4d46b0a18e8', 'preparing', NULL, NULL, 'local-preview' WHERE NOT EXISTS (SELECT 1 FROM fulfillments WHERE order_id = '5790f82e-c1d3-4cff-aa3a-f4d46b0a18e8');

-- demo order 19 (6bf46c69-7d2c-4f82-aeea-cbe226e87555): pending_payment
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('6bf46c69-7d2c-4f82-aeea-cbe226e87555', 'test-demo-token-19', '{"name": "Tanvir Ahmed", "phone": "01812345602", "line1": "Flat 3B, Lake View, Gulshan 1", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-04 13:07:00', datetime('now', '+30 days'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '6bf46c69-7d2c-4f82-aeea-cbe226e87555', 'demo-piece-22', 1950 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '6bf46c69-7d2c-4f82-aeea-cbe226e87555' AND product_id = 'demo-piece-22');

-- demo order 20 (13deef86-ab10-41d0-b646-e1f40a097c97): cancelled
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('13deef86-ab10-41d0-b646-e1f40a097c97', 'test-demo-token-20', '{"name": "Imran Hossain", "phone": "01716789006", "line1": "House 8, Road 2, Banani", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-04 20:20:00', datetime('2026-10-04 20:20:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '13deef86-ab10-41d0-b646-e1f40a097c97', 'demo-piece-23', 980 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '13deef86-ab10-41d0-b646-e1f40a097c97' AND product_id = 'demo-piece-23');
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '13deef86-ab10-41d0-b646-e1f40a097c97', 'demo-piece-24', 880 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '13deef86-ab10-41d0-b646-e1f40a097c97' AND product_id = 'demo-piece-24');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo20', '13deef86-ab10-41d0-b646-e1f40a097c97', 'mock', 1940 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = '13deef86-ab10-41d0-b646-e1f40a097c97');
UPDATE payments SET status = 'cancelled' WHERE order_id = '13deef86-ab10-41d0-b646-e1f40a097c97' AND status = 'created';
UPDATE orders SET status = 'cancelled' WHERE id = '13deef86-ab10-41d0-b646-e1f40a097c97' AND status = 'pending_payment';

-- demo order 21 (ca02135e-92b1-43f2-8ede-0d7ac3baea9e): payment_review
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('ca02135e-92b1-43f2-8ede-0d7ac3baea9e', 'test-demo-token-21', '{"name": "Sabbir Rahman", "phone": "01710123410", "line1": "House 3, Agrabad, Chattogram", "district": "test-other", "area": "test-town"}', 130, 130, 1, '2026-10-04 03:33:00', datetime('2026-10-04 03:33:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT 'ca02135e-92b1-43f2-8ede-0d7ac3baea9e', 'demo-piece-25', 1500 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 'ca02135e-92b1-43f2-8ede-0d7ac3baea9e' AND product_id = 'demo-piece-25');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo21', 'ca02135e-92b1-43f2-8ede-0d7ac3baea9e', 'mock', 1630 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = 'ca02135e-92b1-43f2-8ede-0d7ac3baea9e');
UPDATE orders SET status = 'payment_review' WHERE id = 'ca02135e-92b1-43f2-8ede-0d7ac3baea9e' AND status = 'pending_payment';

-- demo order 22 (57124242-5051-41cc-917f-9acae01f5057): paid
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('57124242-5051-41cc-917f-9acae01f5057', 'test-demo-token-22', '{"name": "Mehedi Hasan", "phone": "01514567814", "line1": "Flat 6D, Badda", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-04 10:46:00', datetime('2026-10-04 10:46:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '57124242-5051-41cc-917f-9acae01f5057', 'demo-piece-26', 1100 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '57124242-5051-41cc-917f-9acae01f5057' AND product_id = 'demo-piece-26');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo22', '57124242-5051-41cc-917f-9acae01f5057', 'mock', 1180 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = '57124242-5051-41cc-917f-9acae01f5057');
UPDATE payments SET status = 'completed', trx_id = 'TESTtrx22' WHERE order_id = '57124242-5051-41cc-917f-9acae01f5057' AND status = 'created';
UPDATE orders SET status = 'paid' WHERE id = '57124242-5051-41cc-917f-9acae01f5057' AND status = 'pending_payment';
INSERT INTO fulfillments (order_id, state, courier, tracking_code, actor_email) SELECT '57124242-5051-41cc-917f-9acae01f5057', 'preparing', NULL, NULL, 'local-preview' WHERE NOT EXISTS (SELECT 1 FROM fulfillments WHERE order_id = '57124242-5051-41cc-917f-9acae01f5057');

-- demo order 23 (7f26144b-9828-4fcd-99a5-4a7bb1fee08f): paid
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('7f26144b-9828-4fcd-99a5-4a7bb1fee08f', 'test-demo-token-23', '{"name": "Farhana Akter", "phone": "01913456703", "line1": "Sector 7, Road 14, Uttara", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-04 17:59:00', datetime('2026-10-04 17:59:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '7f26144b-9828-4fcd-99a5-4a7bb1fee08f', 'demo-piece-27', 750 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '7f26144b-9828-4fcd-99a5-4a7bb1fee08f' AND product_id = 'demo-piece-27');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo23', '7f26144b-9828-4fcd-99a5-4a7bb1fee08f', 'mock', 830 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = '7f26144b-9828-4fcd-99a5-4a7bb1fee08f');
UPDATE payments SET status = 'completed', trx_id = 'TESTtrx23' WHERE order_id = '7f26144b-9828-4fcd-99a5-4a7bb1fee08f' AND status = 'created';
UPDATE orders SET status = 'paid' WHERE id = '7f26144b-9828-4fcd-99a5-4a7bb1fee08f' AND status = 'pending_payment';
INSERT INTO fulfillments (order_id, state, courier, tracking_code, actor_email) SELECT '7f26144b-9828-4fcd-99a5-4a7bb1fee08f', 'delivered', 'Steadfast', 'TEST-SF-1023', 'local-preview' WHERE NOT EXISTS (SELECT 1 FROM fulfillments WHERE order_id = '7f26144b-9828-4fcd-99a5-4a7bb1fee08f');

-- demo order 24 (119a72d1-74c9-4f6a-8c01-1cdd9474031b): pending_payment
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('119a72d1-74c9-4f6a-8c01-1cdd9474031b', 'test-demo-token-24', '{"name": "Mim Chowdhury", "phone": "01817890107", "line1": "Flat 2C, Shantinagar", "district": "test-other", "area": "test-town"}', 130, 130, 1, '2026-10-05 00:12:00', datetime('now', '+30 days'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '119a72d1-74c9-4f6a-8c01-1cdd9474031b', 'demo-piece-28', 1450 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '119a72d1-74c9-4f6a-8c01-1cdd9474031b' AND product_id = 'demo-piece-28');

-- demo order 25 (451abd81-f1d6-4ed6-97f5-e837d70820fe): paid
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('451abd81-f1d6-4ed6-97f5-e837d70820fe', 'test-demo-token-25', '{"name": "Lamia Sultana", "phone": "01811234511", "line1": "Zindabazar, Sylhet", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-05 07:25:00', datetime('2026-10-05 07:25:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '451abd81-f1d6-4ed6-97f5-e837d70820fe', 'demo-piece-29', 1050 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '451abd81-f1d6-4ed6-97f5-e837d70820fe' AND product_id = 'demo-piece-29');
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '451abd81-f1d6-4ed6-97f5-e837d70820fe', 'demo-piece-30', 1600 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '451abd81-f1d6-4ed6-97f5-e837d70820fe' AND product_id = 'demo-piece-30');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo25', '451abd81-f1d6-4ed6-97f5-e837d70820fe', 'mock', 2730 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = '451abd81-f1d6-4ed6-97f5-e837d70820fe');
UPDATE payments SET status = 'completed', trx_id = 'TESTtrx25' WHERE order_id = '451abd81-f1d6-4ed6-97f5-e837d70820fe' AND status = 'created';
UPDATE orders SET status = 'paid' WHERE id = '451abd81-f1d6-4ed6-97f5-e837d70820fe' AND status = 'pending_payment';
INSERT INTO fulfillments (order_id, state, courier, tracking_code, actor_email) SELECT '451abd81-f1d6-4ed6-97f5-e837d70820fe', 'delivered', 'Steadfast', 'TEST-SF-1025', 'local-preview' WHERE NOT EXISTS (SELECT 1 FROM fulfillments WHERE order_id = '451abd81-f1d6-4ed6-97f5-e837d70820fe');

-- demo order 26 (10a3d6b2-aa05-411a-b271-5945795e8229): paid
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('10a3d6b2-aa05-411a-b271-5945795e8229', 'test-demo-token-26', '{"name": "Anika Tabassum", "phone": "01715678915", "line1": "House 31, Lalmatia", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-05 14:38:00', datetime('2026-10-05 14:38:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '10a3d6b2-aa05-411a-b271-5945795e8229', 'demo-piece-31', 820 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '10a3d6b2-aa05-411a-b271-5945795e8229' AND product_id = 'demo-piece-31');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo26', '10a3d6b2-aa05-411a-b271-5945795e8229', 'mock', 900 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = '10a3d6b2-aa05-411a-b271-5945795e8229');
UPDATE payments SET status = 'completed', trx_id = 'TESTtrx26' WHERE order_id = '10a3d6b2-aa05-411a-b271-5945795e8229' AND status = 'created';
UPDATE orders SET status = 'paid' WHERE id = '10a3d6b2-aa05-411a-b271-5945795e8229' AND status = 'pending_payment';
INSERT INTO fulfillments (order_id, state, courier, tracking_code, actor_email) SELECT '10a3d6b2-aa05-411a-b271-5945795e8229', 'dispatched', 'Steadfast', 'TEST-SF-1026', 'local-preview' WHERE NOT EXISTS (SELECT 1 FROM fulfillments WHERE order_id = '10a3d6b2-aa05-411a-b271-5945795e8229');

-- demo order 27 (4f426dcb-b394-4b36-bb2d-420f0f88080b): payment_review
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('4f426dcb-b394-4b36-bb2d-420f0f88080b', 'test-demo-token-27', '{"name": "Rafiq Islam", "phone": "01614567804", "line1": "House 22, Block C, Mirpur 10", "district": "test-other", "area": "test-town"}', 130, 130, 1, '2026-10-05 21:51:00', datetime('2026-10-05 21:51:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '4f426dcb-b394-4b36-bb2d-420f0f88080b', 'demo-piece-32', 2900 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '4f426dcb-b394-4b36-bb2d-420f0f88080b' AND product_id = 'demo-piece-32');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo27', '4f426dcb-b394-4b36-bb2d-420f0f88080b', 'mock', 3030 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = '4f426dcb-b394-4b36-bb2d-420f0f88080b');
UPDATE orders SET status = 'payment_review' WHERE id = '4f426dcb-b394-4b36-bb2d-420f0f88080b' AND status = 'pending_payment';

-- demo order 28 (ae658f33-fe3b-490b-93f4-48b3a5aa3c81): pending_payment
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('ae658f33-fe3b-490b-93f4-48b3a5aa3c81', 'test-demo-token-28', '{"name": "Arif Khan", "phone": "01918901208", "line1": "House 40, Mohammadpur", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-05 04:04:00', datetime('now', '+30 days'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT 'ae658f33-fe3b-490b-93f4-48b3a5aa3c81', 'demo-piece-33', 1350 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 'ae658f33-fe3b-490b-93f4-48b3a5aa3c81' AND product_id = 'demo-piece-33');

-- demo order 29 (b774eb52-48db-40af-b215-8370d269a9a5): paid
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('b774eb52-48db-40af-b215-8370d269a9a5', 'test-demo-token-29', '{"name": "Rakib Hasan", "phone": "01912345612", "line1": "Shaheb Bazar, Rajshahi", "district": "test-dhaka", "area": "test-central"}', 80, 80, 1, '2026-10-05 11:17:00', datetime('2026-10-05 11:17:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT 'b774eb52-48db-40af-b215-8370d269a9a5', 'demo-piece-34', 1150 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 'b774eb52-48db-40af-b215-8370d269a9a5' AND product_id = 'demo-piece-34');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo29', 'b774eb52-48db-40af-b215-8370d269a9a5', 'mock', 1230 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = 'b774eb52-48db-40af-b215-8370d269a9a5');
UPDATE payments SET status = 'completed', trx_id = 'TESTtrx29' WHERE order_id = 'b774eb52-48db-40af-b215-8370d269a9a5' AND status = 'created';
UPDATE orders SET status = 'paid' WHERE id = 'b774eb52-48db-40af-b215-8370d269a9a5' AND status = 'pending_payment';
INSERT INTO fulfillments (order_id, state, courier, tracking_code, actor_email) SELECT 'b774eb52-48db-40af-b215-8370d269a9a5', 'dispatched', 'Steadfast', 'TEST-SF-1029', 'local-preview' WHERE NOT EXISTS (SELECT 1 FROM fulfillments WHERE order_id = 'b774eb52-48db-40af-b215-8370d269a9a5');

-- demo order 30 (58d5563d-ab2c-431e-a315-128862c33a4f): paid
INSERT OR IGNORE INTO orders (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, created_at, expires_at)
VALUES ('58d5563d-ab2c-431e-a315-128862c33a4f', 'test-demo-token-30', '{"name": "Nusrat Jahan", "phone": "01711234501", "line1": "House 12, Road 5, Dhanmondi", "district": "test-other", "area": "test-town"}', 130, 130, 1, '2026-10-06 18:30:00', datetime('2026-10-06 18:30:00', '+15 minutes'));
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '58d5563d-ab2c-431e-a315-128862c33a4f', 'demo-piece-35', 690 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '58d5563d-ab2c-431e-a315-128862c33a4f' AND product_id = 'demo-piece-35');
INSERT INTO order_items (order_id, product_id, price_bdt) SELECT '58d5563d-ab2c-431e-a315-128862c33a4f', 'demo-piece-36', 3100 WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = '58d5563d-ab2c-431e-a315-128862c33a4f' AND product_id = 'demo-piece-36');
INSERT INTO payments (payment_id, order_id, provider, amount_bdt) SELECT 'TESTdemo30', '58d5563d-ab2c-431e-a315-128862c33a4f', 'mock', 3920 WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = '58d5563d-ab2c-431e-a315-128862c33a4f');
UPDATE payments SET status = 'completed', trx_id = 'TESTtrx30' WHERE order_id = '58d5563d-ab2c-431e-a315-128862c33a4f' AND status = 'created';
UPDATE orders SET status = 'paid' WHERE id = '58d5563d-ab2c-431e-a315-128862c33a4f' AND status = 'pending_payment';
INSERT INTO fulfillments (order_id, state, courier, tracking_code, actor_email) SELECT '58d5563d-ab2c-431e-a315-128862c33a4f', 'preparing', NULL, NULL, 'local-preview' WHERE NOT EXISTS (SELECT 1 FROM fulfillments WHERE order_id = '58d5563d-ab2c-431e-a315-128862c33a4f');
