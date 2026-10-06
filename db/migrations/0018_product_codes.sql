-- Every piece gets a short staff- and buyer-facing code such as OC2026001: a two-letter month
-- code, the year, then a number that restarts each month. Months follow Bangladesh time (UTC+6).
-- Numbers come from a per-month counter, so a deleted piece's number is never handed out again.
CREATE TABLE product_code_counters (
	prefix TEXT PRIMARY KEY NOT NULL CHECK (length(prefix) = 6),
	last_number INTEGER NOT NULL CHECK (last_number >= 0)
);

ALTER TABLE products ADD COLUMN code TEXT;

CREATE UNIQUE INDEX products_code_unique ON products (code);

UPDATE products SET code = numbered.code
FROM (
	SELECT id,
		prefix || printf('%03d', row_number() OVER (PARTITION BY prefix ORDER BY created_at, id)) AS code
	FROM (
		SELECT id, created_at,
			CASE strftime('%m', created_at, '+6 hours')
				WHEN '01' THEN 'JA' WHEN '02' THEN 'FE' WHEN '03' THEN 'MR' WHEN '04' THEN 'AP'
				WHEN '05' THEN 'MY' WHEN '06' THEN 'JN' WHEN '07' THEN 'JL' WHEN '08' THEN 'AU'
				WHEN '09' THEN 'SE' WHEN '10' THEN 'OC' WHEN '11' THEN 'NO' ELSE 'DE'
			END || strftime('%Y', created_at, '+6 hours') AS prefix
		FROM products
	)
) AS numbered
WHERE products.id = numbered.id;

INSERT INTO product_code_counters (prefix, last_number)
SELECT substr(code, 1, 6), max(CAST(substr(code, 7) AS INTEGER))
FROM products
GROUP BY substr(code, 1, 6);

CREATE TRIGGER assign_product_code
AFTER INSERT ON products
WHEN NEW.code IS NULL
BEGIN
	INSERT OR IGNORE INTO product_code_counters (prefix, last_number)
	VALUES (
		CASE strftime('%m', NEW.created_at, '+6 hours')
			WHEN '01' THEN 'JA' WHEN '02' THEN 'FE' WHEN '03' THEN 'MR' WHEN '04' THEN 'AP'
			WHEN '05' THEN 'MY' WHEN '06' THEN 'JN' WHEN '07' THEN 'JL' WHEN '08' THEN 'AU'
			WHEN '09' THEN 'SE' WHEN '10' THEN 'OC' WHEN '11' THEN 'NO' ELSE 'DE'
		END || strftime('%Y', NEW.created_at, '+6 hours'),
		0
	);
	UPDATE product_code_counters SET last_number = last_number + 1
	WHERE prefix = (
		CASE strftime('%m', NEW.created_at, '+6 hours')
			WHEN '01' THEN 'JA' WHEN '02' THEN 'FE' WHEN '03' THEN 'MR' WHEN '04' THEN 'AP'
			WHEN '05' THEN 'MY' WHEN '06' THEN 'JN' WHEN '07' THEN 'JL' WHEN '08' THEN 'AU'
			WHEN '09' THEN 'SE' WHEN '10' THEN 'OC' WHEN '11' THEN 'NO' ELSE 'DE'
		END || strftime('%Y', NEW.created_at, '+6 hours')
	);
	UPDATE products SET code = (
		SELECT prefix || printf('%03d', last_number) FROM product_code_counters
		WHERE prefix = (
			CASE strftime('%m', NEW.created_at, '+6 hours')
				WHEN '01' THEN 'JA' WHEN '02' THEN 'FE' WHEN '03' THEN 'MR' WHEN '04' THEN 'AP'
				WHEN '05' THEN 'MY' WHEN '06' THEN 'JN' WHEN '07' THEN 'JL' WHEN '08' THEN 'AU'
				WHEN '09' THEN 'SE' WHEN '10' THEN 'OC' WHEN '11' THEN 'NO' ELSE 'DE'
			END || strftime('%Y', NEW.created_at, '+6 hours')
		)
	)
	WHERE id = NEW.id;
END;
