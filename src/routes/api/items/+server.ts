// src/routes/api/items/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { Item, CreateItemData } from '$lib/types';

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

    return json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    return json({ error: 'Failed to fetch items' }, { status: 500 });
  }
};

// POST /api/items - Créer un nouvel item
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreateItemData = await request.json();
    const { name, category, rarity, weight, description } = data;

    // Validation des champs requis
    if (!name || !category || rarity === undefined || weight === undefined || !description) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const item = await prisma.item.create({
      data: {
        name,
        category,
        rarity: Number(rarity),
        weight: Number(weight),
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

    return json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return json({ error: 'Failed to create item' }, { status: 500 });
  }
};