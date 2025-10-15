import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { Statistic, CreateStatisticData } from '$lib/types';

const prisma = new PrismaClient();

// Fonction utilitaire pour sérialiser les BigInt
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

// GET /api/statistics - Récupérer toutes les statistiques
export const GET: RequestHandler = async ({ url }) => {
  try {
    const characterId = url.searchParams.get('characterId');
    
    const where = characterId ? { characterId: BigInt(characterId) } : {};
    
    const statistics = await prisma.statistic.findMany({
      where,
      include: {
        character: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    const serializedStatistics: Statistic[] = serializeBigInt(statistics);
    return json(serializedStatistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
};

// POST /api/statistics - Créer une nouvelle statistique
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreateStatisticData = await request.json();
    const { 
      characterId, qdf, pv, endurance, strength, maitrise, defense, 
      vitesse, accuracy, perception, furtivite, charisme, eloquence, intelligence 
    } = data;

    // Validation des champs requis
    if (characterId === undefined || qdf === undefined || pv === undefined || 
        endurance === undefined || strength === undefined || maitrise === undefined || 
        defense === undefined || vitesse === undefined || accuracy === undefined || 
        perception === undefined || furtivite === undefined || charisme === undefined || 
        eloquence === undefined || intelligence === undefined) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Vérifier que le personnage existe
    const character = await prisma.character.findUnique({
      where: { id: BigInt(characterId) }
    });

    if (!character) {
      return json({ error: 'Character not found' }, { status: 404 });
    }

    const statistic = await prisma.statistic.create({
      data: {
        characterId: BigInt(characterId),
        qdf: BigInt(qdf),
        pv: BigInt(pv),
        endurance: BigInt(endurance),
        strength: BigInt(strength),
        maitrise: BigInt(maitrise),
        defense: BigInt(defense),
        vitesse: BigInt(vitesse),
        accuracy: BigInt(accuracy),
        perception: BigInt(perception),
        furtivite: BigInt(furtivite),
        charisme: BigInt(charisme),
        eloquence: BigInt(eloquence),
        intelligence: BigInt(intelligence)
      },
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
    return json(serializedStatistic, { status: 201 });
  } catch (error) {
    console.error('Error creating statistic:', error);
    return json({ error: 'Failed to create statistic' }, { status: 500 });
  }
};