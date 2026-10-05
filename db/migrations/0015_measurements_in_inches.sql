-- Shoppers in Bangladesh read garment sizes in inches. Convert stored centimetres to the
-- nearest half inch and rename the keys (chest_cm -> chest_in, and so on).
UPDATE products
SET measurements_json = (
	SELECT json_group_object(
		replace(key, '_cm', '_in'),
		CASE
			WHEN key NOT LIKE '%\_cm' ESCAPE '\' OR type NOT IN ('integer', 'real') THEN value
			WHEN CAST(round(value / 2.54 * 2) AS INTEGER) % 2 = 0
				THEN CAST(round(value / 2.54 * 2) AS INTEGER) / 2
			ELSE round(value / 2.54 * 2) / 2.0
		END
	)
	FROM json_each(products.measurements_json)
)
WHERE measurements_json IS NOT NULL AND measurements_json LIKE '%\_cm%' ESCAPE '\';
