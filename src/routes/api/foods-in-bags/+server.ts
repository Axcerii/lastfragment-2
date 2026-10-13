// src/routes/api/foods-in-bags/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { CreateFoodInBagData } from '$lib/types';

// GET /api/foods-in-bags
export const GET: RequestHandler = async ({ url }) => {
  try {
    const playerId = url.searchParams.get('playerId');
    const foodId = url.searchParams.get('foodId');

    const where: any = {};
    if (foodId) where.foodId = parseInt(foodId, 10);
    if (playerId) {
      where.itemInPlayer = {
        playerId: parseInt(playerId, 10)
      };
    }

    const foodsInBags = await prisma.foodInBag.findMany({
      where,
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
      },
      orderBy: { id: 'desc' }
    });

    return json(foodsInBags);
  } catch (error) {
    console.error('Error fetching foods in bags:', error);
    return json({ error: 'Failed to fetch foods in bags' }, { status: 500 });
  }
};

// POST /api/foods-in-bags
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreateFoodInBagData = await request.json();
    const { itemInPlayerId, foodId, quantity } = data;

    if (itemInPlayerId === undefined || foodId === undefined) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const itemInPlayer = await prisma.itemInPlayer.findUnique({
      where: { id: Number(itemInPlayerId) }
    });

    if (!itemInPlayer) {
      return json({ error: 'Item in player not found' }, { status: 404 });
    }

    const food = await prisma.food.findUnique({
      where: { id: Number(foodId) }
    });

    if (!food) {
      return json({ error: 'Food not found' }, { status: 404 });
    }

    const foodInBag = await prisma.foodInBag.create({
      data: {
        itemInPlayerId: Number(itemInPlayerId),
        foodId: Number(foodId),
        quantity: quantity !== undefined ? Number(quantity) : 1
      },
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

    return json(foodInBag, { status: 201 });
  } catch (error) {
    console.error('Error creating food in bag:', error);
    return json({ error: 'Failed to create food in bag' }, { status: 500 });
  }
};