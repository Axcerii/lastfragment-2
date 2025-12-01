import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const POST: RequestHandler = async ({ request, cookies }) => {

  const { login, password } = await request.json();

  const player = await prisma.player.findUnique({ where: { login } });
  if (!player) return json({ error: 'Identifiants incorrects' }, { status: 401 });

  const valid = await bcrypt.compare(password, player.password);

  if (!valid) return json({ error: 'Identifiants incorrects' }, { status: 401 });


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
};
