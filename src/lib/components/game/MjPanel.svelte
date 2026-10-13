<script lang="ts">
    import { enhance } from "$app/forms";
    import StatsEditor from "./StatsEditor.svelte";
    import StatsPanel from "./StatsPanel.svelte";
    import Toggle from "$lib/components/ui/Toggle.svelte";
    import { computeSheet } from "$lib/game/bonus";
    import type { StatBlock } from "$lib/game/stats";

    // Encart réservé au MJ sur une fiche : stats, réglages rapides et lien vers l'édition complète.
    let {
        stats,
        flags,
        quote,
        editHref,
        message,
    }: {
        stats: StatBlock;
        flags: { name: string; label: string; checked: boolean }[];
        /** Citation affichée à la place d'une fiche censurée ; `undefined` si sans objet. */
        quote?: string | null;
        editHref: string;
        message?: string;
    } = $props();

    let editing = $state(false);
</script>

<section class="panel mj">
    <header>
        <h2>Vue MJ</h2>
        <a class="btn btn-small" href={editHref}>Édition complète</a>
    </header>

    <StatsPanel sheet={computeSheet(stats)} />

    <button class="btn btn-small" onclick={() => (editing = !editing)}>
        {editing ? "Fermer l'édition des stats" : "Modifier les stats"}
    </button>

    {#if editing}
        <form
            method="POST"
            action="?/stats"
            use:enhance={() =>
                async ({ update }) => {
                    await update({ reset: false });
                    editing = false;
                }}
        >
            <StatsEditor {stats} />
            <button class="btn btn-accent">Enregistrer les stats</button>
        </form>
    {/if}

    <form method="POST" action="?/flags" use:enhance={() => ({ update }) => update({ reset: false })}>
        <div class="flags">
            {#each flags as flag (flag.name)}
                <Toggle name={flag.name} label={flag.label} checked={flag.checked} />
            {/each}
        </div>
        {#if quote !== undefined}
            <label>
                Citation affichée quand la fiche est censurée
                <input type="text" name="quote" value={quote ?? ""} maxlength="400" />
            </label>
        {/if}
        <button class="btn btn-accent">Enregistrer les réglages</button>
    </form>

    {#if message}
        <p class="message-success" role="status">{message}</p>
    {/if}
</section>

<style>
    .mj {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        width: 65%;
        margin: 0 auto 3rem auto;
        box-sizing: border-box;
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    h2 {
        font-size: 1.5rem;
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
    }

    .flags {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem 2rem;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        width: 100%;
    }

    @media (max-width: 600px) {
        .mj {
            width: 92%;
        }
    }
</style>
