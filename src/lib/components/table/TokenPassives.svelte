<script lang="ts">
    import EffectsEditor from "$lib/components/admin/EffectsEditor.svelte";
    import Toggle from "$lib/components/ui/Toggle.svelte";
    import { describeEffect, passiveEffects } from "$lib/game/bonus";
    import type { TableClient } from "$lib/table/client.svelte";
    import type { PassiveView, TokenView } from "$lib/table/types";

    // Passifs du personnage d'un jeton. Le joueur active ou désactive les siens ; le MJ peut aussi
    // les modifier, en ajouter et en retirer. Les stats du jeton sont recalculées par le serveur.
    let {
        token,
        client,
        isAdmin,
    }: { token: TokenView; client: TableClient; isAdmin: boolean } = $props();

    let passives = $derived(token.passives ?? []);
    let canToggle = $derived(isAdmin || token.mine);

    /** Passif en cours d'édition : son id, ou "new" pour un ajout. */
    let editing = $state<number | "new" | null>(null);
    let busy = $state(false);

    // Changer de jeton referme l'édition en cours.
    let lastToken = token.id;
    $effect(() => {
        if (token.id !== lastToken) editing = null;
        lastToken = token.id;
    });

    async function toggle(passive: PassiveView, active: boolean) {
        busy = true;
        await client.act("passive.toggle", { tokenId: token.id, id: passive.id, active });
        busy = false;
    }

    async function save(e: SubmitEvent, passive: PassiveView | null) {
        e.preventDefault();
        const form = Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement));
        busy = true;
        const done = await client.act("passive.save", { tokenId: token.id, id: passive?.id ?? null, ...form });
        busy = false;
        if (done) editing = null;
    }

    async function remove(passive: PassiveView) {
        if (!confirm(`Supprimer le passif « ${passive.name || "sans nom"} » ?`)) return;
        busy = true;
        await client.act("passive.delete", { tokenId: token.id, id: passive.id });
        busy = false;
        editing = null;
    }
</script>

{#snippet editor(passive: PassiveView | null)}
    <form class="edit" onsubmit={(e) => save(e, passive)}>
        <label>
            <span>Nom</span>
            <input name="name" value={passive?.name ?? ""} required maxlength="255" />
        </label>
        <EffectsEditor
            compact
            statsName="statistics"
            valuesName="maths"
            inactiveName="inactiveMaths"
            stats={passive?.statistics ?? ""}
            values={passive?.maths ?? ""}
            inactive={passive?.inactiveMaths ?? ""}
            bareAs="mult"
        />
        <label>
            <span>Description</span>
            <textarea name="description" rows="2">{passive?.description ?? ""}</textarea>
        </label>
        <div class="row">
            <button class="btn btn-small btn-accent" disabled={busy}>Enregistrer</button>
            <button type="button" class="btn btn-small" onclick={() => (editing = null)}>Annuler</button>
            {#if passive}
                <button type="button" class="btn btn-small btn-danger" disabled={busy} onclick={() => remove(passive)}>
                    Supprimer
                </button>
            {/if}
        </div>
    </form>
{/snippet}

<section class="passives" aria-label="Passifs">
    <h4>Passifs</h4>

    {#if passives.length === 0 && editing !== "new"}
        <p class="muted small">Aucun passif.</p>
    {/if}

    <ul>
        {#each passives as passive (passive.id)}
            <li class:inactive={!passive.active}>
                {#if editing === passive.id}
                    {#key passive.id}
                        {@render editor(passive)}
                    {/key}
                {:else}
                    <div class="line">
                        <div class="text">
                            <p class="name">
                                {passive.name || "Passif sans nom"}
                                {#each passiveEffects(passive) as effect}
                                    <span class="effect">{describeEffect(effect)}</span>
                                {/each}
                            </p>
                            {#if passive.description}
                                <p class="description muted">{passive.description}</p>
                            {/if}
                        </div>
                        <div class="actions">
                            {#if canToggle}
                                <Toggle
                                    label={passive.active ? "Actif" : "Inactif"}
                                    checked={passive.active}
                                    disabled={busy}
                                    onchange={(active) => toggle(passive, active)}
                                />
                            {:else}
                                <span class="muted small">{passive.active ? "Actif" : "Inactif"}</span>
                            {/if}
                            {#if isAdmin}
                                <button
                                    class="btn btn-small"
                                    onclick={() => (editing = passive.id)}
                                    aria-label="Modifier le passif {passive.name}"
                                >
                                    Modifier
                                </button>
                            {/if}
                        </div>
                    </div>
                {/if}
            </li>
        {/each}
    </ul>

    {#if isAdmin}
        {#if editing === "new"}
            {@render editor(null)}
        {:else}
            <button class="btn btn-small add" onclick={() => (editing = "new")}>Ajouter un passif</button>
        {/if}
    {/if}
</section>

<style>
    .passives {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        border-top: 1px solid var(--border);
        padding-top: 0.75rem;
    }

    h4 {
        font-size: 1.05rem;
        color: var(--primary);
    }

    ul {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    li {
        padding-bottom: 0.4rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .line {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.4rem 0.75rem;
    }

    .text {
        flex: 1 1 10rem;
        min-width: 0;
    }

    li.inactive .text {
        opacity: 0.55;
    }

    .name {
        font-family: var(--titleFont);
        font-size: 1.05rem;
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.4rem;
    }

    .effect {
        font-family: var(--textFont);
        font-size: 0.75rem;
        color: var(--secondary);
    }

    .description {
        white-space: pre-line;
        font-size: 0.8rem;
    }

    .actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
    }

    .edit {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.5rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
    }

    .edit label {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        font-size: 0.75rem;
    }

    .edit input,
    .edit textarea {
        font-size: 15px;
        padding: 0.25rem 0.4rem;
    }

    .edit input {
        height: 30px;
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
    }

    .add {
        align-self: flex-start;
    }

    .small {
        font-size: 0.8rem;
    }
</style>
