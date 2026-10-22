/**
 * État de filtres mémorisé dans le navigateur pendant une durée limitée :
 * on retrouve sa recherche en revenant d'une fiche, mais pas le lendemain.
 */
export function rememberedFilters<T extends object>(key: string, defaults: T, minutes = 10) {
	const filters = $state({ ...defaults });

	// La lecture se fait après le montage : le rendu serveur ne connaît pas le navigateur,
	// et les deux doivent d'abord produire la même page.
	let loaded = false;
	$effect(() => {
		if (!loaded) {
			loaded = true;
			try {
				const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
				if (saved && Date.now() - saved.at < minutes * 60_000) Object.assign(filters, saved.value);
			} catch {
				// Valeur illisible : on garde les filtres par défaut.
			}
		}
		localStorage.setItem(key, JSON.stringify({ at: Date.now(), value: filters }));
	});

	return filters;
}
