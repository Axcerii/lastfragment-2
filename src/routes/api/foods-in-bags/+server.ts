// src/routes/api/foods-in-bags/+server.ts
import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from './$types';
import type { FoodInBag, CreateFoodInBagData } from '$lib/types';

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

// GET /api/foods-in-bags
export const GET: RequestHandler = async ({ url }) => {
  try {
    const playerId = url.searchParams.get('playerId');
    const foodId = url.searchParams.get('foodId');
    
    const where: any = {};
    if (foodId) where.foodId = BigInt(foodId);
    if (playerId) {
      where.itemInPlayer = {
        playerId: BigInt(playerId)
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

    const serializedFoodsInBags: FoodInBag[] = serializeBigInt(foodsInBags);
    return json(serializedFoodsInBags);
  } catch (error) {
    console.error('Error fetching foods in bags:', error);
    return json({ error: 'Failed to fetch foods in bags' }, { status: 500 });
  }
};

// POST /api/foods-in-bags
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreateFoodInBagData = await request.json();
    const { itemInPlayerId, foodId } = data;

    if (itemInPlayerId === undefined || foodId === undefined) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const itemInPlayer = await prisma.itemInPlayer.findUnique({
      where: { id: BigInt(itemInPlayerId) }
    });

    if (!itemInPlayer) {
      return json({ error: 'Item in player not found' }, { status: 404 });
    }

    const food = await prisma.food.findUnique({
      where: { id: BigInt(foodId) }
    });

    if (!food) {
      return json({ error: 'Food not found' }, { status: 404 });
    }

    const foodInBag = await prisma.foodInBag.create({
      data: {
        itemInPlayerId: BigInt(itemInPlayerId),
        foodId: BigInt(foodId)
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

    const serializedFoodInBag: FoodInBag = serializeBigInt(foodInBag);
    return json(serializedFoodInBag, { status: 201 });
  } catch (error) {
    console.error('Error creating food in bag:', error);
    return json({ error: 'Failed to create food in bag' }, { status: 500 });
  }
};