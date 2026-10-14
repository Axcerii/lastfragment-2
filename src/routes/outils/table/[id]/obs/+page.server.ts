import { tableViewer } from '$lib/server/table/access';
import type { PageServerLoad } from './$types';

// Vue à capturer dans OBS : plateau et journal tels que les joueurs les voient, sans interface.
export const load: PageServerLoad = async ({ params, url }) => {
	const key = url.searchParams.get('key') || 'absente';
	await tableViewer(Number(params.id), null, key);
	return {
		sessionId: Number(params.id),
		key,
		board: url.searchParams.get('plateau') !== '0',
		log: url.searchParams.get('journal') !== '0'
	};
};
