export const load = async ({ fetch, params }) => {
    const res = await fetch(`/api/characters/details/${params.id}`);
    const character = await res.json();

    return { character };
};