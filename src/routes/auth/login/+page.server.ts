import { fail, redirect } from '@sveltejs/kit';
import { ROLE_PLAYER } from '$lib/game/labels';
import { hashPassword, startSession, verifyCredentials } from '$lib/server/auth';
import { prisma } from '$lib/server/prisma';
import { RateLimiter } from '$lib/server/ratelimit';
import type { Actions, PageServerLoad } from './$types';

// Au moins 8 caractères, avec une minuscule, une majuscule et un chiffre.
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
// bcrypt ignore tout ce qui dépasse 72 octets : un mot de passe plus long serait tronqué en silence.
const PASSWORD_MAX_BYTES = 72;
const LOGIN_MIN_LENGTH = 5;
const LOGIN_MAX_LENGTH = 50;

const QUARTER_HOUR = 15 * 60 * 1000;
// Échecs de connexion : par adresse (un attaquant qui essaie beaucoup de comptes)
// et par compte (un attaquant qui change d'adresse pour viser un même compte).
const failuresByIp = new RateLimiter(30, QUARTER_HOUR);
const failuresByLogin = new RateLimiter(10, QUARTER_HOUR);
// Inscriptions : chaque essai compte, pour qu'on ne puisse pas sonder les noms pris à la chaîne.
const registrationsByIp = new RateLimiter(10, QUARTER_HOUR);

const TOO_MANY = 'Trop de tentatives. Réessaie dans quelques minutes.';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, '/profil');
};

export const actions: Actions = {
	login: async ({ request, cookies, getClientAddress }) => {
		const form = await request.formData();
		const login = String(form.get('login') ?? '').trim().slice(0, LOGIN_MAX_LENGTH);
		const password = String(form.get('password') ?? '');
		const ip = getClientAddress();
		const account = login.toLowerCase();

		if (failuresByIp.blocked(ip) || failuresByLogin.blocked(account)) {
			return fail(429, { mode: 'login', login, error: TOO_MANY });
		}

		const player = await verifyCredentials(login, password);
		if (!player) {
			failuresByIp.hit(ip);
			failuresByLogin.hit(account);
			return fail(401, { mode: 'login', login, error: 'Identifiants incorrects.' });
		}

		failuresByLogin.reset(account);
		startSession(cookies, player);
		redirect(303, '/profil');
	},

	register: async ({ request, cookies, getClientAddress }) => {
		if (!registrationsByIp.take(getClientAddress())) {
			return fail(429, { mode: 'register', login: '', error: TOO_MANY });
		}

		const form = await request.formData();
		const login = String(form.get('login') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const passwordConfirm = String(form.get('passwordConfirm') ?? '');

		const invalid = (error: string) => fail(400, { mode: 'register', login, error });

		if (login.length < LOGIN_MIN_LENGTH || login.length > LOGIN_MAX_LENGTH) {
			return invalid(
				`Le nom d'utilisateur doit faire entre ${LOGIN_MIN_LENGTH} et ${LOGIN_MAX_LENGTH} caractères.`
			);
		}
		if (!PASSWORD_RULE.test(password)) {
			return invalid(
				'Le mot de passe doit faire au moins 8 caractères, avec une majuscule, une minuscule et un chiffre.'
			);
		}
		if (Buffer.byteLength(password) > PASSWORD_MAX_BYTES) {
			return invalid(`Le mot de passe est trop long (${PASSWORD_MAX_BYTES} caractères maximum).`);
		}
		if (password !== passwordConfirm) {
			return invalid('Les mots de passe ne correspondent pas.');
		}
		if (await prisma.player.findUnique({ where: { login } })) {
			return invalid("Ce nom d'utilisateur est déjà pris.");
		}

		// Un nouveau compte est toujours un simple joueur, sans personnage : c'est le MJ qui l'associe.
		const player = await prisma.player.create({
			data: { login, password: await hashPassword(password), role: ROLE_PLAYER, team: 0 }
		});

		startSession(cookies, player);
		redirect(303, '/profil');
	}
};
