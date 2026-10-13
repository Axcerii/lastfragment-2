// src/routes/api/armors-in-player/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { UpdateArmorInPlayerData } from '$lib/types';

// GET /api/armors-in-player/[id]
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    const armorInPlayer = await prisma.armorInPlayer.findUnique({
      where: { id },
      include: {
        itemInPlayer: {
          include: {
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
            item: true
          }
        },
        armor: {
          include: {
            item: true
          }
        }
      }
    });

    if (!armorInPlayer) {
      return json({ error: 'Armor in player not found' }, { status: 404 });
    }

    return json(armorInPlayer);
  } catch (error) {
    console.error('Error fetching armor in player:', error);
    return json({ error: 'Failed to fetch armor in player' }, { status: 500 });
  }
};

// PUT /api/armors-in-player/[id]
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    const data: UpdateArmorInPlayerData = await request.json();
    const updateData: any = {};

    if (data.itemInPlayerId !== undefined) updateData.itemInPlayerId = Number(data.itemInPlayerId);
    if (data.armorId !== undefined) updateData.armorId = Number(data.armorId);
    if (data.statistics !== undefined) updateData.statistics = data.statistics;
    if (data.values !== undefined) updateData.values = data.values;
    if (data.descriptionAdd !== undefined) updateData.descriptionAdd = String(data.descriptionAdd);
    if (data.notes !== undefined) updateData.notes = data.notes;

    const armorInPlayer = await prisma.armorInPlayer.update({
      where: { id },
      data: updateData,
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
        },
        armor: true
      }
    });

    return json(armorInPlayer);
  } catch (error: any) {
    console.error('Error updating armor in player:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Armor in player not found' }, { status: 404 });
    }
    return json({ error: 'Failed to update armor in player' }, { status: 500 });
  }
};

// DELETE /api/armors-in-player/[id]
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.armorInPlayer.delete({
      where: { id }
    });

    return json({ message: 'Armor in player deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting armor in player:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Armor in player not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete armor in player' }, { status: 500 });
  }
};