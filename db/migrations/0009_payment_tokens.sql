-- Server-only provider token cache; bKash allows only two token grants or refreshes per hour.
CREATE TABLE payment_tokens (
	provider TEXT PRIMARY KEY NOT NULL,
	id_token TEXT NOT NULL,
	refresh_token TEXT NOT NULL,
	expires_at INTEGER NOT NULL,
	refresh_expires_at INTEGER NOT NULL
);
