// src/routes/api/statistics/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { UpdateStatisticData } from '$lib/types';

// GET /api/statistics/[id] - Récupérer une statistique spécifique
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid statistic ID' }, { status: 400 });
    }

    const statistic = await prisma.statistic.findUnique({
      where: { id },
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

    if (!statistic) {
      return json({ error: 'Statistic not found' }, { status: 404 });
    }

    return json(statistic);
  } catch (error) {
    console.error('Error fetching statistic:', error);
    return json({ error: 'Failed to fetch statistic' }, { status: 500 });
  }
};

// PUT /api/statistics/[id] - Mettre à jour une statistique
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid statistic ID' }, { status: 400 });
    }

    const data: UpdateStatisticData = await request.json();
    const updateData: any = {};

    if (data.characterId !== undefined) updateData.characterId = Number(data.characterId);
    if (data.qdf !== undefined) updateData.qdf = Number(data.qdf);
    if (data.pv !== undefined) updateData.pv = Number(data.pv);
    if (data.endurance !== undefined) updateData.endurance = Number(data.endurance);
    if (data.strength !== undefined) updateData.strength = Number(data.strength);
    if (data.maitrise !== undefined) updateData.maitrise = Number(data.maitrise);
    if (data.defense !== undefined) updateData.defense = Number(data.defense);
    if (data.vitesse !== undefined) updateData.vitesse = Number(data.vitesse);
    if (data.accuracy !== undefined) updateData.accuracy = Number(data.accuracy);
    if (data.perception !== undefined) updateData.perception = Number(data.perception);
    if (data.furtivite !== undefined) updateData.furtivite = Number(data.furtivite);
    if (data.charisme !== undefined) updateData.charisme = Number(data.charisme);
    if (data.eloquence !== undefined) updateData.eloquence = Number(data.eloquence);
    if (data.intelligence !== undefined) updateData.intelligence = Number(data.intelligence);

    const statistic = await prisma.statistic.update({
      where: { id },
      data: updateData,
      include: {
        character: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return json(statistic);
  } catch (error: any) {
    console.error('Error updating statistic:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Statistic not found' }, { status: 404 });
    }
    return json({ error: 'Failed to update statistic' }, { status: 500 });
  }
};

// DELETE /api/statistics/[id] - Supprimer une statistique
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid statistic ID' }, { status: 400 });
    }

    await prisma.statistic.delete({
      where: { id }
    });

    return json({ message: 'Statistic deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting statistic:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Statistic not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete statistic' }, { status: 500 });
  }
};