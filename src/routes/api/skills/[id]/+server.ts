// src/routes/api/skills/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { UpdateSkillData } from '$lib/types';

// GET /api/skills/[id]
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    const skill = await prisma.skill.findUnique({
      where: { id }
    });

    if (!skill) {
      return json({ error: 'Skill not found' }, { status: 404 });
    }

    return json(skill);
  } catch (error) {
    console.error('Error fetching skill:', error);
    return json({ error: 'Failed to fetch skill' }, { status: 500 });
  }
};

// PUT /api/skills/[id]
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    const data: UpdateSkillData = await request.json();
    const updateData: any = {};

    if (data.statistics !== undefined) updateData.statistics = data.statistics;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.level !== undefined) updateData.level = Number(data.level);

    const skill = await prisma.skill.update({
      where: { id },
      data: updateData
    });

    return json(skill);
  } catch (error: any) {
    console.error('Error updating skill:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Skill not found' }, { status: 404 });
    }
    return json({ error: 'Failed to update skill' }, { status: 500 });
  }
};

// DELETE /api/skills/[id]
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = params.id ? parseInt(params.id, 10) : undefined;
    if (!id || isNaN(id)) {
      return json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.skill.delete({
      where: { id }
    });

    return json({ message: 'Skill deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting skill:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Skill not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete skill' }, { status: 500 });
  }
};