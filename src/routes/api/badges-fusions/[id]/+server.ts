// src/routes/api/badges-fusions/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { BadgeFusion, UpdateBadgeFusionData } from '$lib/types';

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

// GET /api/badges-fusions/[id]
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    const badgeFusion = await prisma.badgeFusion.findUnique({
      where: { id },
      include: {
        player: {
          select: {
            id: true,
            login: true,
            character: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!badgeFusion) {
      return json({ error: 'Badge fusion not found' }, { status: 404 });
    }

    const serializedBadgeFusion: BadgeFusion = serializeBigInt(badgeFusion);
    return json(serializedBadgeFusion);
  } catch (error) {
    console.error('Error fetching badge fusion:', error);
    return json({ error: 'Failed to fetch badge fusion' }, { status: 500 });
  }
};

// PUT /api/badges-fusions/[id]
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    const data: UpdateBadgeFusionData = await request.json();

    const updateData: any = {};
    
    if (data.badge1 !== undefined) updateData.badge1 = data.badge1;
    if (data.badge2 !== undefined) updateData.badge2 = data.badge2;
    if (data.playerId !== undefined) updateData.playerId = BigInt(data.playerId);

    const badgeFusion = await prisma.badgeFusion.update({
      where: { id },
      data: updateData,
      include: {
        player: {
          select: {
            id: true,
            login: true
          }
        }
      }
    });

    const serializedBadgeFusion: BadgeFusion = serializeBigInt(badgeFusion);
    return json(serializedBadgeFusion);
  } catch (error:any) {
    console.error('Error updating badge fusion:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Badge fusion not found' }, { status: 404 });
    }
    return json({ error: 'Failed to update badge fusion' }, { status: 500 });
  }
};

// DELETE /api/badges-fusions/[id]
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    
    await prisma.badgeFusion.delete({
      where: { id }
    });

    return json({ message: 'Badge fusion deleted successfully' });
  } catch (error:any) {
    console.error('Error deleting badge fusion:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Badge fusion not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete badge fusion' }, { status: 500 });
  }
};