// src/routes/api/armors/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { UpdateArmorData } from '$lib/types';

// GET /api/armors/[id] - Récupérer une armure spécifique
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    const armor = await prisma.armor.findUnique({
      where: { id },
      include: {
        item: true,
        armorInPlayer: {
          include: {
            itemInPlayer: {
              include: {
                player: {
                  select: {
                    id: true,
                    login: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!armor) {
      return json({ error: 'Armor not found' }, { status: 404 });
    }

    return json(armor);
  } catch (error) {
    console.error('Error fetching armor:', error);
    return json({ error: 'Failed to fetch armor' }, { status: 500 });
  }
};

// PUT /api/armors/[id] - Mettre à jour une armure
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    const data: UpdateArmorData = await request.json();
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.statistics !== undefined) updateData.statistics = data.statistics;
    if (data.values !== undefined) updateData.values = data.values;
    if (data.itemId !== undefined) updateData.itemId = Number(data.itemId);

    const armor = await prisma.armor.update({
      where: { id },
      data: updateData,
      include: {
        item: true,
        armorInPlayer: {
          select: {
            id: true,
            itemInPlayerId: true
          }
        }
      }
    });

    return json(armor);
  } catch (error: any) {
    console.error('Error updating armor:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Armor not found' }, { status: 404 });
    }
    return json({ error: 'Failed to update armor' }, { status: 500 });
  }
};

// DELETE /api/armors/[id] - Supprimer une armure
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.armor.delete({
      where: { id }
    });

    return json({ message: 'Armor deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting armor:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Armor not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete armor' }, { status: 500 });
  }
};