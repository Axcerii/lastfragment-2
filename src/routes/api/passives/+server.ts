// src/routes/api/passives/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { CreatePassiveData } from '$lib/types';

// GET /api/passives
export const GET: RequestHandler = async ({ url }) => {
  try {
    const characterId = url.searchParams.get('characterId');
    const where = characterId ? { characterId: parseInt(characterId, 10) } : {};

    const passives = await prisma.passive.findMany({
      where,
      include: {
        character: {
          select: {
            id: true,
            name: true,
            race: true,
            country: true
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    return json(passives);
  } catch (error) {
    console.error('Error fetching passives:', error);
    return json({ error: 'Failed to fetch passives' }, { status: 500 });
  }
};

// POST /api/passives
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreatePassiveData = await request.json();
    const { characterId, statistics, maths } = data;

    if (characterId === undefined || !statistics || !maths) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const character = await prisma.character.findUnique({
      where: { id: Number(characterId) }
    });

    if (!character) {
      return json({ error: 'Character not found' }, { status: 404 });
    }

    const passive = await prisma.passive.create({
      data: {
        characterId: Number(characterId),
        statistics,
        maths
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            race: true,
            country: true
          }
        }
      }
    });

    return json(passive, { status: 201 });
  } catch (error) {
    console.error('Error creating passive:', error);
    return json({ error: 'Failed to create passive' }, { status: 500 });
  }
};