// src/routes/api/badges/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { UpdateBadgeData } from '$lib/types';

// GET /api/badges/[id]
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    const badge = await prisma.badge.findUnique({
      where: { id }
    });

    if (!badge) {
      return json({ error: 'Badge not found' }, { status: 404 });
    }

    return json(badge);
  } catch (error) {
    console.error('Error fetching badge:', error);
    return json({ error: 'Failed to fetch badge' }, { status: 500 });
  }
};

// PUT /api/badges/[id]
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    const data: UpdateBadgeData = await request.json();
    const updateData: any = {};

    if (data.badges !== undefined) updateData.badges = data.badges;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    const badge = await prisma.badge.update({
      where: { id },
      data: updateData
    });

    return json(badge);
  } catch (error: any) {
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
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.badge.delete({
      where: { id }
    });

    return json({ message: 'Badge deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting badge:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Badge not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete badge' }, { status: 500 });
  }
};
