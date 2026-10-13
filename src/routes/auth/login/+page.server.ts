import { fail, redirect } from '@sveltejs/kit';
import { ROLE_PLAYER } from '$lib/game/labels';
import { checkPassword, hashPassword, startSession } from '$lib/server/auth';
import { prisma } from '$lib/server/prisma';
import type { Actions, PageServerLoad } from './$types';

// Au moins 8 caractères, avec une minuscule, une majuscule et un chiffre.
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const LOGIN_MIN_LENGTH = 5;

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, '/profil');
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const form = await request.formData();
		const login = String(form.get('login') ?? '').trim();
		const password = String(form.get('password') ?? '');

		const player = await prisma.player.findUnique({ where: { login } });
		if (!player || !(await checkPassword(password, player.password))) {
			return fail(401, { mode: 'login', login, error: 'Identifiants incorrects.' });
		}

		startSession(cookies, player.id);
		redirect(303, '/profil');
	},

	register: async ({ request, cookies }) => {
		const form = await request.formData();
		const login = String(form.get('login') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const passwordConfirm = String(form.get('passwordConfirm') ?? '');

		const invalid = (error: string) => fail(400, { mode: 'register', login, error });

		if (login.length < LOGIN_MIN_LENGTH) {
			return invalid(`Le nom d'utilisateur doit faire au moins ${LOGIN_MIN_LENGTH} caractères.`);
		}
		if (!PASSWORD_RULE.test(password)) {
			return invalid(
				'Le mot de passe doit faire au moins 8 caractères, avec une majuscule, une minuscule et un chiffre.'
			);
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

		startSession(cookies, player.id);
		redirect(303, '/profil');
	}
};
