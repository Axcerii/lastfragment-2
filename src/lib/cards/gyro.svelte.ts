// Inclinaison des cartes au gyroscope, partagée par toutes les cartes manipulables de la page.
//
// Sur téléphone, la carte suit l'inclinaison de l'appareil sans bouton à activer. Android envoie
// l'orientation d'emblée ; iOS la refuse tant qu'on ne l'a pas demandée pendant un geste : la
// demande part au premier toucher d'une carte (ou du bouton qui l'ouvre en grand), une seule fois.

type Permission = { requestPermission?: () => Promise<'granted' | 'denied'> };

const supported =
	typeof window !== 'undefined' && 'DeviceOrientationEvent' in window && navigator.maxTouchPoints > 0;

const needsPermission =
	supported && typeof (DeviceOrientationEvent as unknown as Permission).requestPermission === 'function';

export const gyro = $state({ on: supported && !needsPermission });

let asked = false;

/** À appeler dans un gestionnaire de toucher : demande l'accès au capteur sur iOS, sans effet ailleurs. */
export function requestGyro() {
	if (!needsPermission || gyro.on || asked) return;
	asked = true;
	(DeviceOrientationEvent as unknown as Permission)
		.requestPermission!()
		.then((answer) => (gyro.on = answer === 'granted'))
		.catch(() => (asked = false));
}
