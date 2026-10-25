// Nettoyage des textes saisis (cartes, messages d'échange). Sans dépendance : utilisable partout.

/** Texte sur une ligne : caractères de contrôle retirés, espaces resserrés, longueur bornée. */
export function line(value: unknown, max: number): string {
	return String(value ?? '')
		.replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, max);
}

/**
 * Texte sur plusieurs lignes (au plus 6 retours à la ligne). Les retours en tête sont gardés :
 * ils servent à espacer un texte de ce qui le précède (la citation, au verso d'une carte).
 */
export function paragraph(value: unknown, max: number): string {
	let breaks = 0;
	return String(value ?? '')
		.replace(/\r\n?/g, '\n')
		.replace(/[\u0000-\u0009\u000b-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, ' ')
		.replace(/\n/g, () => (++breaks <= 6 ? '\n' : ' '))
		.replace(/[ \t]+/g, ' ')
		.replace(/^ +/, '')
		.trimEnd()
		.slice(0, max);
}
