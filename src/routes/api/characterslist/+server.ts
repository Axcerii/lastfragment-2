import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const GET: RequestHandler = async ({ cookies }) => {
    // Check if user is authenticated via JWT cookie
    const token = cookies.get('jwt');
    let isAdmin = false;

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
            const userId = parseInt(decoded.userId, 10);

            // Fetch the user's role from the database
            const player = await prisma.player.findUnique({
                where: { id: userId },
                select: { role: true }
            });

            if (player && player.role === 10) {
                isAdmin = true;
            }
        } catch (err) {
            console.error('Token verification failed:', err);
        }
    }

    // If admin, get all characters; otherwise, only visible ones
    const characters = await prisma.character.findMany({
        where: isAdmin ? {} : { visibility: 1 },
        select: {
            id: true,
            name: true,
            country: true,
            image: true,
            description: true,
            category: true,
            current: true,
            title: true
        }
    });

    return json(characters);
};