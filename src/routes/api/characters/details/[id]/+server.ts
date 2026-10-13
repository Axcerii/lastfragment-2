import { json, type RequestHandler, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const GET: RequestHandler = async ({ params, locals }) => {
    const { id } = params;

    if (!id) {
        throw error(400, 'ID is required');
    }

    const characterId = parseInt(id, 10);
    if (isNaN(characterId)) {
        throw error(400, 'Invalid character ID');
    }

    let isAdmin = false;

    // Check authentication and fetch role
    if (locals.user && locals.user.id) {
        try {
            const userId = locals.user.id;
            const player = await prisma.player.findUnique({
                where: { id: userId },
                select: { role: true }
            });

            if (player && player.role === 10) {
                isAdmin = true;
            }
        } catch (err) {
            console.error('Error fetching user role:', err);
        }
    }

    try {
        const character = await prisma.character.findUnique({
            where: {
                id: characterId
            },
            select: {
                id: true,
                name: true,
                flux: true,
                dragon: true,
                title: true,
                theme: true,
                race: true,
                country: true,
                image: true,
                description: true,
                category: true,
                visibility: true,
                statistics: true,
                passives: true,
                characterSkills: {
                    include: {
                        skill: true
                    }
                },
                players: {
                    include: {
                        itemsInPlayer: {
                            include: {
                                item: true
                            }
                        }
                    }
                }
            }
        });

        if (!character) {
            throw error(404, 'Character not found');
        }

        // Visibility check
        if (!isAdmin && character.visibility !== 1) {
            throw error(404, 'Character not found or not visible');
        }

        return json(character);

    } catch (err) {
        if ((err as any).status === 404) {
            throw err;
        }
        console.error('Error fetching character details:', err);
        throw error(500, 'Internal Server Error');
    }
};
