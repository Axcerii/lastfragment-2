// src/routes/api/foods/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { Food, UpdateFoodData } from '$lib/types';

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

// GET /api/foods/[id]
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    const food = await prisma.food.findUnique({
      where: { id },
      include: {
        foodsInBags: {
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

    if (!food) {
      return json({ error: 'Food not found' }, { status: 404 });
    }

    const serializedFood: Food = serializeBigInt(food);
    return json(serializedFood);
  } catch (error) {
    console.error('Error fetching food:', error);
    return json({ error: 'Failed to fetch food' }, { status: 500 });
  }
};

// PUT /api/foods/[id]
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    const data: UpdateFoodData = await request.json();

    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.weight !== undefined) updateData.weight = BigInt(data.weight);
    if (data.type !== undefined) updateData.type = data.type;
    if (data.price !== undefined) updateData.price = BigInt(data.price);

    const food = await prisma.food.update({
      where: { id },
      data: updateData,
      include: {
        foodsInBags: {
          select: {
            id: true,
            itemInPlayerId: true
          }
        }
      }
    });

    const serializedFood: Food = serializeBigInt(food);
    return json(serializedFood);
  } catch (error:any) {
    console.error('Error updating food:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Food not found' }, { status: 404 });
    }
    return json({ error: 'Failed to update food' }, { status: 500 });
  }
};

// DELETE /api/foods/[id]
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    
    await prisma.food.delete({
      where: { id }
    });

    return json({ message: 'Food deleted successfully' });
  } catch (error:any) {
    console.error('Error deleting food:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Food not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete food' }, { status: 500 });
  }
};