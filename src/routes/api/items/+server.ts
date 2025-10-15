// src/routes/api/items/+server.ts
import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';
import type { Item, CreateItemData } from '$lib/types';

const prisma = new PrismaClient();

// Fonction utilitaire pour sérialiser les BigInt
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

// GET /api/items - Récupérer tous les items
export const GET: RequestHandler = async ({ url }) => {
  try {
    const category = url.searchParams.get('category');
    
    const where = category ? { category: category as any } : {};
    
    const items = await prisma.item.findMany({
      where,
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
      },
      orderBy: { id: 'desc' }
    });

    const serializedItems: Item[] = serializeBigInt(items);
    return json(serializedItems);
  } catch (error) {
    console.error('Error fetching items:', error);
    return json({ error: 'Failed to fetch items' }, { status: 500 });
  }
};

// POST /api/items - Créer un nouvel item
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreateItemData = await request.json();
    const { category, rarity, weight, description } = data;

    // Validation des champs requis
    if (!category || rarity === undefined || weight === undefined || !description) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const item = await prisma.item.create({
      data: {
        category,
        rarity: BigInt(rarity),
        weight: BigInt(weight),
        description
      },
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
    return json(serializedItem, { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return json({ error: 'Failed to create item' }, { status: 500 });
  }
};