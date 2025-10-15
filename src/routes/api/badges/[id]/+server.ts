// src/routes/api/badges/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { Badge, UpdateBadgeData } from '$lib/types';

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

// GET /api/badges/[id]
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;

    const badge = await prisma.badge.findUnique({
      where: { id }
    });

    if (!badge) {
      return json({ error: 'Badge not found' }, { status: 404 });
    }

    const serializedBadge: Badge = serializeBigInt(badge);
    return json(serializedBadge);
  } catch (error) {
    console.error('Error fetching badge:', error);
    return json({ error: 'Failed to fetch badge' }, { status: 500 });
  }
};

// PUT /api/badges/[id]
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    const data: UpdateBadgeData = await request.json();

    const updateData: any = {};
    
    if (data.badges !== undefined) updateData.badges = data.badges;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    const badge = await prisma.badge.update({
      where: { id },
      data: updateData
    });

    const serializedBadge: Badge = serializeBigInt(badge);
    return json(serializedBadge);
  } catch (error:any) {
    console.error('Error updating badge:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Badge not found' }, { status: 404 });
    }
    return json({ error: 'Failed to update badge' }, { status: 500 });
  }
};

// DELETE /api/badges/[id]
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    
    await prisma.badge.delete({
      where: { id }
    });

    return json({ message: 'Badge deleted successfully' });
  } catch (error:any) {
    console.error('Error deleting badge:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Badge not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete badge' }, { status: 500 });
  }
};
