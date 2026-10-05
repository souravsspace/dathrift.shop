CREATE TABLE delivery_areas (
	district_key TEXT NOT NULL,
	area_key TEXT NOT NULL,
	display_name TEXT NOT NULL,
	fee_bdt INTEGER NOT NULL CHECK (typeof(fee_bdt) = 'integer' AND fee_bdt > 0),
	preview_only INTEGER NOT NULL DEFAULT 0 CHECK (preview_only IN (0, 1)),
	active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
	PRIMARY KEY (district_key, area_key)
);
