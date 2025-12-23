import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

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

export const GET: RequestHandler = async ({ cookies }) => {
    // Check if user is authenticated via JWT cookie
    const token = cookies.get('jwt');
    let isAdmin = false;

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
            const userId = BigInt(decoded.userId);

            // Fetch the user's role from the database
            const player = await prisma.player.findUnique({
                where: { id: userId },
                select: { role: true }
            });

            // Check if user is admin (assuming role === 1 means admin, adjust as needed)
            if (player && player.role === 10n) {
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

    const serializedCharacters = serializeBigInt(characters);
    return json(serializedCharacters);
};