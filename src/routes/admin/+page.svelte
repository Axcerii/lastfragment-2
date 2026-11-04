<script lang="ts">
    import { enhance } from "$app/forms";
    import Toggle from "$lib/components/ui/Toggle.svelte";
    import { portrait } from "$lib/game/labels";
    import { CONTAINER_KEYS, CONTAINERS, formatMoney } from "$lib/game/inventory";

    let { data, form } = $props();
</script>

<svelte:head>
    <title>Espace MJ : Last Fragment</title>
</svelte:head>

<main>
    <h1>Espace MJ</h1>

    <a class="drafts panel" class:waiting={data.drafts > 0} href="/admin/brouillons">
        <strong>Brouillons proposés</strong>
        <span>
            {data.drafts === 0
                ? "Aucune proposition en attente."
                : `${data.drafts} personnage${data.drafts > 1 ? "s ou monstres" : " ou monstre"} à examiner.`}
        </span>
    </a>

    <section class="panel cards" class:live={data.cardsPublic}>
        <a href="/admin/cartes">
            <strong>Cartes à collectionner</strong>
            <span class="muted">Créateur de cartes, séries et paquets, réglages des boosters.</span>
        </a>
        <form method="POST" action="?/cards" use:enhance={() => ({ update }) => update({ reset: false })}>
            <input type="hidden" name="public" value={data.cardsPublic ? "false" : "true"} />
            <span class="state">
                {data.cardsPublic ? "Public : visible de tous les joueurs" : "Caché : toi seul le vois"}
            </span>
            <button class={data.cardsPublic ? "btn btn-danger" : "btn btn-accent"}>
                {data.cardsPublic ? "Cacher le jeu" : "Rendre public"}
            </button>
            {#if form?.cardsMessage}<span class="message-success" role="status">{form.cardsMessage}</span>{/if}
        </form>
    </section>

    <section>
        <h2>Joueurs</h2>
        {#if data.players.length === 0}
            <p class="muted">
                Aucun compte n'est encore associé à un personnage. Cela se règle dans
                <a href="/admin/joueurs">Joueurs</a>.
            </p>
        {:else}
            <div class="players">
                {#each data.players as player (player.id)}
                    <div class="player panel">
                        <a class="sheet" href="/admin/fiches/{player.id}">
                            <img src={portrait(player.character?.image)} alt="" />
                            <span>
                                <strong>{player.character?.name}</strong>
                                <span class="muted">{player.login}</span>
                                <span>{formatMoney(player.money, true)} po</span>
                            </span>
                        </a>
                        <a class="player-cards" href="/admin/cartes/joueurs/{player.id}" title="Boosters et cartes de {player.character?.name}">Cartes</a>
                    </div>
                {/each}
            </div>
        {/if}
        <div class="links">
            <a class="btn btn-accent" href="/admin/argent">Distribuer de l'argent</a>
            <a class="btn" href="/admin/cartes/joueurs">Boosters et cartes par joueur</a>
        </div>
    </section>

    <section class="panel">
        <h2>Conteneurs accessibles aux joueurs</h2>
        <p class="muted">
            Un conteneur fermé reste visible, mais les joueurs ne peuvent plus y déposer ni y
            prendre d'objets.
        </p>
        <form method="POST" action="?/access" use:enhance={() => ({ update }) => update({ reset: false })}>
            <div class="toggles">
                {#each CONTAINER_KEYS as key (key)}
                    <Toggle name={key} label={CONTAINERS[key].label} checked={data.access[key]} />
                {/each}
            </div>
            <button class="btn">Enregistrer</button>
            {#if form?.message}
                <span class="message-success" role="status">{form.message}</span>
            {/if}
        </form>
    </section>

    <section>
        <h2>Données</h2>
        <div class="resources">
            {#each data.resources as resource (resource.slug)}
                <a class="resource panel" href="/admin/{resource.slug}">
                    <span class="count">{resource.count}</span>
                    <strong>{resource.label}</strong>
                    <span class="muted">{resource.description}</span>
                </a>
            {/each}
        </div>
    </section>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        gap: 2.5rem;
        width: min(80rem, 94%);
        margin: 0 auto;
        padding: 2rem 0 4rem;
    }

    h1 {
        font-size: 2.4rem;
    }

    h2 {
        font-size: 1.6rem;
        margin-bottom: 0.75rem;
    }

    section {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
    }

    .muted a {
        text-decoration: underline;
    }

    .players,
    .resources {
        display: grid;
        gap: 1rem;
        width: 100%;
    }

    .players {
        grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    }

    .resources {
        grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
    }

    .player {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem;
        transition: var(--transition);
    }

    .player .sheet {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: var(--foreground);
    }

    .player-cards {
        align-self: flex-start;
        padding: 0.15rem 0.6rem;
        border: 1px solid var(--border);
        border-radius: 999px;
        color: var(--primary);
        font-size: 0.75rem;
        transition: var(--transition);
    }

    .player-cards:hover {
        border-color: var(--accent);
        background: color-mix(in srgb, var(--accent) 15%, transparent);
    }

    .links {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .player img {
        width: 4rem;
        height: 4rem;
        object-fit: cover;
        object-position: top;
        border-radius: var(--radius);
        background-color: #101010;
    }

    .player .sheet > span {
        display: flex;
        flex-direction: column;
        font-size: 0.9rem;
    }

    .player strong {
        font-family: var(--titleFont);
        font-size: 1.2rem;
    }

    .resource {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        transition: var(--transition);
    }

    .resource strong {
        font-family: var(--titleFont);
        font-size: 1.3rem;
        padding-right: 3rem;
    }

    .resource .muted {
        font-size: 0.9rem;
    }

    .count {
        position: absolute;
        top: 1rem;
        right: 1rem;
        color: var(--primary);
        font-variant-numeric: tabular-nums;
    }

    .drafts {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.5rem 1rem;
        transition: var(--transition);
    }

    .cards {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1.5rem;
        border-left: 4px solid var(--muted);
    }

    .cards.live {
        border-left-color: var(--primary);
    }

    .cards a {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        color: var(--foreground);
    }

    .cards a strong {
        font-family: var(--titleFont);
        font-size: 1.4rem;
    }

    .cards form {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
    }

    .cards .state {
        font-size: 0.85rem;
    }

    .drafts strong {
        font-family: var(--titleFont);
        font-size: 1.3rem;
    }

    .drafts.waiting {
        border-color: var(--accent);
        background-color: rgba(229, 184, 204, 0.1);
    }

    .drafts:hover,
    .player:hover,
    .resource:hover {
        border-color: var(--accent);
        transform: translateY(-2px);
    }

    form {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1rem 2rem;
    }

    .toggles {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem 2rem;
    }
</style>
