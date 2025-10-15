// src/routes/api/armors-in-player/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { ArmorInPlayer, CreateArmorInPlayerData } from '$lib/types';

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

// GET /api/armors-in-player
export const GET: RequestHandler = async ({ url }) => {
  try {
    const playerId = url.searchParams.get('playerId');
    const armorId = url.searchParams.get('armorId');
    
    const where: any = {};
    if (armorId) where.armorId = BigInt(armorId);
    if (playerId) {
      where.itemInPlayer = {
        playerId: BigInt(playerId)
      };
    }
    
    const armorsInPlayer = await prisma.armorInPlayer.findMany({
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
        armor: true
      },
      orderBy: { id: 'desc' }
    });

    const serializedArmorsInPlayer: ArmorInPlayer[] = serializeBigInt(armorsInPlayer);
    return json(serializedArmorsInPlayer);
  } catch (error) {
    console.error('Error fetching armors in player:', error);
    return json({ error: 'Failed to fetch armors in player' }, { status: 500 });
  }
};

// POST /api/armors-in-player
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreateArmorInPlayerData = await request.json();
    const { itemInPlayerId, armorId, statistics, values, descriptionAdd, notes } = data;

    if (itemInPlayerId === undefined || armorId === undefined || !statistics || 
        !values || descriptionAdd === undefined || !notes) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const itemInPlayer = await prisma.itemInPlayer.findUnique({
      where: { id: BigInt(itemInPlayerId) }
    });

    if (!itemInPlayer) {
      return json({ error: 'Item in player not found' }, { status: 404 });
    }

    const armor = await prisma.armor.findUnique({
      where: { id: BigInt(armorId) }
    });

    if (!armor) {
      return json({ error: 'Armor not found' }, { status: 404 });
    }

    const armorInPlayer = await prisma.armorInPlayer.create({
      data: {
        itemInPlayerId: BigInt(itemInPlayerId),
        armorId: BigInt(armorId),
        statistics,
        values,
        descriptionAdd: BigInt(descriptionAdd),
        notes
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
        armor: true
      }
    });

    const serializedArmorInPlayer: ArmorInPlayer = serializeBigInt(armorInPlayer);
    return json(serializedArmorInPlayer, { status: 201 });
  } catch (error) {
    console.error('Error creating armor in player:', error);
    return json({ error: 'Failed to create armor in player' }, { status: 500 });
  }
};