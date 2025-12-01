// src/hooks.server.ts
import jwt from 'jsonwebtoken';
import type { Handle } from '@sveltejs/kit';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('jwt');
  event.locals.user = { id: 0, name: '' };

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      console.log('Hooks: Decoded token:', decoded);

      event.locals.user = {
        id: parseInt(decoded.userId),
        name: '' // We might want to fetch the name from DB if needed, but for now ID is enough for "connected" check
      };
      console.log('Hooks: User set to:', event.locals.user);
    } catch (err) {
      console.error('Hooks: Token verification failed:', err);
    }
  } else {
    console.log('Hooks: No token found');
  }

  return resolve(event);
};