/** Petite vibration du téléphone ; le navigateur la refuse (et le signale) tant que la page n'a pas été touchée. */
export function vibrate(pattern: number | number[]) {
	if (typeof navigator !== 'undefined' && navigator.userActivation?.hasBeenActive) navigator.vibrate?.(pattern);
}
