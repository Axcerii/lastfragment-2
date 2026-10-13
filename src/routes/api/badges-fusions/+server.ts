// src/routes/api/badges-fusions/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { CreateBadgeFusionData } from '$lib/types';

// GET /api/badges-fusions
export const GET: RequestHandler = async ({ url }) => {
  try {
    const playerId = url.searchParams.get('playerId');
    const where = playerId ? { playerId: parseInt(playerId, 10) } : {};

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

    return json(badgesFusions);
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
      where: { id: Number(playerId) }
    });

    if (!player) {
      return json({ error: 'Player not found' }, { status: 404 });
    }

    const badgeFusion = await prisma.badgeFusion.create({
      data: {
        badge1,
        badge2,
        playerId: Number(playerId)
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

    return json(badgeFusion, { status: 201 });
  } catch (error) {
    console.error('Error creating badge fusion:', error);
    return json({ error: 'Failed to create badge fusion' }, { status: 500 });
  }
};