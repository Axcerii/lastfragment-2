<script lang="ts">
    // Classement des collectionneurs au nombre de cartes possédées : podium pour les trois premiers,
    // puis la liste. Toucher un joueur ouvre sa collection.
    import { matches } from "$lib/components/table/MediaPicker.svelte";
    import { portrait } from "$lib/game/labels";

    let { data } = $props();
    let query = $state("");

    let ranked = $derived(data.players.filter((p) => p.cards > 0));
    let podium = $derived(query ? [] : ranked.slice(0, 3));
    let rest = $derived(
        data.players.filter((p) => matches(`${p.name} ${p.character ?? ""}`, query)).slice(podium.length),
    );
    let me = $derived(data.players.find((p) => p.id === data.me));

    const href = (id: number) => (id === data.me ? "/cartes/collection" : `/cartes/joueurs/${id}`);
    const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;
    // Le podium se lit 2 · 1 · 3, le premier au centre.
    const PODIUM_ORDER = [1, 0, 2];
</script>

<svelte:head>
    <title>Collectionneurs : Last Fragment</title>
</svelte:head>

<main>
    <header>
        <h1>Collectionneurs</h1>
        {#if me}
            <a class="mine panel" href="/cartes/collection">
                <span class="muted">Ta place</span>
                <strong>{me.cards > 0 ? `#${me.rank}` : "—"}</strong>
                <span class="muted">{plural(me.cards, "carte")}</span>
            </a>
        {/if}
    </header>

    {#if podium.length}
        <ol class="podium" aria-label="Podium">
            {#each PODIUM_ORDER.filter((i) => i < podium.length) as i (podium[i].id)}
                {@const p = podium[i]}
                <li class="step step-{i + 1}" class:me={p.id === data.me}>
                    <a href={href(p.id)}>
                        <span class="crown" aria-hidden="true">{i === 0 ? "♛" : ""}</span>
                        <img src={portrait(p.portrait)} alt="" loading="lazy" />
                        <strong class="name">{p.name}</strong>
                        <span class="total">{p.cards}</span>
                        <span class="muted small">{plural(p.distinct, "différente")}</span>
                        <span class="block" aria-label="Rang {p.rank}">{p.rank}</span>
                    </a>
                </li>
            {/each}
        </ol>
    {/if}

    <input type="search" placeholder="Chercher un collectionneur…" bind:value={query} aria-label="Chercher un collectionneur" />

    <ol class="list" aria-label="Classement">
        {#each rest as player (player.id)}
            <li class="row panel" class:me={player.id === data.me}>
                <a class="who" href={href(player.id)}>
                    <span class="rank">{player.cards > 0 ? player.rank : "—"}</span>
                    <img src={portrait(player.portrait)} alt="" loading="lazy" />
                    <span class="text">
                        <strong>{player.name}{player.id === data.me ? " (toi)" : ""}</strong>
                        <span class="muted small">{plural(player.distinct, "différente")}</span>
                    </span>
                    <span class="count"><strong>{player.cards}</strong><span class="muted small">carte{player.cards > 1 ? "s" : ""}</span></span>
                </a>
                {#if player.id !== data.me}
                    <a class="trade" href="/cartes/echanges/nouveau?avec={player.id}" aria-label="Échanger avec {player.name}" title="Échanger">⇄</a>
                {/if}
            </li>
        {:else}
            {#if !podium.length}<p class="muted">Personne ne correspond.</p>{/if}
        {/each}
    </ol>
</main>

<style>
    main {
        width: min(800px, 94%);
        margin: 0 auto;
        padding: 1.5rem 0 3rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    h1 {
        font-size: 2.2rem;
    }

    .mine {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0.4rem 1rem;
        border-color: color-mix(in srgb, var(--accent) 50%, transparent);
        color: var(--foreground);
        line-height: 1.15;
    }

    .mine strong {
        font-family: var(--titleFont);
        font-size: 1.6rem;
        color: var(--accent);
    }

    .small,
    .mine .muted {
        font-size: 0.75rem;
    }

    /* ─── Podium ─── */
    .podium {
        list-style: none;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        align-items: end;
        gap: 0.5rem;
    }

    .step a {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.15rem;
        color: var(--foreground);
        text-align: center;
        --c: var(--rarity-3);
    }

    .step-1 a {
        --c: var(--Pura);
    }

    .step-2 a {
        --c: #cfd4dc;
    }

    .step-3 a {
        --c: #c08a5a;
    }

    .crown {
        height: 1.4rem;
        font-size: 1.4rem;
        line-height: 1;
        color: var(--c);
        filter: drop-shadow(0 0 6px var(--c));
    }

    .step img {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        object-fit: cover;
        object-position: top;
        background: #2a2a2a;
        border: 3px solid var(--c);
        box-shadow: 0 0 1rem color-mix(in srgb, var(--c) 45%, transparent);
        transition: transform 0.3s ease;
    }

    .step-1 img {
        width: 84px;
        height: 84px;
    }

    .step a:hover img {
        transform: translateY(-4px) scale(1.04);
    }

    .name {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.95rem;
    }

    .total {
        font-family: var(--titleFont);
        font-size: 1.6rem;
        line-height: 1;
        color: var(--c);
    }

    .block {
        width: 100%;
        margin-top: 0.4rem;
        display: grid;
        place-items: center;
        border-radius: var(--radius) var(--radius) 0 0;
        background: linear-gradient(to bottom, color-mix(in srgb, var(--c) 40%, var(--surface)), var(--surface));
        border-top: 2px solid var(--c);
        font-family: var(--titleFont);
        font-size: 1.8rem;
        color: var(--c);
        height: 3rem;
    }

    .step-1 .block {
        height: 4.5rem;
    }

    .step-3 .block {
        height: 2.2rem;
    }

    .step.me .name {
        color: var(--accent);
    }

    /* ─── Liste ─── */
    input {
        height: 42px;
        font-size: 17px;
    }

    .list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0;
        transition: var(--transition);
    }

    .row:hover {
        border-color: var(--accent);
    }

    .row.me {
        border-color: var(--accent);
        background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 14%, transparent), var(--surface) 60%);
    }

    .who {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.6rem 0.9rem;
        color: var(--foreground);
    }

    .rank {
        width: 2rem;
        flex-shrink: 0;
        text-align: center;
        font-family: var(--titleFont);
        font-size: 1.3rem;
        color: var(--muted);
        font-variant-numeric: tabular-nums;
    }

    .who img {
        width: 44px;
        height: 44px;
        object-fit: cover;
        object-position: top;
        border-radius: 50%;
        background: #2a2a2a;
        flex-shrink: 0;
    }

    .text {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
    }

    .text strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .count {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        line-height: 1.1;
    }

    .count strong {
        font-size: 1.3rem;
        font-variant-numeric: tabular-nums;
    }

    .trade {
        align-self: stretch;
        display: grid;
        place-items: center;
        width: 3rem;
        border-left: 1px solid var(--border);
        color: var(--accent);
        font-size: 1.3rem;
        transition: var(--transition);
    }

    .trade:hover {
        background: color-mix(in srgb, var(--accent) 15%, transparent);
    }

    @media (max-width: 420px) {
        h1 {
            font-size: 1.8rem;
        }

        .step img {
            width: 52px;
            height: 52px;
        }

        .step-1 img {
            width: 68px;
            height: 68px;
        }
    }
</style>
