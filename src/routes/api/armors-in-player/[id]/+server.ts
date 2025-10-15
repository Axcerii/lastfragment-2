// src/routes/api/armors-in-player/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { ArmorInPlayer, UpdateArmorInPlayerData } from '$lib/types';

const prisma = new PrismaClient();

function serializeBigInt(obj: any): any {
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeBigInt(value)])
    );
  }
  return obj;
}

// GET /api/armors-in-player/[id]
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
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

    const serializedArmorInPlayer: ArmorInPlayer = serializeBigInt(armorInPlayer);
    return json(serializedArmorInPlayer);
  } catch (error) {
    console.error('Error fetching armor in player:', error);
    return json({ error: 'Failed to fetch armor in player' }, { status: 500 });
  }
};

// PUT /api/armors-in-player/[id]
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    const data: UpdateArmorInPlayerData = await request.json();

    const updateData: any = {};
    
    if (data.itemInPlayerId !== undefined) updateData.itemInPlayerId = BigInt(data.itemInPlayerId);
    if (data.armorId !== undefined) updateData.armorId = BigInt(data.armorId);
    if (data.statistics !== undefined) updateData.statistics = data.statistics;
    if (data.values !== undefined) updateData.values = data.values;
    if (data.descriptionAdd !== undefined) updateData.descriptionAdd = BigInt(data.descriptionAdd);
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

    const serializedArmorInPlayer: ArmorInPlayer = serializeBigInt(armorInPlayer);
    return json(serializedArmorInPlayer);
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
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    
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