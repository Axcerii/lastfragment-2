import type { PageLoad } from './$types';

export const load: PageLoad = async ({ data, fetch }) => {
    if (data.characterId) {
        try {
            const response = await fetch(`/api/characters/details/${data.characterId}`);
            if (response.ok) {
                const character = await response.json();
                return {
                    ...data,
                    character
                };
            } else {
                console.error('Failed to fetch character details:', await response.text());
            }
        } catch (err) {
            console.error('Error fetching character details:', err);
        }
    }
    return data;
};