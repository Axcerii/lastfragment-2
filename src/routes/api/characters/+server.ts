// src/routes/api/characters/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import fs from 'fs';
import path from 'path';

// GET /api/characters - Récupérer tous les personnages
export const GET: RequestHandler = async () => {
  try {
    const characters = await prisma.character.findMany({
      include: {
        players: {
          select: {
            id: true,
            login: true
          }
        },
        statistics: true,
        passives: true,
        characterSkills: {
          include: {
            skill: true
          }
        }
      }
    });

    return json(characters);
  } catch (error) {
    console.error('Error fetching characters:', error);
    return json({ error: 'Failed to fetch characters' }, { status: 500 });
  }
};

// POST /api/characters - Créer un nouveau personnage
export const POST: RequestHandler = async ({ request }) => {
  try {
    const form = await request.formData();

    const visibility = Number(form.get('visibility'));
    const current = Number(form.get('current'));
    const name = form.get('name') as string;
    const dragon = form.get('dragon') as string;
    const race = form.get('race') as any;
    const country = form.get('country') as any;
    const description = form.get('description') as string;
    const category = form.get('category') as string;

    const flux = form.get('flux') ? String(form.get('flux')) : null;
    const title = form.get('title') ? String(form.get('title')) : null;
    const theme = form.get('theme') ? String(form.get('theme')) : null;

    const imageFile = form.get('image') as File | null;

    // Vérification des champs requis
    if (
      !name ||
      !dragon ||
      !race ||
      !country ||
      !description ||
      !category ||
      visibility === undefined ||
      current === undefined ||
      !imageFile
    ) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Chemin du dossier d’upload local
    const uploadDir = path.join(process.cwd(), 'static', 'uploads', 'personnages');

    // Crée le dossier si inexistant
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Conversion du fichier en buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Génération d’un nom unique pour éviter les conflits
    const safeFileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
    const filePath = path.join(uploadDir, safeFileName);

    // Écriture du fichier sur disque
    fs.writeFileSync(filePath, buffer);

    // Chemin accessible publiquement depuis /static
    const publicPath = `/uploads/personnages/${safeFileName}`;

    const character = await prisma.character.create({
      data: {
        visibility,
        name,
        flux,
        dragon,
        title,
        theme,
        race,
        country,
        image: publicPath,
        description,
        category,
        current
      },
      include: {
        players: {
          select: { id: true, login: true }
        },
        statistics: true,
        passives: true
      }
    });

    return json(character, { status: 201 });
  } catch (error) {
    console.error('Error creating character:', error);
    return json({ error: 'Failed to create character' }, { status: 500 });
  }
};
