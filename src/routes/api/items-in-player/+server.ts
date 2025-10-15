// src/routes/api/items-in-player/+server.ts
import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';
import type { ItemInPlayer, CreateItemInPlayerData } from '$lib/types';

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

// GET /api/items-in-player - Récupérer tous les items des joueurs
export const GET: RequestHandler = async ({ url }) => {
  try {
    const playerId = url.searchParams.get('playerId');
    const itemId = url.searchParams.get('itemId');
    
    const where: any = {};
    if (playerId) where.playerId = BigInt(playerId);
    if (itemId) where.itemId = BigInt(itemId);
    
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

    const serializedItemsInPlayer: ItemInPlayer[] = serializeBigInt(itemsInPlayer);
    return json(serializedItemsInPlayer);
  } catch (error) {
    console.error('Error fetching items in player:', error);
    return json({ error: 'Failed to fetch items in player' }, { status: 500 });
  }
};

// POST /api/items-in-player - Créer un nouvel item pour un joueur
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreateItemInPlayerData = await request.json();
    const { itemId, playerId, localisation } = data;

    // Validation des champs requis
    if (itemId === undefined || playerId === undefined || !localisation) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Vérifier que l'item existe
    const item = await prisma.item.findUnique({
      where: { id: BigInt(itemId) }
    });

    if (!item) {
      return json({ error: 'Item not found' }, { status: 404 });
    }

    // Vérifier que le joueur existe
    const player = await prisma.player.findUnique({
      where: { id: BigInt(playerId) }
    });

    if (!player) {
      return json({ error: 'Player not found' }, { status: 404 });
    }

    const itemInPlayer = await prisma.itemInPlayer.create({
      data: {
        itemId: BigInt(itemId),
        playerId: BigInt(playerId),
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

    const serializedItemInPlayer: ItemInPlayer = serializeBigInt(itemInPlayer);
    return json(serializedItemInPlayer, { status: 201 });
  } catch (error) {
    console.error('Error creating item in player:', error);
    return json({ error: 'Failed to create item in player' }, { status: 500 });
  }
};