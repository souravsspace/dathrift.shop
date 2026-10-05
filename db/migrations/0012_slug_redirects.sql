-- Published slugs are permanent; a typo correction keeps the old URL as a redirect.
CREATE TABLE slug_redirects (
	old_slug TEXT PRIMARY KEY NOT NULL,
	product_id TEXT NOT NULL REFERENCES products(id),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER product_slug_not_redirected
BEFORE INSERT ON products
BEGIN
	SELECT RAISE(ABORT, 'Slug unavailable')
	WHERE EXISTS (SELECT 1 FROM slug_redirects WHERE old_slug = NEW.slug);
END;

CREATE TRIGGER product_slug_change_not_redirected
BEFORE UPDATE OF slug ON products
WHEN NEW.slug <> OLD.slug
BEGIN
	SELECT RAISE(ABORT, 'Slug unavailable')
	WHERE EXISTS (SELECT 1 FROM slug_redirects WHERE old_slug = NEW.slug);
END;
