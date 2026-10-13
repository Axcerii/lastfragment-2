// src/routes/api/foods/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { UpdateFoodData } from '$lib/types';

// GET /api/foods/[id]
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

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

    return json(food);
  } catch (error) {
    console.error('Error fetching food:', error);
    return json({ error: 'Failed to fetch food' }, { status: 500 });
  }
};

// PUT /api/foods/[id]
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    const data: UpdateFoodData = await request.json();
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.weight !== undefined) updateData.weight = Number(data.weight);
    if (data.type !== undefined) updateData.type = data.type;
    if (data.price !== undefined) updateData.price = Number(data.price);

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

    return json(food);
  } catch (error: any) {
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
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.food.delete({
      where: { id }
    });

    return json({ message: 'Food deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting food:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Food not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete food' }, { status: 500 });
  }
};