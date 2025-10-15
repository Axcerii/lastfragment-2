// src/routes/api/foods-in-bags/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { FoodInBag, UpdateFoodInBagData } from '$lib/types';

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

// GET /api/foods-in-bags/[id]
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    const foodInBag = await prisma.foodInBag.findUnique({
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
        food: true
      }
    });

    if (!foodInBag) {
      return json({ error: 'Food in bag not found' }, { status: 404 });
    }

    const serializedFoodInBag: FoodInBag = serializeBigInt(foodInBag);
    return json(serializedFoodInBag);
  } catch (error) {
    console.error('Error fetching food in bag:', error);
    return json({ error: 'Failed to fetch food in bag' }, { status: 500 });
  }
};

// PUT /api/foods-in-bags/[id]
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    const data: UpdateFoodInBagData = await request.json();

    const updateData: any = {};
    
    if (data.itemInPlayerId !== undefined) updateData.itemInPlayerId = BigInt(data.itemInPlayerId);
    if (data.foodId !== undefined) updateData.foodId = BigInt(data.foodId);

    const foodInBag = await prisma.foodInBag.update({
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
        food: true
      }
    });

    const serializedFoodInBag: FoodInBag = serializeBigInt(foodInBag);
    return json(serializedFoodInBag);
  } catch (error:any) {
    console.error('Error updating food in bag:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Food in bag not found' }, { status: 404 });
    }
    return json({ error: 'Failed to update food in bag' }, { status: 500 });
  }
};

// DELETE /api/foods-in-bags/[id]
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    
    await prisma.foodInBag.delete({
      where: { id }
    });

    return json({ message: 'Food in bag deleted successfully' });
  } catch (error:any) {
    console.error('Error deleting food in bag:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Food in bag not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete food in bag' }, { status: 500 });
  }
};