// src/routes/api/armors/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { Armor, UpdateArmorData } from '$lib/types';

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

// GET /api/armors/[id] - Récupérer une armure spécifique
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
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

    const serializedArmor: Armor = serializeBigInt(armor);
    return json(serializedArmor);
  } catch (error) {
    console.error('Error fetching armor:', error);
    return json({ error: 'Failed to fetch armor' }, { status: 500 });
  }
};

// PUT /api/armors/[id] - Mettre à jour une armure
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    const data: UpdateArmorData = await request.json();

    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.statistics !== undefined) updateData.statistics = data.statistics;
    if (data.values !== undefined) updateData.values = data.values;
    if (data.itemId !== undefined) updateData.itemId = BigInt(data.itemId);

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

    const serializedArmor: Armor = serializeBigInt(armor);
    return json(serializedArmor);
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
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    
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