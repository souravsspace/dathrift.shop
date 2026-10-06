import { createRemoteJWKSet, jwtVerify } from 'jose';

type StaffAuthEnv = {
	OWNER_EMAIL?: string;
	STAFF_HOST?: string;
	STAFF_EMAILS?: string;
	ACCESS_TEAM_DOMAIN?: string;
	ACCESS_AUD?: string;
};

type VerifyAccess = (token: string, teamDomain: string, audience: string) => Promise<string | null>;

const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

async function verifyAccessJwt(
	token: string,
	teamDomain: string,
	audience: string
): Promise<string | null> {
	let keySet = keySets.get(teamDomain);
	if (!keySet) {
		keySet = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
		keySets.set(teamDomain, keySet);
	}
	const { payload } = await jwtVerify(token, keySet, {
		issuer: teamDomain,
		audience
	});
	return typeof payload.email === 'string' ? payload.email : null;
}

export async function staffEmailForRequest(
	request: Request,
	env: StaffAuthEnv,
	verify: VerifyAccess = verifyAccessJwt
): Promise<string | null> {
	const url = new URL(request.url);
	if (url.protocol !== 'https:' || !env.STAFF_HOST || url.hostname !== env.STAFF_HOST)
		return denied('not the staff host');
	if (!env.STAFF_EMAILS || !env.ACCESS_AUD || !env.ACCESS_TEAM_DOMAIN)
		return denied('staff settings missing');
	const teamDomain = new URL(env.ACCESS_TEAM_DOMAIN);
	if (
		teamDomain.protocol !== 'https:' ||
		!teamDomain.hostname.endsWith('.cloudflareaccess.com') ||
		teamDomain.pathname !== '/' ||
		teamDomain.search ||
		teamDomain.hash
	)
		return denied('invalid team domain');
	const token = request.headers.get('Cf-Access-Jwt-Assertion');
	if (!token) return denied('no Access token');
	try {
		const email = (await verify(token, teamDomain.origin, env.ACCESS_AUD))?.toLowerCase();
		const allowed = env.STAFF_EMAILS.split(',').map((value) => value.trim().toLowerCase());
		return email && allowed.includes(email) ? email : denied('email not in STAFF_EMAILS');
	} catch (cause) {
		return denied(`Access token rejected: ${(cause as { code?: string }).code ?? cause}`);
	}
}

// Logs why staff access was refused, without the email or token, so a 403 can be traced.
function denied(reason: string): null {
	console.warn(`staff access denied: ${reason}`);
	return null;
}

export function staffActorForRequest(
	request: Request,
	env: StaffAuthEnv,
	isLocalDev: boolean
): Promise<string | null> {
	const url = new URL(request.url);
	if (
		isLocalDev &&
		url.protocol === 'http:' &&
		(url.hostname === 'localhost' || url.hostname === '127.0.0.1')
	) {
		return Promise.resolve('local-preview');
	}
	return staffEmailForRequest(request, env);
}

// Only the owner may resolve ambiguous payments; the loopback preview acts as owner locally.
export function isOwnerActor(actor: string | null, env: StaffAuthEnv, isLocalDev: boolean) {
	if (!actor) return false;
	if (actor === 'local-preview') return isLocalDev;
	const owner = env.OWNER_EMAIL?.trim().toLowerCase();
	return Boolean(owner) && actor.toLowerCase() === owner;
}
