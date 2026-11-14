import { STAT_KEYS, type StatBlock } from '$lib/game/stats';
import { revealFlux, type FluxResult } from './quiz';
import { lineageOf, type Race } from './races';

// « Créer mon personnage » : le certificat de flux pré-remplit le créateur de personnage
// (/outils/createur). Le brouillon passe par le sessionStorage, le temps de changer de page.

export const CHARACTER_DRAFT_KEY = 'flux_personnage';

export type CharacterDraft = { name: string; description: string; stats: StatBlock };

/** Nom tiré parmi les prénoms du flux, stats du certificat, peuple et flux en description. */
export function characterDraft(result: FluxResult, race: Race | null, random: () => number = Math.random): CharacterDraft {
	const flux = revealFlux(result);
	const lineage = race ? lineageOf(race, result.halfGiant) : null;
	const name = flux.names[Math.floor(random() * flux.names.length)] ?? '';
	const blessing = result.chaos
		? 'Chaos'
		: `bénédiction de ${result.first === result.second ? result.first : `${result.first} et ${result.second}`}`;
	const fluxLine = lineage && !lineage.hasFlux ? `Flux : Aucun, flux caché : ${flux.name}` : `Flux : ${flux.name}`;
	const lines = lineage ? [`Race : ${lineage.name}`, lineage.summary, ''] : [];
	lines.push(`${fluxLine} (${blessing})`, flux.description);
	return { name, description: lines.join('\n'), stats: { ...result.stats } };
}

/** Brouillon relu par le créateur : null s'il manque ou s'il est abîmé. */
export function readCharacterDraft(value: unknown): CharacterDraft | null {
	if (!value || typeof value !== 'object') return null;
	const { name, description, stats } = value as Record<string, unknown>;
	if (typeof name !== 'string' || typeof description !== 'string' || !stats || typeof stats !== 'object') return null;
	const block = stats as Record<string, unknown>;
	if (!STAT_KEYS.every((k) => typeof block[k] === 'number' && Number.isFinite(block[k]))) return null;
	return { name, description, stats: Object.fromEntries(STAT_KEYS.map((k) => [k, block[k]])) as StatBlock };
}
