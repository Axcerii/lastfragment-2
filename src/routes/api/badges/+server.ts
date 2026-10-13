// src/routes/api/badges/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { CreateBadgeData } from '$lib/types';

// GET /api/badges
export const GET: RequestHandler = async () => {
  try {
    const badges = await prisma.badge.findMany({
      orderBy: { name: 'asc' }
    });

    return json(badges);
  } catch (error) {
    console.error('Error fetching badges:', error);
    return json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
};

// POST /api/badges
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreateBadgeData = await request.json();
    const { badges, name, description } = data;

    if (!badges || !name || !description) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const badge = await prisma.badge.create({
      data: {
        badges,
        name,
        description
      }
    });

    return json(badge, { status: 201 });
  } catch (error) {
    console.error('Error creating badge:', error);
    return json({ error: 'Failed to create badge' }, { status: 500 });
  }
};
