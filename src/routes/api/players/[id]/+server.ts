// src/routes/api/players/[id]/+server.ts
import { PrismaClient } from '@prisma/client';
import { json, type RequestHandler } from '@sveltejs/kit';

const prisma = new PrismaClient();

// GET /api/players/[id] - Récupérer un joueur spécifique
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        character: true,
        itemsInPlayer: {
          include: {
            item: true
          }
        },
        badgesFusions: true
      }
    });

    if (!player) {
      return json({ error: 'Player not found' }, { status: 404 });
    }

    // Convertir BigInt en string pour la sérialisation JSON
    const serializedPlayer = {
      ...player,
      id: player.id.toString(),
      role: player.role.toString(),
      team: player.team.toString(),
      characterId: player.characterId?.toString() || null
    };

    return json(serializedPlayer);
  } catch (error) {
    console.error('Error fetching player:', error);
    return json({ error: 'Failed to fetch player' }, { status: 500 });
  }
};

// PUT /api/players/[id] - Mettre à jour un joueur
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    const data = await request.json();
    const { login, password, role, team, characterId } = data;

    const updateData: any = {};
    if (login !== undefined) updateData.login = login;
    if (password !== undefined) updateData.password = password;
    if (role !== undefined) updateData.role = BigInt(role);
    if (team !== undefined) updateData.team = BigInt(team);
    if (characterId !== undefined) {
      updateData.characterId = characterId ? BigInt(characterId) : null;
    }

    const player = await prisma.player.update({
      where: { id },
      data: updateData,
      include: {
        character: true
      }
    });

    // Convertir BigInt en string pour la sérialisation JSON
    const serializedPlayer = {
      ...player,
      id: player.id.toString(),
      role: player.role.toString(),
      team: player.team.toString(),
      characterId: player.characterId?.toString() || null
    };

    return json(serializedPlayer);
  } catch (error: any) {
    console.error('Error updating player:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Player not found' }, { status: 404 });
    }
    if (error.code === 'P2002') {
      return json({ error: 'Login already exists' }, { status: 409 });
    }
    return json({ error: 'Failed to update player' }, { status: 500 });
  }
};

// DELETE /api/players/[id] - Supprimer un joueur
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    
    await prisma.player.delete({
      where: { id }
    });

    return json({ message: 'Player deleted successfully' });
  } catch (error:any) {
    console.error('Error deleting player:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Player not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete player' }, { status: 500 });
  }
};