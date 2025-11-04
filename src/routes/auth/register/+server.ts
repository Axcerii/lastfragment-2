import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { isPasswordValid, isStringLongEnough } from '$lib/regex';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { login, password, characterId } = data;

    if (!isPasswordValid(password)) {
      return json({ error: 'Le mot de passe ne correspond pas aux exigences' }, { status: 400 });
    }

    if (!isStringLongEnough(login)) {
      return json({ error: 'Le login n\'est pas assez long' }, { status: 400 });
    }

    if (!login || !password) {
      return json({ error: 'Des champs n\'ont pas été correctement remplis' }, { status: 400 });
    }

    const existingPlayer = await prisma.player.findUnique({ where: { login } });
    if (existingPlayer) {
      return json({ error: 'Nom d\'utilisateur deja pris' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const player = await prisma.player.create({
      data: {
        login,
        password: hashedPassword,
        role: BigInt(0),
        team: BigInt(0),
        characterId: characterId ? BigInt(characterId) : null
      },
      include: {
        character: true
      }
    });



    return json("Reussi", { status: 201 });
  } catch (error: any) {
    console.error('Error creating player:', error);
    if (error.code === 'P2002') {
      return json({ error: 'Login already exists' }, { status: 409 });
    }
    return json({ error: 'Failed to create player' }, { status: 500 });
  }
};
