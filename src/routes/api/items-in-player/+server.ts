// src/routes/api/items-in-player/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { CreateItemInPlayerData } from '$lib/types';

// GET /api/items-in-player - Récupérer tous les items des joueurs
export const GET: RequestHandler = async ({ url }) => {
  try {
    const playerId = url.searchParams.get('playerId');
    const itemId = url.searchParams.get('itemId');

    const where: any = {};
    if (playerId) where.playerId = parseInt(playerId, 10);
    if (itemId) where.itemId = parseInt(itemId, 10);

    const itemsInPlayer = await prisma.itemInPlayer.findMany({
      where,
      include: {
        item: true,
        player: {
          select: {
            id: true,
            login: true
          }
        },
        armorInPlayer: {
          select: {
            id: true,
            armorId: true
          }
        },
        foodsInBags: {
          select: {
            id: true,
            foodId: true
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    return json(itemsInPlayer);
  } catch (error) {
    console.error('Error fetching items in player:', error);
    return json({ error: 'Failed to fetch items in player' }, { status: 500 });
  }
};

// POST /api/items-in-player - Créer un nouvel item pour un joueur
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreateItemInPlayerData = await request.json();
    const { itemId, playerId, quantity, localisation } = data;

    if (itemId === undefined || playerId === undefined || !localisation) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const item = await prisma.item.findUnique({
      where: { id: Number(itemId) }
    });

    if (!item) {
      return json({ error: 'Item not found' }, { status: 404 });
    }

    const player = await prisma.player.findUnique({
      where: { id: Number(playerId) }
    });

    if (!player) {
      return json({ error: 'Player not found' }, { status: 404 });
    }

    const itemInPlayer = await prisma.itemInPlayer.create({
      data: {
        itemId: Number(itemId),
        playerId: Number(playerId),
        quantity: quantity !== undefined ? Number(quantity) : 1,
        localisation
      },
      include: {
        item: true,
        player: {
          select: {
            id: true,
            login: true
          }
        },
        armorInPlayer: {
          select: {
            id: true,
            armorId: true
          }
        },
        foodsInBags: {
          select: {
            id: true,
            foodId: true
          }
        }
      }
    });

    return json(itemInPlayer, { status: 201 });
  } catch (error) {
    console.error('Error creating item in player:', error);
    return json({ error: 'Failed to create item in player' }, { status: 500 });
  }
};