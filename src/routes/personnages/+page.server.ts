import { censor, visibleTo } from '$lib/server/characters';
import { prisma } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const isAdmin = locals.user?.isAdmin ?? false;

	const [characters, monsters] = await Promise.all([
		prisma.character.findMany({ where: visibleTo(isAdmin), orderBy: { name: 'asc' } }),
		prisma.monster.findMany({ where: visibleTo(isAdmin), orderBy: { name: 'asc' } })
	]);

	return {
		characters: characters.map((c) => censor(c, isAdmin)),
		monsters
	};
};
