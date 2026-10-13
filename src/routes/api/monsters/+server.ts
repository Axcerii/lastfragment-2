import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { saveUploadedFile, isValidImageFile } from '$lib/fileUtils';

// GET /api/monsters - Récupérer tous les monstres
export const GET: RequestHandler = async () => {
  try {
    const monsters = await prisma.monster.findMany({
      orderBy: { name: 'asc' }
    });

    return json(monsters);
  } catch (error) {
    console.error('Error fetching monsters:', error);
    return json({ error: 'Failed to fetch monsters' }, { status: 500 });
  }
};

// POST /api/monsters - Créer un nouveau monstre
export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();

    const visibility = parseInt(formData.get('visibility') as string, 10);
    const name = formData.get('name') as string;
    const dragon = formData.get('dragon') as string;
    const size = formData.get('size') as string;
    const weight = formData.get('weight') as string;
    const dangerosity = parseInt(formData.get('dangerosity') as string, 10);
    const effect = formData.get('effect') as string;
    const description = formData.get('description') as string;
    const current = parseInt(formData.get('current') as string, 10);
    const imageFile = formData.get('image') as File;

    if (!name || !dragon || !size || !weight || !effect || !description ||
        isNaN(visibility) || isNaN(dangerosity) || isNaN(current)) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

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
        dangerosity,
        image: imagePath,
        effect,
        description,
        current
      }
    });

    return json(monster, { status: 201 });
  } catch (error) {
    console.error('Error creating monster:', error);
    return json({ error: 'Failed to create monster' }, { status: 500 });
  }
};