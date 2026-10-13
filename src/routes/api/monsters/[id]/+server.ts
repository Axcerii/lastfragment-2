import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { saveUploadedFile, isValidImageFile } from '$lib/fileUtils';
import { unlink } from 'fs/promises';
import path from 'path';

// GET /api/monsters/[id] - Récupérer un monstre spécifique
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    const monster = await prisma.monster.findUnique({
      where: { id }
    });

    if (!monster) {
      return json({ error: 'Monster not found' }, { status: 404 });
    }

    return json(monster);
  } catch (error) {
    console.error('Error fetching monster:', error);
    return json({ error: 'Failed to fetch monster' }, { status: 500 });
  }
};

// PUT /api/monsters/[id] - Mettre à jour un monstre
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    const formData = await request.formData();

    const existingMonster = await prisma.monster.findUnique({
      where: { id }
    });

    if (!existingMonster) {
      return json({ error: 'Monster not found' }, { status: 404 });
    }

    const updateData: any = {};

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

    if (visibility !== null) updateData.visibility = parseInt(visibility as string, 10);
    if (name) updateData.name = name as string;
    if (dragon) updateData.dragon = dragon as string;
    if (size) updateData.size = size as string;
    if (weight) updateData.weight = weight as string;
    if (dangerosity !== null) updateData.dangerosity = parseInt(dangerosity as string, 10);
    if (effect) updateData.effect = effect as string;
    if (description) updateData.description = description as string;
    if (current !== null) updateData.current = parseInt(current as string, 10);

    if (imageFile && imageFile.size > 0) {
      if (!isValidImageFile(imageFile)) {
        return json({ error: 'Invalid image file. Please upload a valid image (JPEG, PNG, WebP, GIF) under 5MB' }, { status: 400 });
      }

      if (existingMonster.image) {
        try {
          const oldImagePath = path.join(process.cwd(), 'static', existingMonster.image);
          await unlink(oldImagePath);
        } catch (err) {
          console.warn('Could not delete old image:', err);
        }
      }

      updateData.image = await saveUploadedFile(imageFile, 'monsters');
    }

    const monster = await prisma.monster.update({
      where: { id },
      data: updateData
    });

    return json(monster);
  } catch (error: any) {
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
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    const monster = await prisma.monster.findUnique({
      where: { id }
    });

    if (!monster) {
      return json({ error: 'Monster not found' }, { status: 404 });
    }

    if (monster.image) {
      try {
        const imagePath = path.join(process.cwd(), 'static', monster.image);
        await unlink(imagePath);
      } catch (err) {
        console.warn('Could not delete image file:', err);
      }
    }

    await prisma.monster.delete({
      where: { id }
    });

    return json({ message: 'Monster deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting monster:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Monster not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete monster' }, { status: 500 });
  }
};