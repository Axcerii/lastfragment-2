// src/routes/api/passives/+server.ts
import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';
import type { Passive, CreatePassiveData } from '$lib/types';

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

// GET /api/passives
export const GET: RequestHandler = async ({ url }) => {
  try {
    const characterId = url.searchParams.get('characterId');
    
    const where = characterId ? { characterId: BigInt(characterId) } : {};
    
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

    const serializedPassives: Passive[] = serializeBigInt(passives);
    return json(serializedPassives);
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
      where: { id: BigInt(characterId) }
    });

    if (!character) {
      return json({ error: 'Character not found' }, { status: 404 });
    }

    const passive = await prisma.passive.create({
      data: {
        characterId: BigInt(characterId),
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

    const serializedPassive: Passive = serializeBigInt(passive);
    return json(serializedPassive, { status: 201 });
  } catch (error) {
    console.error('Error creating passive:', error);
    return json({ error: 'Failed to create passive' }, { status: 500 });
  }
};