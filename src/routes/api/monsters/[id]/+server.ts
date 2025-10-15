import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';
import type { Monster, UpdateMonsterData } from '$lib/types';
import { saveUploadedFile, isValidImageFile } from '$lib/fileUtils';
import { unlink } from 'fs/promises';
import path from 'path';

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

// GET /api/monsters/[id] - Récupérer un monstre spécifique
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = typeof params.id === 'string' ? BigInt(params.id) : undefined;
    const monster = await prisma.monster.findUnique({
      where: { id }
    });

    if (!monster) {
      return json({ error: 'Monster not found' }, { status: 404 });
    }

    const serializedMonster: Monster = serializeBigInt(monster);
    return json(serializedMonster);
  } catch (error) {
    console.error('Error fetching monster:', error);
    return json({ error: 'Failed to fetch monster' }, { status: 500 });
  }
};

// PUT /api/monsters/[id] - Mettre à jour un monstre
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = typeof params.id === 'string' ? BigInt(params.id) : undefined;
    const formData = await request.formData();

    // Vérifier que le monstre existe
    const existingMonster = await prisma.monster.findUnique({
      where: { id }
    });

    if (!existingMonster) {
      return json({ error: 'Monster not found' }, { status: 404 });
    }

    const updateData: any = {};
    
    // Mettre à jour les champs fournis
    const visibility = formData.get('visibility');
    const name = formData.get('name');
    const dragon = formData.get('dragon');
    const size = formData.get('size');
    const weight = formData.get('weight');
    const dangerosity = formData.get('dangerosity');
    const effect = formData.get('effect');
    const description = formData.get('description');
    const current = formData.get('current');
    const imageFile = formData.get('image') as File;

    if (visibility !== null) updateData.visibility = parseInt(visibility as string);
    if (name) updateData.name = name as string;
    if (dragon) updateData.dragon = dragon as string;
    if (size) updateData.size = size as string;
    if (weight) updateData.weight = weight as string;
    if (dangerosity !== null) updateData.dangerosity = BigInt(parseInt(dangerosity as string));
    if (effect) updateData.effect = effect as string;
    if (description) updateData.description = description as string;
    if (current !== null) updateData.current = parseInt(current as string);

    // Gestion de l'image
    if (imageFile && imageFile.size > 0) {
      if (!isValidImageFile(imageFile)) {
        return json({ error: 'Invalid image file. Please upload a valid image (JPEG, PNG, WebP, GIF) under 5MB' }, { status: 400 });
      }

      // Supprimer l'ancienne image si elle existe
      if (existingMonster.image) {
        try {
          const oldImagePath = path.join(process.cwd(), 'static', existingMonster.image);
          await unlink(oldImagePath);
        } catch (err) {
          console.warn('Could not delete old image:', err);
        }
      }

      // Sauvegarder la nouvelle image
      updateData.image = await saveUploadedFile(imageFile, 'monsters');
    }

    const monster = await prisma.monster.update({
      where: { id },
      data: updateData
    });

    const serializedMonster: Monster = serializeBigInt(monster);
    return json(serializedMonster);
  } catch (error:any) {
    console.error('Error updating monster:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Monster not found' }, { status: 404 });
    }
    return json({ error: 'Failed to update monster' }, { status: 500 });
  }
};

// DELETE /api/monsters/[id] - Supprimer un monstre
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = typeof params.id === 'string' ? BigInt(params.id) : undefined;
    
    // Récupérer le monstre pour obtenir le chemin de l'image
    const monster = await prisma.monster.findUnique({
      where: { id }
    });

    if (!monster) {
      return json({ error: 'Monster not found' }, { status: 404 });
    }

    // Supprimer l'image du système de fichiers
    if (monster.image) {
      try {
        const imagePath = path.join(process.cwd(), 'static', monster.image);
        await unlink(imagePath);
      } catch (err) {
        console.warn('Could not delete image file:', err);
      }
    }

    // Supprimer le monstre de la base de données
    await prisma.monster.delete({
      where: { id }
    });

    return json({ message: 'Monster deleted successfully' });
  } catch (error:any) {
    console.error('Error deleting monster:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Monster not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete monster' }, { status: 500 });
  }
};