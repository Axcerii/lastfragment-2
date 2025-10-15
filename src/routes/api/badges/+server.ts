// src/routes/api/badges/+server.ts
import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from './$types';
import type { Badge, CreateBadgeData } from '$lib/types';

const prisma = new PrismaClient();

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

// GET /api/badges
export const GET: RequestHandler = async () => {
  try {
    const badges = await prisma.badge.findMany({
      orderBy: { name: 'asc' }
    });

    const serializedBadges: Badge[] = serializeBigInt(badges);
    return json(serializedBadges);
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

    const serializedBadge: Badge = serializeBigInt(badge);
    return json(serializedBadge, { status: 201 });
  } catch (error) {
    console.error('Error creating badge:', error);
    return json({ error: 'Failed to create badge' }, { status: 500 });
  }
};
