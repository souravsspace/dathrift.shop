ALTER TABLE products ADD COLUMN brand TEXT;
ALTER TABLE products ADD COLUMN description TEXT;
ALTER TABLE products ADD COLUMN condition_notes TEXT;
ALTER TABLE products ADD COLUMN size_label TEXT;
ALTER TABLE products ADD COLUMN measurements_json TEXT
	CHECK (measurements_json IS NULL OR json_valid(measurements_json));
ALTER TABLE products ADD COLUMN fit_note TEXT;
