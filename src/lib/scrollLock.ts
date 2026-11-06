// Blocage du défilement de la page sous une fenêtre plein écran (fiche d'un booster, ouverture,
// carte en grand, écran de censure…).
//
// Plusieurs fenêtres peuvent se chevaucher : « Ouvrir ce booster » ferme la fiche et monte
// l'ouverture dans le même rendu. Quand chacune retenait l'ancien `overflow` pour le remettre en
// partant, l'ouverture retenait « hidden » (posé par la fiche) et le remettait à sa fermeture :
// la page ne défilait plus du tout. Ici un compteur partagé : la page est bloquée tant qu'au moins
// une fenêtre la bloque, et retrouve son état d'origine quand la dernière se ferme.

let holders = 0;
let saved = '';

/** Bloque le défilement ; renvoie la fonction qui le libère (sans effet si appelée deux fois). */
export function lockScroll(): () => void {
	if (typeof document === 'undefined') return () => {};
	if (holders++ === 0) {
		saved = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
	}
	let released = false;
	return () => {
		if (released) return;
		released = true;
		if (--holders === 0) document.body.style.overflow = saved;
	};
}
