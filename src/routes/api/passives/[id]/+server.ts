// src/routes/api/passives/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { Passive, UpdatePassiveData } from '$lib/types';

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

// GET /api/passives/[id]
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;

    const passive = await prisma.passive.findUnique({
      where: { id },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            race: true,
            country: true,
            image: true,
            description: true
          }
        }
      }
    });

    if (!passive) {
      return json({ error: 'Passive not found' }, { status: 404 });
    }

    const serializedPassive: Passive = serializeBigInt(passive);
    return json(serializedPassive);
  } catch (error) {
    console.error('Error fetching passive:', error);
    return json({ error: 'Failed to fetch passive' }, { status: 500 });
  }
};

// PUT /api/passives/[id]
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;

    const data: UpdatePassiveData = await request.json();

    const updateData: any = {};
    
    if (data.characterId !== undefined) updateData.characterId = BigInt(data.characterId);
    if (data.statistics !== undefined) updateData.statistics = data.statistics;
    if (data.maths !== undefined) updateData.maths = data.maths;

    const passive = await prisma.passive.update({
      where: { id },
      data: updateData,
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
    return json(serializedPassive);
  } catch (error:any) {
    console.error('Error updating passive:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Passive not found' }, { status: 404 });
    }
    return json({ error: 'Failed to update passive' }, { status: 500 });
  }
};

// DELETE /api/passives/[id]
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    
    await prisma.passive.delete({
      where: { id }
    });

    return json({ message: 'Passive deleted successfully' });
  } catch (error:any) {
    console.error('Error deleting passive:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Passive not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete passive' }, { status: 500 });
  }
};