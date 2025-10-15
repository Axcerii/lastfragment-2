// src/routes/api/items/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';
import type { Item, UpdateItemData } from '$lib/types';

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

// GET /api/items/[id] - Récupérer un item spécifique
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
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

    const serializedItem: Item = serializeBigInt(item);
    return json(serializedItem);
  } catch (error) {
    console.error('Error fetching item:', error);
    return json({ error: 'Failed to fetch item' }, { status: 500 });
  }
};

// PUT /api/items/[id] - Mettre à jour un item
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    const data: UpdateItemData = await request.json();

    const updateData: any = {};
    
    if (data.category !== undefined) updateData.category = data.category;
    if (data.rarity !== undefined) updateData.rarity = BigInt(data.rarity);
    if (data.weight !== undefined) updateData.weight = BigInt(data.weight);
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

    const serializedItem: Item = serializeBigInt(item);
    return json(serializedItem);
  } catch (error:any) {
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
    const id = params.id !== undefined ? BigInt(params.id) : undefined;

    
    await prisma.item.delete({
      where: { id }
    });

    return json({ message: 'Item deleted successfully' });
  } catch (error:any) {
    console.error('Error deleting item:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Item not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete item' }, { status: 500 });
  }
};