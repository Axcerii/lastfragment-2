import jwt from 'jsonwebtoken';
import type { Handle } from '@sveltejs/kit';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('jwt');

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      event.locals.user = decoded as { id: number, name: string };
    } catch {
      event.locals.user.id = 0;
      event.locals.user.name = "";
    }
  }
  return resolve(event);
};