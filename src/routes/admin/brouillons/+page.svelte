<script lang="ts">
    import { enhance } from "$app/forms";
    import StatsPanel from "$lib/components/game/StatsPanel.svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import { computeSheet } from "$lib/game/bonus";
    import { portrait } from "$lib/game/labels";
    import { totalPower } from "$lib/game/stats";

    let { data, form } = $props();

    const KIND_LABELS = { personnage: "Personnage", monstre: "Monstre" };
    const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });

    let rejecting = $state<(typeof data.drafts)[number] | null>(null);
    let confirmOpen = $state(false);
</script>

<svelte:head>
    <title>Brouillons : Espace MJ</title>
</svelte:head>

<main>
    <a class="muted back" href="/admin">← Espace MJ</a>
    <h1>Brouillons proposés</h1>
    <p class="muted">
        Personnages et monstres envoyés depuis le créateur. Valider ouvre le formulaire complet,
        prérempli, pour ajouter ce qui manque avant de l'enregistrer.
    </p>

    {#if form?.message}
        <p class="message-success" role="status">{form.message}</p>
    {/if}

    {#if data.drafts.length === 0}
        <p class="empty">Aucune proposition en attente.</p>
    {:else}
        <div class="drafts">
            {#each data.drafts as draft (draft.id)}
                <article class="panel">
                    <header>
                        <img src={portrait(draft.image)} alt="" />
                        <div>
                            <span class="kind">{KIND_LABELS[draft.kind] ?? draft.kind}</span>
                            <h2>{draft.name}</h2>
                            <p class="muted">
                                {draft.author ?? "Anonyme"} · {dateFormat.format(new Date(draft.createdAt))}
                            </p>
                            <p>Puissance totale : <strong>{totalPower(draft.stats)}</strong></p>
                        </div>
                    </header>

                    {#if draft.description}
                        <p class="description">{draft.description}</p>
                    {:else}
                        <p class="muted">Pas de description.</p>
                    {/if}

                    <details>
                        <summary>Voir les stats</summary>
                        <StatsPanel sheet={computeSheet(draft.stats)} compact />
                    </details>

                    <div class="actions">
                        <a class="btn btn-accent" href="/admin/brouillons/{draft.id}">Valider…</a>
                        <button
                            class="btn btn-danger"
                            onclick={() => {
                                rejecting = draft;
                                confirmOpen = true;
                            }}
                        >
                            Refuser
                        </button>
                    </div>
                </article>
            {/each}
        </div>
    {/if}
</main>

<Modal bind:open={confirmOpen} title="Refuser « {rejecting?.name} » ?">
    <p>Le brouillon et son image seront supprimés définitivement.</p>
    <form
        method="POST"
        action="?/reject"
        class="confirm"
        use:enhance={() =>
            async ({ update }) => {
                confirmOpen = false;
                await update();
            }}
    >
        <input type="hidden" name="id" value={rejecting?.id} />
        <button type="button" class="btn" onclick={() => (confirmOpen = false)}>Annuler</button>
        <button class="btn btn-danger">Refuser et supprimer</button>
    </form>
</Modal>

<style>
    main {
        width: min(70rem, 94%);
        margin: 0 auto;
        padding: 2rem 0 4rem;
    }

    .back {
        font-size: 0.9rem;
    }

    h1 {
        font-size: 2.2rem;
        margin-bottom: 0.5rem;
    }

    .empty {
        margin-top: 3rem;
        text-align: center;
    }

    .drafts {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(26rem, 1fr));
        gap: 1rem;
        margin-top: 1.5rem;
    }

    article {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    header {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    header img {
        width: 6rem;
        height: 6rem;
        flex-shrink: 0;
        object-fit: cover;
        object-position: top;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background-color: #101010;
    }

    .kind {
        font-size: 0.8rem;
        padding: 0.1rem 0.5rem;
        border-radius: var(--radius);
        background-color: var(--accent);
        color: var(--background);
    }

    h2 {
        font-size: 1.5rem;
        margin-top: 0.25rem;
    }

    .description {
        white-space: pre-line;
        max-height: 12rem;
        overflow-y: auto;
    }

    summary {
        cursor: pointer;
        color: var(--primary);
        margin-bottom: 0.75rem;
    }

    .actions,
    .confirm {
        display: flex;
        gap: 0.75rem;
    }

    .actions {
        margin-top: auto;
    }

    .confirm {
        justify-content: flex-end;
    }

    @media (max-width: 600px) {
        .drafts {
            grid-template-columns: 1fr;
        }
    }
</style>
