import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fonction utilitaire pour convertir les BigInt en string
function serializePlayer(player: any) {
  return {
    ...player,
    id: player.id.toString(),
    role: player.role.toString(),
    team: player.team.toString(),
    characterId: player.characterId ? player.characterId.toString() : null
  };
}

// GET /api/players - Récupérer tous les joueurs
export const GET: RequestHandler = async () => {
  try {
    const players = await prisma.player.findMany({
      include: {
        character: true
      }
    });

    // Sérialisation de chaque joueur
    const serializedPlayers = players.map(serializePlayer);

    return json(serializedPlayers);
  } catch (error) {
    console.error('Error fetching players:', error);
    return json({ error: 'Failed to fetch players' }, { status: 500 });
  }
};

// POST /api/players - Créer un nouveau joueur
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { login, password, role, team, characterId } = data;

    if (!login || !password || role === undefined || team === undefined) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const player = await prisma.player.create({
      data: {
        login,
        password,
        role: BigInt(role),
        team: BigInt(team),
        characterId: characterId ? BigInt(characterId) : null
      },
      include: {
        character: true
      }
    });

    return json(serializePlayer(player), { status: 201 });
  } catch (error: any) {
    console.error('Error creating player:', error);
    if (error.code === 'P2002') {
      return json({ error: 'Login already exists' }, { status: 409 });
    }
    return json({ error: 'Failed to create player' }, { status: 500 });
  }
};
