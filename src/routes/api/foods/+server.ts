// src/routes/api/foods/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { Food, CreateFoodData } from '$lib/types';

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

    const serializedFoods: Food[] = serializeBigInt(foods);
    return json(serializedFoods);
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
        weight: BigInt(weight),
        type,
        price: BigInt(price)
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

    const serializedFood: Food = serializeBigInt(food);
    return json(serializedFood, { status: 201 });
  } catch (error) {
    console.error('Error creating food:', error);
    return json({ error: 'Failed to create food' }, { status: 500 });
  }
};
