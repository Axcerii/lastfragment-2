// src/routes/api/foods/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { CreateFoodData } from '$lib/types';

// GET /api/foods
export const GET: RequestHandler = async ({ url }) => {
  try {
    const type = url.searchParams.get('type');
    const where = type ? { type: type as any } : {};

    const foods = await prisma.food.findMany({
      where,
      include: {
        foodsInBags: {
          select: {
            id: true,
            itemInPlayerId: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return json(foods);
  } catch (error) {
    console.error('Error fetching foods:', error);
    return json({ error: 'Failed to fetch foods' }, { status: 500 });
  }
};

// POST /api/foods
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreateFoodData = await request.json();
    const { name, weight, type, price } = data;

    if (!name || weight === undefined || !type || price === undefined) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const food = await prisma.food.create({
      data: {
        name,
        weight: Number(weight),
        type,
        price: Number(price)
      },
      include: {
        foodsInBags: {
          select: {
            id: true,
            itemInPlayerId: true
          }
        }
      }
    });

    return json(food, { status: 201 });
  } catch (error) {
    console.error('Error creating food:', error);
    return json({ error: 'Failed to create food' }, { status: 500 });
  }
};
