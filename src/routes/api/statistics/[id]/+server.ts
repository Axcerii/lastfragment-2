// src/routes/api/statistics/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';
import type { Statistic, UpdateStatisticData } from '$lib/types';

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

// GET /api/statistics/[id] - Récupérer une statistique spécifique
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
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

    const serializedStatistic: Statistic = serializeBigInt(statistic);
    return json(serializedStatistic);
  } catch (error) {
    console.error('Error fetching statistic:', error);
    return json({ error: 'Failed to fetch statistic' }, { status: 500 });
  }
};

// PUT /api/statistics/[id] - Mettre à jour une statistique
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    const data: UpdateStatisticData = await request.json();

    const updateData: any = {};
    
    if (data.characterId !== undefined) updateData.characterId = BigInt(data.characterId);
    if (data.qdf !== undefined) updateData.qdf = BigInt(data.qdf);
    if (data.pv !== undefined) updateData.pv = BigInt(data.pv);
    if (data.endurance !== undefined) updateData.endurance = BigInt(data.endurance);
    if (data.strength !== undefined) updateData.strength = BigInt(data.strength);
    if (data.maitrise !== undefined) updateData.maitrise = BigInt(data.maitrise);
    if (data.defense !== undefined) updateData.defense = BigInt(data.defense);
    if (data.vitesse !== undefined) updateData.vitesse = BigInt(data.vitesse);
    if (data.accuracy !== undefined) updateData.accuracy = BigInt(data.accuracy);
    if (data.perception !== undefined) updateData.perception = BigInt(data.perception);
    if (data.furtivite !== undefined) updateData.furtivite = BigInt(data.furtivite);
    if (data.charisme !== undefined) updateData.charisme = BigInt(data.charisme);
    if (data.eloquence !== undefined) updateData.eloquence = BigInt(data.eloquence);
    if (data.intelligence !== undefined) updateData.intelligence = BigInt(data.intelligence);

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

    const serializedStatistic: Statistic = serializeBigInt(statistic);
    return json(serializedStatistic);
  } catch (error:any) {
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
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    
    await prisma.statistic.delete({
      where: { id }
    });

    return json({ message: 'Statistic deleted successfully' });
  } catch (error:any) {
    console.error('Error deleting statistic:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Statistic not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete statistic' }, { status: 500 });
  }
};