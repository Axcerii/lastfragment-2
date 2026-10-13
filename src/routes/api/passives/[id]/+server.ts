// src/routes/api/passives/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { UpdatePassiveData } from '$lib/types';

// GET /api/passives/[id]
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

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

    return json(passive);
  } catch (error) {
    console.error('Error fetching passive:', error);
    return json({ error: 'Failed to fetch passive' }, { status: 500 });
  }
};

// PUT /api/passives/[id]
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    const data: UpdatePassiveData = await request.json();
    const updateData: any = {};

    if (data.characterId !== undefined) updateData.characterId = Number(data.characterId);
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

    return json(passive);
  } catch (error: any) {
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
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.passive.delete({
      where: { id }
    });

    return json({ message: 'Passive deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting passive:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Passive not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete passive' }, { status: 500 });
  }
};