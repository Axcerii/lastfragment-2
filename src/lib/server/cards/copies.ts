// Exemplaires donnés, retirés ou déplacés par le MJ. Un exemplaire retiré à un joueur n'est
// jamais supprimé : il reste dans la réserve du MJ (`ownerId` null) avec son historique.

import { prisma } from '../prisma';
import { printCopy } from './boosters';
import { CardError } from './settings';
import { expireTradesFor } from './trades';

/** Donne `count` exemplaires neufs d'un modèle publié ou retiré à un joueur. */
export async function giveCard(templateId: number, playerId: number, count = 1): Promise<number> {
	const template = await prisma.cardTemplate.findUnique({ where: { id: templateId }, select: { status: true } });
	if (!template) throw new CardError('Carte introuvable.', 404);
	if (template.status === 'brouillon') throw new CardError('Publie la carte avant de la donner.');
	if (!(await prisma.player.findUnique({ where: { id: playerId }, select: { id: true } }))) {
		throw new CardError('Joueur introuvable.', 404);
	}
	return prisma.$transaction(async (tx) => {
		let given = 0;
		for (let i = 0; i < Math.min(20, Math.max(1, count)); i++) {
			const card = await printCopy(tx, templateId, playerId, 'mj');
			if (!card) break;
			await tx.cardEvent.create({ data: { cardId: card.id, kind: 'don', toId: playerId } });
			given++;
		}
		if (given === 0) throw new CardError('Le tirage limité de cette carte est épuisé.');
		return given;
	});
}

/** Retire un exemplaire à son propriétaire ; il reste dans la réserve du MJ. */
export async function removeCard(cardId: number) {
	const card = await prisma.card.findUnique({ where: { id: cardId }, select: { ownerId: true } });
	if (!card) throw new CardError('Exemplaire introuvable.', 404);
	if (card.ownerId === null) return;
	await prisma.$transaction([
		prisma.card.update({ where: { id: cardId }, data: { ownerId: null, pinned: false } }),
		prisma.cardEvent.create({ data: { cardId, kind: 'retrait', fromId: card.ownerId } })
	]);
	await expireTradesFor([cardId]);
}

/** Déplace un exemplaire vers un autre joueur (ou depuis la réserve du MJ). */
export async function moveCard(cardId: number, toId: number) {
	const card = await prisma.card.findUnique({ where: { id: cardId }, select: { ownerId: true } });
	if (!card) throw new CardError('Exemplaire introuvable.', 404);
	if (card.ownerId === toId) return;
	if (!(await prisma.player.findUnique({ where: { id: toId }, select: { id: true } }))) {
		throw new CardError('Joueur introuvable.', 404);
	}
	await prisma.$transaction([
		prisma.card.update({ where: { id: cardId }, data: { ownerId: toId, pinned: false } }),
		prisma.cardEvent.create({ data: { cardId, kind: card.ownerId === null ? 'don' : 'transfert', fromId: card.ownerId, toId } })
	]);
	await expireTradesFor([cardId]);
}
