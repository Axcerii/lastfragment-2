// src/routes/api/badges-fusions/+server.ts
import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from './$types';
import type { BadgeFusion, CreateBadgeFusionData } from '$lib/types';

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

// GET /api/badges-fusions
export const GET: RequestHandler = async ({ url }) => {
  try {
    const playerId = url.searchParams.get('playerId');
    
    const where = playerId ? { playerId: BigInt(playerId) } : {};
    
    const badgesFusions = await prisma.badgeFusion.findMany({
      where,
      include: {
        player: {
          select: {
            id: true,
            login: true
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    const serializedBadgesFusions: BadgeFusion[] = serializeBigInt(badgesFusions);
    return json(serializedBadgesFusions);
  } catch (error) {
    console.error('Error fetching badges fusions:', error);
    return json({ error: 'Failed to fetch badges fusions' }, { status: 500 });
  }
};

// POST /api/badges-fusions
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreateBadgeFusionData = await request.json();
    const { badge1, badge2, playerId } = data;

    if (!badge1 || !badge2 || playerId === undefined) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const player = await prisma.player.findUnique({
      where: { id: BigInt(playerId) }
    });

    if (!player) {
      return json({ error: 'Player not found' }, { status: 404 });
    }

    const badgeFusion = await prisma.badgeFusion.create({
      data: {
        badge1,
        badge2,
        playerId: BigInt(playerId)
      },
      include: {
        player: {
          select: {
            id: true,
            login: true
          }
        }
      }
    });

    const serializedBadgeFusion: BadgeFusion = serializeBigInt(badgeFusion);
    return json(serializedBadgeFusion, { status: 201 });
  } catch (error) {
    console.error('Error creating badge fusion:', error);
    return json({ error: 'Failed to create badge fusion' }, { status: 500 });
  }
};