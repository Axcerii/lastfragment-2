// src/routes/api/foods-in-bags/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { UpdateFoodInBagData } from '$lib/types';

// GET /api/foods-in-bags/[id]
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

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

    return json(foodInBag);
  } catch (error) {
    console.error('Error fetching food in bag:', error);
    return json({ error: 'Failed to fetch food in bag' }, { status: 500 });
  }
};

// PUT /api/foods-in-bags/[id]
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    const data: UpdateFoodInBagData = await request.json();
    const updateData: any = {};

    if (data.itemInPlayerId !== undefined) updateData.itemInPlayerId = Number(data.itemInPlayerId);
    if (data.foodId !== undefined) updateData.foodId = Number(data.foodId);
    if (data.quantity !== undefined) updateData.quantity = Number(data.quantity);

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

    return json(foodInBag);
  } catch (error: any) {
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
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.foodInBag.delete({
      where: { id }
    });

    return json({ message: 'Food in bag deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting food in bag:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Food in bag not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete food in bag' }, { status: 500 });
  }
};