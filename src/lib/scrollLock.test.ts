import { afterEach, describe, expect, it, vi } from 'vitest';
import { lockScroll } from './scrollLock';

describe('blocage du défilement', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('deux fenêtres qui se chevauchent rendent la page défilante une fois toutes deux fermées', () => {
		const body = { style: { overflow: '' } };
		vi.stubGlobal('document', { body });
		// La fiche s'ouvre, puis l'ouverture monte avant que la fiche ne soit détruite.
		const sheet = lockScroll();
		const opening = lockScroll();
		expect(body.style.overflow).toBe('hidden');
		sheet();
		expect(body.style.overflow).toBe('hidden');
		opening();
		expect(body.style.overflow).toBe('');
	});

	it('libérer deux fois ne débloque pas une autre fenêtre encore ouverte', () => {
		const body = { style: { overflow: '' } };
		vi.stubGlobal('document', { body });
		const a = lockScroll();
		const b = lockScroll();
		a();
		a();
		expect(body.style.overflow).toBe('hidden');
		b();
		expect(body.style.overflow).toBe('');
	});
});
