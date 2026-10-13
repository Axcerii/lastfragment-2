import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { isPasswordValid, isStringLongEnough } from '$lib/regex';
import bcrypt from 'bcrypt';

// GET /api/players - Récupérer tous les joueurs
export const GET: RequestHandler = async () => {
  try {
    const players = await prisma.player.findMany({
      select: {
        id: true,
        login: true,
        role: true,
        team: true,
        characterId: true,
        character: true
      }
    });

    return json(players);
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

    if (!isPasswordValid(password)) {
      return json({ error: 'Invalid password format' }, { status: 400 });
    }

    if (!isStringLongEnough(login)) {
      return json({ error: 'Invalid login format' }, { status: 400 });
    }

    if (!login || !password) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingPlayer = await prisma.player.findUnique({ where: { login } });
    if (existingPlayer) {
      return json({ error: 'Login already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const player = await prisma.player.create({
      data: {
        login,
        password: hashedPassword,
        role: role !== undefined ? Number(role) : 0,
        team: team !== undefined ? Number(team) : 0,
        characterId: characterId ? Number(characterId) : null
      },
      select: {
        id: true,
        login: true,
        role: true,
        team: true,
        characterId: true,
        character: true
      }
    });

    return json(player, { status: 201 });
  } catch (error: any) {
    console.error('Error creating player:', error);
    if (error.code === 'P2002') {
      return json({ error: 'Login already exists' }, { status: 409 });
    }
    return json({ error: 'Failed to create player' }, { status: 500 });
  }
};
