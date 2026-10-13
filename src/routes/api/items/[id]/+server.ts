// src/routes/api/items/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { UpdateItemData } from '$lib/types';

// GET /api/items/[id] - Récupérer un item spécifique
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        itemsInPlayer: {
          include: {
            player: {
              select: {
                id: true,
                login: true
              }
            }
          }
        },
        armors: true
      }
    });

    if (!item) {
      return json({ error: 'Item not found' }, { status: 404 });
    }

    return json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    return json({ error: 'Failed to fetch item' }, { status: 500 });
  }
};

// PUT /api/items/[id] - Mettre à jour un item
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const data: UpdateItemData = await request.json();
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.rarity !== undefined) updateData.rarity = Number(data.rarity);
    if (data.weight !== undefined) updateData.weight = Number(data.weight);
    if (data.description !== undefined) updateData.description = data.description;

    const item = await prisma.item.update({
      where: { id },
      data: updateData,
      include: {
        itemsInPlayer: {
          select: {
            id: true,
            playerId: true
          }
        },
        armors: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return json(item);
  } catch (error: any) {
    console.error('Error updating item:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Item not found' }, { status: 404 });
    }
    return json({ error: 'Failed to update item' }, { status: 500 });
  }
};

// DELETE /api/items/[id] - Supprimer un item
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid item ID' }, { status: 400 });
    }

    await prisma.item.delete({
      where: { id }
    });

    return json({ message: 'Item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting item:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Item not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete item' }, { status: 500 });
  }
};