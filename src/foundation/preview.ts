type FoundationContext = {
	access?: { getIdentity(): Promise<{ email?: string } | null> };
};

type FoundationEnv = {
	DB: {
		prepare(query: string): {
			bind(...values: string[]): {
				run(): Promise<unknown>;
				first(): Promise<{ value: string } | null>;
			};
		};
	};
	ALLOWED_HOST: string;
	STAFF_EMAILS?: string;
};

export default {
	async fetch(request: Request, env: FoundationEnv, ctx: FoundationContext): Promise<Response> {
		const url = new URL(request.url);
		if (url.hostname !== env.ALLOWED_HOST) return new Response('Not found', { status: 404 });
		if (!ctx.access) return new Response('Access required', { status: 403 });
		const identity = await ctx.access.getIdentity();
		const allowed = (env.STAFF_EMAILS ?? '').split(',').map((email) => email.trim().toLowerCase());
		if (!identity?.email || !allowed.includes(identity.email.toLowerCase())) {
			return new Response('Access required', { status: 403 });
		}

		if (request.method === 'POST' && url.pathname === '/__foundation/markers') {
			const marker = await request.json().catch(() => null);
			if (!isMarker(marker)) return new Response('Invalid marker', { status: 400 });
			await env.DB.prepare('INSERT INTO foundation_markers (id, value) VALUES (?, ?)')
				.bind(marker.id, marker.value)
				.run();
			return new Response(null, { status: 201 });
		}

		if (request.method === 'GET' && url.pathname.startsWith('/__foundation/markers/')) {
			const id = url.pathname.slice('/__foundation/markers/'.length);
			const marker = await env.DB.prepare('SELECT value FROM foundation_markers WHERE id = ?')
				.bind(id)
				.first();
			return marker
				? Response.json({ id, value: marker.value }, { headers: { 'Cache-Control': 'no-store' } })
				: new Response('Not found', { status: 404 });
		}
		return new Response('Not found', { status: 404 });
	}
};

function isMarker(value: unknown): value is { id: string; value: string } {
	if (!value || typeof value !== 'object') return false;
	const marker = value as Record<string, unknown>;
	return (
		typeof marker.id === 'string' &&
		/^[a-zA-Z0-9-]{1,128}$/.test(marker.id) &&
		typeof marker.value === 'string' &&
		marker.value.length <= 128
	);
}
