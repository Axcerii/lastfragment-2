<script lang="ts">
    // Tous les comptes qui peuvent collectionner, avec leur réserve et leur collection en bref.
    import { portrait } from "$lib/game/labels";

    let { data } = $props();
    let query = $state("");

    const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    let shown = $derived(
        query ? data.players.filter((p) => normalize(`${p.name ?? ""} ${p.login}`).includes(normalize(query))) : data.players,
    );
</script>

<svelte:head>
    <title>Cartes par joueur : Espace MJ</title>
</svelte:head>

<main>
    <a class="back" href="/admin">← Espace MJ</a>
    <header>
        <h1>Cartes par joueur</h1>
        <input type="search" placeholder="Chercher un joueur…" bind:value={query} aria-label="Chercher un joueur" />
    </header>

    <ul class="list">
        {#each shown as p (p.id)}
            <li>
                <a class="panel row" href="/admin/cartes/joueurs/{p.id}">
                    <img src={portrait(p.portrait)} alt="" />
                    <span class="who">
                        <strong>{p.name ?? p.login}</strong>
                        <span class="muted">{p.name ? p.login : "Sans personnage"}</span>
                    </span>
                    <span class="stat" title="Boosters en réserve">
                        <b class:full={p.stock !== null && p.stock >= data.max}>{p.stock ?? "—"}</b>
                        <small>réserve</small>
                    </span>
                    <span class="stat"><b>{p.opened}</b><small>ouverts</small></span>
                    <span class="stat"><b>{p.cards}</b><small>cartes</small></span>
                    <span class="stat"><b>{p.distinct}</b><small>différentes</small></span>
                    {#if p.unseen}<span class="badge" title="Boosters ouverts mais pas regardés">{p.unseen} pas vu{p.unseen > 1 ? "s" : ""}</span>{/if}
                </a>
            </li>
        {:else}
            <li class="muted">Aucun joueur ne correspond.</li>
        {/each}
    </ul>
</main>

<style>
    main {
        width: min(960px, 94%);
        margin: 0 auto;
        padding: 1.5rem 0 4rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .back {
        color: var(--primary);
        font-size: 0.9rem;
    }

    header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
    }

    h1 {
        font-size: 2.2rem;
    }

    input[type="search"] {
        height: 40px;
        font-size: 16px;
        min-width: min(18rem, 100%);
    }

    .list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0;
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem 1.25rem;
        padding: 0.6rem 0.9rem;
        color: var(--foreground);
        transition: var(--transition);
    }

    .row:hover {
        border-color: var(--accent);
    }

    img {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        object-fit: cover;
        object-position: top;
        background: #2a2a2a;
    }

    .who {
        flex: 1;
        min-width: 10rem;
        display: flex;
        flex-direction: column;
    }

    .who strong {
        font-family: var(--titleFont);
        font-size: 1.2rem;
    }

    .who .muted {
        font-size: 0.8rem;
    }

    .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 3.5rem;
        font-variant-numeric: tabular-nums;
    }

    .stat b {
        font-size: 1.15rem;
    }

    .stat b.full {
        color: var(--primary);
    }

    .stat small {
        font-size: 0.7rem;
        color: var(--muted);
    }

    .badge {
        padding: 0.1rem 0.55rem;
        border-radius: 999px;
        background: var(--accent);
        color: var(--background);
        font-size: 0.75rem;
        font-weight: 700;
    }
</style>
