import { json, type RequestHandler } from '@sveltejs/kit';
import { isPasswordValid, isStringLongEnough } from '$lib/regex';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '$lib/server/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';


export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const data = await request.json();
    const { login, password, passwordConfirm, characterId, } = data;

    if (!isPasswordValid(password)) {
      return json({ error: 'Le mot de passe ne correspond pas aux exigences' }, { status: 400 });
    }

    if (!isStringLongEnough(login)) {
      return json({ error: 'Le login n\'est pas assez long' }, { status: 400 });
    }

    if (!login || !password) {
      return json({ error: 'Des champs n\'ont pas été correctement remplis' }, { status: 400 });
    }

    if (password !== passwordConfirm) {
      return json({ error: 'Les mots de passe ne correspondent pas' }, { status: 400 });
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
        role: 0,
        team: 0,
        characterId: characterId ? Number(characterId) : null
      },
      include: {
        character: true
      }
    });

    const serializedId = player.id.toString();

    const token = jwt.sign({ userId: serializedId }, JWT_SECRET, { expiresIn: '1h' });

    cookies.set('jwt', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60
    });

    return json({ success: true });
  } catch (error: any) {
    console.error('Error creating player:', error);
    if (error.code === 'P2002') {
      return json({ error: 'Login already exists' }, { status: 409 });
    }
    return json({ error: 'Failed to create player' }, { status: 500 });
  }
};
