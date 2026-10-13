import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { CreateStatisticData } from '$lib/types';

// GET /api/statistics - Récupérer toutes les statistiques
export const GET: RequestHandler = async ({ url }) => {
  try {
    const characterId = url.searchParams.get('characterId');
    const where = characterId ? { characterId: parseInt(characterId, 10) } : {};

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

    return json(statistics);
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
      where: { id: Number(characterId) }
    });

    if (!character) {
      return json({ error: 'Character not found' }, { status: 404 });
    }

    const statistic = await prisma.statistic.create({
      data: {
        characterId: Number(characterId),
        qdf: Number(qdf),
        pv: Number(pv),
        endurance: Number(endurance),
        strength: Number(strength),
        maitrise: Number(maitrise),
        defense: Number(defense),
        vitesse: Number(vitesse),
        accuracy: Number(accuracy),
        perception: Number(perception),
        furtivite: Number(furtivite),
        charisme: Number(charisme),
        eloquence: Number(eloquence),
        intelligence: Number(intelligence)
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

    return json(statistic, { status: 201 });
  } catch (error: any) {
    console.error('Error creating statistic:', error);
    if (error.code === 'P2002') {
      return json({ error: 'Character already has statistics' }, { status: 409 });
    }
    return json({ error: 'Failed to create statistic' }, { status: 500 });
  }
};