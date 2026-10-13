// src/routes/api/items-in-player/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { UpdateItemInPlayerData } from '$lib/types';

// GET /api/items-in-player/[id] - Récupérer un item spécifique d'un joueur
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    const itemInPlayer = await prisma.itemInPlayer.findUnique({
      where: { id },
      include: {
        item: true,
        player: {
          select: {
            id: true,
            login: true,
            character: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        armorInPlayer: {
          include: {
            armor: true
          }
        },
        foodsInBags: {
          include: {
            food: true
          }
        }
      }
    });

    if (!itemInPlayer) {
      return json({ error: 'Item in player not found' }, { status: 404 });
    }

    return json(itemInPlayer);
  } catch (error) {
    console.error('Error fetching item in player:', error);
    return json({ error: 'Failed to fetch item in player' }, { status: 500 });
  }
};

// PUT /api/items-in-player/[id] - Mettre à jour un item d'un joueur
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    const data: UpdateItemInPlayerData = await request.json();
    const updateData: any = {};

    if (data.itemId !== undefined) updateData.itemId = Number(data.itemId);
    if (data.playerId !== undefined) updateData.playerId = Number(data.playerId);
    if (data.quantity !== undefined) updateData.quantity = Number(data.quantity);
    if (data.localisation !== undefined) updateData.localisation = data.localisation;

    const itemInPlayer = await prisma.itemInPlayer.update({
      where: { id },
      data: updateData,
      include: {
        item: true,
        player: {
          select: {
            id: true,
            login: true
          }
        },
        armorInPlayer: {
          select: {
            id: true,
            armorId: true
          }
        },
        foodsInBags: {
          select: {
            id: true,
            foodId: true
          }
        }
      }
    });

    return json(itemInPlayer);
  } catch (error: any) {
    console.error('Error updating item in player:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Item in player not found' }, { status: 404 });
    }
    return json({ error: 'Failed to update item in player' }, { status: 500 });
  }
};

// DELETE /api/items-in-player/[id] - Supprimer un item d'un joueur
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.itemInPlayer.delete({
      where: { id }
    });

    return json({ message: 'Item in player deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting item in player:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Item in player not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete item in player' }, { status: 500 });
  }
};