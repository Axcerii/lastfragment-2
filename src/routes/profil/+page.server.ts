import { redirect } from "@sveltejs/kit";
import { prisma } from "$lib/server/prisma";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user || !locals.user.id) {
        throw redirect(302, '/auth/login');
    }

    const player = await prisma.player.findUnique({
        where: { id: locals.user.id },
        select: { characterId: true }
    });

    return {
        characterId: player?.characterId ?? null
    };
};