import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { Monster, CreateMonsterData } from '$lib/types';
import { saveUploadedFile, isValidImageFile } from '$lib/fileUtils';

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

// GET /api/monsters - Récupérer tous les monstres
export const GET: RequestHandler = async () => {
  try {
    const monsters = await prisma.monster.findMany({
      orderBy: { name: 'asc' }
    });

    const serializedMonsters: Monster[] = serializeBigInt(monsters);
    return json(serializedMonsters);
  } catch (error) {
    console.error('Error fetching monsters:', error);
    return json({ error: 'Failed to fetch monsters' }, { status: 500 });
  }
};

// POST /api/monsters - Créer un nouveau monstre
export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    
    // Extraire les données du formulaire
    const visibility = parseInt(formData.get('visibility') as string);
    const name = formData.get('name') as string;
    const dragon = formData.get('dragon') as string;
    const size = formData.get('size') as string;
    const weight = formData.get('weight') as string;
    const dangerosity = parseInt(formData.get('dangerosity') as string);
    const effect = formData.get('effect') as string;
    const description = formData.get('description') as string;
    const current = parseInt(formData.get('current') as string);
    const imageFile = formData.get('image') as File;

    // Validation des champs requis
    if (!name || !dragon || !size || !weight || !effect || !description || 
        visibility === undefined || dangerosity === undefined || current === undefined) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validation et sauvegarde de l'image
    let imagePath = 'uploads/monsters/';
    if (imageFile && imageFile.size > 0) {
      if (!isValidImageFile(imageFile)) {
        return json({ error: 'Invalid image file. Please upload a valid image (JPEG, PNG, WebP, GIF) under 5MB' }, { status: 400 });
      }
      imagePath = await saveUploadedFile(imageFile, 'monsters');
    } else {
      return json({ error: 'Image is required' }, { status: 400 });
    }

    const monster = await prisma.monster.create({
      data: {
        visibility,
        name,
        dragon,
        size,
        weight,
        dangerosity: BigInt(dangerosity),
        image: imagePath,
        effect,
        description,
        current
      }
    });

    const serializedMonster: Monster = serializeBigInt(monster);
    return json(serializedMonster, { status: 201 });
  } catch (error) {
    console.error('Error creating monster:', error);
    return json({ error: 'Failed to create monster' }, { status: 500 });
  }
};