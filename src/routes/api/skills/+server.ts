// src/routes/api/skills/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { Skill, CreateSkillData } from '$lib/types';

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

// GET /api/skills
export const GET: RequestHandler = async ({ url }) => {
  try {
    const statistics = url.searchParams.get('statistics');
    
    const where = statistics ? { statistics: statistics as any } : {};
    
    const skills = await prisma.skill.findMany({
      where,
      orderBy: [
        { statistics: 'asc' },
        { level: 'asc' }
      ]
    });

    const serializedSkills: Skill[] = serializeBigInt(skills);
    return json(serializedSkills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
};

// POST /api/skills
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: CreateSkillData = await request.json();
    const { statistics, name, description, level } = data;

    if (!statistics || !name || !description || level === undefined) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const skill = await prisma.skill.create({
      data: {
        statistics,
        name,
        description,
        level: BigInt(level)
      }
    });

    const serializedSkill: Skill = serializeBigInt(skill);
    return json(serializedSkill, { status: 201 });
  } catch (error) {
    console.error('Error creating skill:', error);
    return json({ error: 'Failed to create skill' }, { status: 500 });
  }
};