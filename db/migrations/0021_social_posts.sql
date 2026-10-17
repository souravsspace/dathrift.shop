-- Staff-edited social media captions, one per piece and post format. A piece with no row here
-- uses the caption generated from its listing. basis keeps the generated text the edit started
-- from, so the editor can warn when the listing changed after the caption was saved.
CREATE TABLE product_social_posts (
	product_id TEXT NOT NULL REFERENCES products(id),
	format TEXT NOT NULL CHECK (
		format IN (
			'ig-square',
			'ig-portrait',
			'ig-story',
			'fb-square',
			'fb-landscape',
			'fb-story',
			'fb-marketplace'
		)
	),
	caption TEXT NOT NULL CHECK (length(trim(caption)) > 0 AND length(caption) <= 5000),
	basis TEXT NOT NULL CHECK (length(basis) <= 5000),
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (product_id, format)
);
