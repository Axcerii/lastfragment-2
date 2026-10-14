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
                    <a class="player panel" href="/admin/fiches/{player.id}">
                        <img src={portrait(player.character?.image)} alt="" />
                        <span>
                            <strong>{player.character?.name}</strong>
                            <span class="muted">{player.login}</span>
                            <span>{formatMoney(player.money, true)} po</span>
                        </span>
                    </a>
                {/each}
            </div>
        {/if}
        <a class="btn btn-accent" href="/admin/argent">Distribuer de l'argent</a>
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
        gap: 0.75rem;
        padding: 0.6rem;
        transition: var(--transition);
    }

    .player img {
        width: 4rem;
        height: 4rem;
        object-fit: cover;
        object-position: top;
        border-radius: var(--radius);
        background-color: #101010;
    }

    .player > span {
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
