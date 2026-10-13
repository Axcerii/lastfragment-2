// src/routes/api/armors/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { CreateArmorData } from '$lib/types';

// GET /api/armors - Récupérer toutes les armures
export const GET: RequestHandler = async ({ url }) => {
  try {
    const itemId = url.searchParams.get('itemId');
    const where = itemId ? { itemId: parseInt(itemId, 10) } : {};

    const armors = await prisma.armor.findMany({
      where,
      include: {
        item: true,
        armorInPlayer: {
          select: {
            id: true,
            itemInPlayerId: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return json(armors);
  } catch (error) {
    console.error('Error fetching armors:', error);
    return json({ error: 'Failed to fetch armors' }, { status: 500 });
  }
};

// POST /api/armors - Créer une nouvelle armure
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreateArmorData = await request.json();
    const { name, statistics, values, itemId } = data;

    if (!name || !statistics || !values || itemId === undefined) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const item = await prisma.item.findUnique({
      where: { id: Number(itemId) }
    });

    if (!item) {
      return json({ error: 'Item not found' }, { status: 404 });
    }

    const armor = await prisma.armor.create({
      data: {
        name,
        statistics,
        values,
        itemId: Number(itemId)
      },
      include: {
        item: true,
        armorInPlayer: {
          select: {
            id: true,
            itemInPlayerId: true
          }
        }
      }
    });

    return json(armor, { status: 201 });
  } catch (error) {
    console.error('Error creating armor:', error);
    return json({ error: 'Failed to create armor' }, { status: 500 });
  }
};