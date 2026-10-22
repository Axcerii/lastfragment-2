/**
 * Limiteur de tentatives en mémoire, par clé (adresse IP, nom d'utilisateur…).
 * Suffisant pour un seul processus Node ; les compteurs repartent à zéro au redémarrage.
 */
export class RateLimiter {
	private hits = new Map<string, number[]>();

	constructor(
		private readonly max: number,
		private readonly windowMs: number
	) {}

	private recent(key: string, now = Date.now()): number[] {
		const kept = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
		if (kept.length) this.hits.set(key, kept);
		else this.hits.delete(key);
		return kept;
	}

	/** Vrai si la clé a atteint la limite sur la fenêtre en cours. */
	blocked(key: string): boolean {
		return this.recent(key).length >= this.max;
	}

	/** Compte une tentative pour la clé. */
	hit(key: string) {
		const now = Date.now();
		const kept = this.recent(key, now);
		kept.push(now);
		this.hits.set(key, kept);
		// Ménage de temps en temps pour que la table ne grossisse pas indéfiniment.
		if (this.hits.size > 10_000) for (const k of [...this.hits.keys()]) this.recent(k, now);
	}

	/** Compte une tentative si la limite n'est pas atteinte ; faux sinon. */
	take(key: string): boolean {
		if (this.blocked(key)) return false;
		this.hit(key);
		return true;
	}

	reset(key: string) {
		this.hits.delete(key);
	}
}
