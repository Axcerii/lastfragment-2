<script lang="ts">
    // Paquets d'une série (ou du booster All) : plusieurs illustrations pour le même contenu, au
    // choix du joueur. Sans paquet, la série en montre un par défaut (sa bannière, sa couleur).
    import { enhance } from "$app/forms";
    import type { PackView } from "$lib/cards/types";
    import PackModel from "../opening/PackModel.svelte";
    import ImageInput from "./ImageInput.svelte";

    type Row = { id: number; name: string; color: string; image: string | null; showText: boolean; sortOrder: number };

    let {
        target,
        title,
        code,
        packs,
        color,
    }: {
        /** Id de la série, ou « all » pour le booster All. */
        target: number | "all";
        title: string;
        code: string;
        packs: Row[];
        /** Couleur proposée pour un nouveau paquet. */
        color: string;
    } = $props();

    // Brouillons modifiables, pour l'aperçu en direct ; repris des données après chaque envoi.
    let drafts = $state<Row[]>([]);
    $effect(() => {
        drafts = [...packs.map((p) => ({ ...p })), { id: 0, name: "", color, image: null, showText: false, sortOrder: packs.length }];
    });

    const view = (row: Row): PackView => ({ id: row.id || null, name: row.name || title, color: row.color, image: row.image, showText: row.showText });
    const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });
</script>

<div class="packs">
    <h3>Paquets <small class="muted">{packs.length ? `${packs.length} au choix, même contenu` : "aucun : paquet par défaut"}</small></h3>
    <div class="list">
        {#each drafts as row (row.id)}
            <form class="pack" method="POST" action="?/pack" use:enhance={keep}>
                <input type="hidden" name="id" value={row.id || ""} />
                <input type="hidden" name="setId" value={target} />
                <span class="preview">
                    <PackModel pack={view(row)} {title} {code} width="4.6rem" idle={false} angle={-20} />
                </span>
                <span class="fields">
                    <input name="name" bind:value={row.name} maxlength="60" placeholder={row.id ? "" : "Nouveau paquet"} required aria-label="Nom du paquet" />
                    <span class="row">
                        <input type="color" name="color" bind:value={row.color} aria-label="Couleur" />
                        <input type="number" name="sortOrder" bind:value={row.sortOrder} min="0" max="9999" aria-label="Ordre" title="Ordre" />
                    </span>
                    <ImageInput name="image" bind:value={row.image} label="Face avant" />
                    <label class="check">
                        <input type="checkbox" name="showText" bind:checked={row.showText} />
                        Afficher les textes du site
                    </label>
                    <span class="row">
                        <button class="btn btn-small btn-accent">{row.id ? "Enregistrer" : "Ajouter"}</button>
                        {#if row.id}
                            <button class="btn btn-small btn-danger" formaction="?/deletePack" formnovalidate>Supprimer</button>
                        {/if}
                    </span>
                </span>
            </form>
        {/each}
    </div>
</div>

<style>
    .packs {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        padding-top: 0.75rem;
        border-top: 1px dashed var(--border);
    }

    h3 {
        font-size: 1rem;
    }

    small {
        font-size: 0.75rem;
    }

    .list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr));
        gap: 0.75rem;
    }

    .pack {
        display: flex;
        gap: 0.9rem;
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
    }

    .preview {
        flex-shrink: 0;
        padding: 0.3rem 0.4rem 0.8rem;
    }

    .fields {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .fields input:not([type="color"]) {
        height: 36px;
        font-size: 15px;
    }

    .check {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.8rem;
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        align-items: center;
    }

    .row input[type="color"] {
        flex: 0 0 44px;
        width: 44px;
        height: 34px;
        padding: 0;
    }

    .row input[type="number"] {
        flex: 0 0 5rem;
        width: 5rem;
        padding: 0 0.5rem;
    }
</style>
