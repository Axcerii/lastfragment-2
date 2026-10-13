// src/routes/api/armors-in-player/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { CreateArmorInPlayerData } from '$lib/types';

// GET /api/armors-in-player
export const GET: RequestHandler = async ({ url }) => {
  try {
    const playerId = url.searchParams.get('playerId');
    const armorId = url.searchParams.get('armorId');

    const where: any = {};
    if (armorId) where.armorId = parseInt(armorId, 10);
    if (playerId) {
      where.itemInPlayer = {
        playerId: parseInt(playerId, 10)
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

    return json(armorsInPlayer);
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

    if (itemInPlayerId === undefined || armorId === undefined || !statistics || !values) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const itemInPlayer = await prisma.itemInPlayer.findUnique({
      where: { id: Number(itemInPlayerId) }
    });

    if (!itemInPlayer) {
      return json({ error: 'Item in player not found' }, { status: 404 });
    }

    const armor = await prisma.armor.findUnique({
      where: { id: Number(armorId) }
    });

    if (!armor) {
      return json({ error: 'Armor not found' }, { status: 404 });
    }

    const armorInPlayer = await prisma.armorInPlayer.create({
      data: {
        itemInPlayerId: Number(itemInPlayerId),
        armorId: Number(armorId),
        statistics,
        values,
        descriptionAdd: String(descriptionAdd ?? ''),
        notes: notes ?? ''
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

    return json(armorInPlayer, { status: 201 });
  } catch (error) {
    console.error('Error creating armor in player:', error);
    return json({ error: 'Failed to create armor in player' }, { status: 500 });
  }
};