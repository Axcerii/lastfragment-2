// src/routes/api/characters/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { Character, UpdateCharacterData } from '$lib/types';

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

// GET /api/characters/[id] - Récupérer un personnage spécifique
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        players: {
          select: {
            id: true,
            login: true
          }
        },
        statistics: true,
        passives: true
      }
    });

    if (!character) {
      return json({ error: 'Character not found' }, { status: 404 });
    }

    const serializedCharacter: Character = serializeBigInt(character);
    return json(serializedCharacter);
  } catch (error) {
    console.error('Error fetching character:', error);
    return json({ error: 'Failed to fetch character' }, { status: 500 });
  }
};

// PUT /api/characters/[id] - Mettre à jour un personnage
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    const data: UpdateCharacterData = await request.json();

    const updateData: any = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    const character = await prisma.character.update({
      where: { id },
      data: updateData,
      include: {
        players: {
          select: {
            id: true,
            login: true
          }
        },
        statistics: {
          select: {
            id: true,
            qdf: true,
            pv: true
          }
        }
      }
    });

    const serializedCharacter: Character = serializeBigInt(character);
    return json(serializedCharacter);
  } catch (error: any) {
    console.error('Error updating character:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Character not found' }, { status: 404 });
    }
    return json({ error: 'Failed to update character' }, { status: 500 });
  }
};

// DELETE /api/characters/[id] - Supprimer un personnage
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    
    await prisma.character.delete({
      where: { id }
    });

    return json({ message: 'Character deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting character:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Character not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete character' }, { status: 500 });
  }
};