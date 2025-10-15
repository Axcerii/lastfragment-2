// src/routes/api/skills/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { Skill, UpdateSkillData } from '$lib/types';

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

// GET /api/skills/[id]
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    const skill = await prisma.skill.findUnique({
      where: { id }
    });

    if (!skill) {
      return json({ error: 'Skill not found' }, { status: 404 });
    }

    const serializedSkill: Skill = serializeBigInt(skill);
    return json(serializedSkill);
  } catch (error) {
    console.error('Error fetching skill:', error);
    return json({ error: 'Failed to fetch skill' }, { status: 500 });
  }
};

// PUT /api/skills/[id]
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id !== undefined ? BigInt(params.id) : undefined;
    const data: UpdateSkillData = await request.json();

    const updateData: any = {};
    
    if (data.statistics !== undefined) updateData.statistics = data.statistics;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.level !== undefined) updateData.level = BigInt(data.level);

    const skill = await prisma.skill.update({
      where: { id },
      data: updateData
    });

    const serializedSkill: Skill = serializeBigInt(skill);
    return json(serializedSkill);
  } catch (error:any) {
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
    const id = params.id !== undefined ? BigInt(params.id) : undefined;

    await prisma.skill.delete({
      where: { id }
    });

    return json({ message: 'Skill deleted successfully' });
  } catch (error:any) {
    console.error('Error deleting skill:', error);
    if (error.code === 'P2025') {
      return json({ error: 'Skill not found' }, { status: 404 });
    }
    return json({ error: 'Failed to delete skill' }, { status: 500 });
  }
};