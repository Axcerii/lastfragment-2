// src/routes/api/players/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import bcrypt from 'bcrypt';

// GET /api/players/[id] - Récupérer un joueur spécifique
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid player ID' }, { status: 400 });
    }

    const player = await prisma.player.findUnique({
      where: { id },
      select: {
        id: true,
        login: true,
        role: true,
        team: true,
        characterId: true,
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

    return json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    return json({ error: 'Failed to fetch player' }, { status: 500 });
  }
};

// PUT /api/players/[id] - Mettre à jour un joueur
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid player ID' }, { status: 400 });
    }

    const data = await request.json();
    const { login, password, role, team, characterId } = data;

    const updateData: any = {};
    if (login !== undefined) updateData.login = login;
    if (password !== undefined) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (role !== undefined) updateData.role = Number(role);
    if (team !== undefined) updateData.team = Number(team);
    if (characterId !== undefined) {
      updateData.characterId = characterId ? Number(characterId) : null;
    }

    const player = await prisma.player.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        login: true,
        role: true,
        team: true,
        characterId: true,
        character: true
      }
    });

    return json(player);
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
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid player ID' }, { status: 400 });
    }

    await prisma.player.delete({
      where: { id }
    });

    return json({ message: 'Player deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting player:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Player not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete player' }, { status: 500 });
  }
};