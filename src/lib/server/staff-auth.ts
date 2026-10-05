import { createRemoteJWKSet, jwtVerify } from 'jose';

type StaffAuthEnv = {
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
	if (url.protocol !== 'https:' || !env.STAFF_HOST || url.hostname !== env.STAFF_HOST) return null;
	if (!env.STAFF_EMAILS || !env.ACCESS_AUD || !env.ACCESS_TEAM_DOMAIN) return null;
	const teamDomain = new URL(env.ACCESS_TEAM_DOMAIN);
	if (
		teamDomain.protocol !== 'https:' ||
		!teamDomain.hostname.endsWith('.cloudflareaccess.com') ||
		teamDomain.pathname !== '/' ||
		teamDomain.search ||
		teamDomain.hash
	)
		return null;
	const token = request.headers.get('Cf-Access-Jwt-Assertion');
	if (!token) return null;
	try {
		const email = (await verify(token, teamDomain.origin, env.ACCESS_AUD))?.toLowerCase();
		const allowed = env.STAFF_EMAILS.split(',').map((value) => value.trim().toLowerCase());
		return email && allowed.includes(email) ? email : null;
	} catch {
		return null;
	}
}
