import type { GaugeView, TokenView } from '$lib/table/types';

/** Remplissage d'une jauge entre 0 et 1, qu'on en connaisse les chiffres ou non. */
export function gaugeRatio(gauge: GaugeView | null): number | null {
	if (!gauge) return null;
	if ('ratio' in gauge) return gauge.ratio;
	return gauge.max > 0 ? Math.max(0, Math.min(1, gauge.current / gauge.max)) : 0;
}

export const GAUGE_INFO = {
	pv: { label: 'PV', color: '#6fbf73' },
	qdf: { label: 'QdF', color: '#7fa8e0' },
	endurance: { label: 'END', color: '#d2b674' }
} as const;

export type GaugeKey = keyof typeof GAUGE_INFO;

export const gaugeOf = (token: TokenView, key: GaugeKey) => token[key];
