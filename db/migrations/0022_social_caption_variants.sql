-- Captions now come in seven variants staff choose from, and an original-size format joins the
-- post formats. SQLite cannot change a CHECK in place, so the table is rebuilt; captions saved
-- before this keep their text as the classic variant. Nothing else references this table.
CREATE TABLE product_social_posts_new (
	product_id TEXT NOT NULL REFERENCES products(id),
	format TEXT NOT NULL CHECK (
		format IN (
			'ig-square',
			'ig-portrait',
			'ig-story',
			'fb-square',
			'fb-landscape',
			'fb-story',
			'fb-marketplace',
			'original'
		)
	),
	variant TEXT NOT NULL DEFAULT 'classic' CHECK (
		variant IN ('classic', 'short', 'english', 'bangla', 'fit', 'drop', 'storytelling')
	),
	caption TEXT NOT NULL CHECK (length(trim(caption)) > 0 AND length(caption) <= 5000),
	basis TEXT NOT NULL CHECK (length(basis) <= 5000),
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (product_id, format, variant)
);

INSERT INTO product_social_posts_new (product_id, format, variant, caption, basis, updated_at)
SELECT product_id, format, 'classic', caption, basis, updated_at FROM product_social_posts;

DROP TABLE product_social_posts;
ALTER TABLE product_social_posts_new RENAME TO product_social_posts;
