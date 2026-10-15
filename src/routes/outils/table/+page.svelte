<script lang="ts">
    import { enhance } from "$app/forms";
    import { invalidateAll } from "$app/navigation";
    import { onMount } from "svelte";

    let { data } = $props();
    let isAdmin = $derived(data.user?.isAdmin ?? false);

    // La liste se rafraîchit seule : une partie ouverte par le MJ apparaît sans recharger.
    onMount(() => {
        const timer = setInterval(() => invalidateAll(), 15000);
        return () => clearInterval(timer);
    });

    const date = (iso: string) =>
        new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
</script>

<svelte:head>
    <title>Table de jeu : Last Fragment</title>
</svelte:head>

<main>
    <a class="muted" href="/outils">← Outils</a>
    <h1>Table de jeu</h1>
    <p class="muted intro">
        Plateau partagé, jets de dés, combats, musique : les parties se jouent ici, en direct.
        {#if !isAdmin}Rejoins la partie ouverte par le MJ, ton jeton t'y attend.{/if}
    </p>

    {#if isAdmin}
        <form class="create panel" method="POST" action="?/create" use:enhance>
            <label>
                Nouvelle partie
                <input name="name" placeholder="Arc 3 — La forêt d'Edenia" maxlength="255" />
            </label>
            <button class="btn btn-accent" type="submit">Créer et préparer</button>
        </form>
    {/if}

    {#if !data.loggedIn}
        <div class="panel">
            <p>Connecte-toi pour voir les parties en cours.</p>
            <a class="btn" href="/auth/login">Connexion</a>
        </div>
    {:else if !data.canJoin}
        <div class="panel">
            <p>Ton compte n'est pas encore associé à un personnage. Demande au MJ de le faire pour rejoindre une partie.</p>
        </div>
    {:else}
        <ul class="sessions">
            {#each data.sessions as session (session.id)}
                <li class="panel" class:open={session.open}>
                    <div class="info">
                        <strong>{session.name}</strong>
                        <span class="muted">
                            {session.open ? "Ouverte" : "Fermée"} · créée le {date(session.createdAt)}
                            {#if isAdmin}· {session.scenes} scène{session.scenes > 1 ? "s" : ""}{/if}
                        </span>
                        {#if session.players.length}
                            <span class="players">En ligne : {session.players.join(", ")}</span>
                        {/if}
                    </div>
                    <div class="buttons">
                        <a class="btn btn-accent" href="/outils/table/{session.id}">
                            {isAdmin ? "Mener" : "Rejoindre"}
                        </a>
                        {#if isAdmin}
                            <form method="POST" action="?/toggle" use:enhance>
                                <input type="hidden" name="id" value={session.id} />
                                <button class="btn btn-players" type="submit">{session.open ? "Fermer aux joueurs" : "Ouvrir aux joueurs"}</button>
                            </form>
                            <form
                                method="POST"
                                action="?/delete"
                                use:enhance={({ cancel }) => {
                                    if (!confirm(`Supprimer « ${session.name} », ses scènes et son journal ?`)) cancel();
                                }}
                            >
                                <input type="hidden" name="id" value={session.id} />
                                <button class="btn btn-danger" type="submit">Supprimer</button>
                            </form>
                        {/if}
                    </div>
                </li>
            {:else}
                <li class="muted">
                    {isAdmin ? "Aucune partie. Crée la première ci-dessus." : "Aucune partie ouverte pour le moment."}
                </li>
            {/each}
        </ul>
    {/if}
</main>

<style>
    main {
        width: min(60rem, 92%);
        margin: 0 auto;
        padding: 3rem 0;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    h1 {
        font-size: 2.6rem;
    }

    .intro {
        max-width: 40rem;
    }

    .create {
        display: flex;
        align-items: flex-end;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .create label {
        flex: 1;
        min-width: 16rem;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }

    .sessions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .sessions li.panel {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
    }

    li.open {
        border-color: var(--primary);
    }

    .info {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    strong {
        font-family: var(--titleFont);
        font-size: 1.5rem;
    }

    .players {
        color: var(--primary);
        font-size: 0.9rem;
    }

    .buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
</style>
