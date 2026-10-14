<script lang="ts">
    import type { TableClient } from "$lib/table/client.svelte";
    import type { Asset, SceneView } from "$lib/table/types";
    import type { FogTool } from "./Board.svelte";

    let {
        client,
        scenes,
        activeId,
        viewId = $bindable(),
        assets,
        fogTool = $bindable(),
        fogBrush = $bindable(),
    }: {
        client: TableClient;
        scenes: SceneView[];
        /** Scène montrée aux joueurs. */
        activeId: number | null;
        /** Scène affichée sur l'écran du MJ (préparation). */
        viewId: number | null;
        assets: Asset[];
        fogTool: FogTool;
        fogBrush: number;
    } = $props();

    let scene = $derived(scenes.find((s) => s.id === viewId) ?? null);
    let backgrounds = $derived(assets.filter((a) => a.kind === "fond"));
    let musics = $derived(assets.filter((a) => a.kind === "musique"));

    const update = (fields: Record<string, unknown>) =>
        scene && client.act("scene.update", { id: scene.id, ...fields });

    async function create() {
        const result = await client.act<{ id: number }>("scene.create", {});
        if (result) viewId = result.id;
    }

    async function remove() {
        if (!scene || !confirm(`Supprimer la scène « ${scene.name} » et ses jetons (hors joueurs) ?`)) return;
        await client.act("scene.delete", { id: scene.id });
        viewId = activeId;
    }

    /** Garde les proportions de l'image de fond : nombre de lignes déduit des colonnes. */
    function fitToBackground() {
        if (!scene?.background) return;
        const img = new Image();
        img.onload = () => {
            const rows = Math.max(4, Math.round((scene!.cols * img.naturalHeight) / img.naturalWidth));
            update({ rows });
        };
        img.src = scene.background;
    }

    function setMusic(url: string) {
        const asset = musics.find((m) => m.url === url);
        update({ musicUrl: url || null, musicName: asset?.name ?? null });
    }
</script>

<div class="panel-body">
    <section>
        <h3>Scènes</h3>
        <ul>
            {#each scenes as s (s.id)}
                <li class:viewing={s.id === viewId}>
                    <button class="name" onclick={() => (viewId = s.id)}>
                        {s.name}
                        {#if s.id === activeId}<span class="live">montrée</span>{/if}
                    </button>
                    {#if s.id !== activeId}
                        <button class="btn btn-small btn-accent" onclick={() => client.act("scene.activate", { id: s.id })}>
                            Montrer
                        </button>
                    {/if}
                </li>
            {/each}
        </ul>
        <button class="btn btn-small" onclick={create}>Nouvelle scène</button>
    </section>

    {#if scene}
        <section>
            <h3>Réglages de « {scene.name} »</h3>
            <label>
                Nom
                <input value={scene.name} maxlength="255" onchange={(e) => update({ name: e.currentTarget.value })} />
            </label>
            <label>
                Fond
                <select value={scene.background ?? ""} onchange={(e) => update({ background: e.currentTarget.value || null })}>
                    <option value="">Aucun</option>
                    {#each backgrounds as asset (asset.id)}
                        <option value={asset.url}>{asset.name}</option>
                    {/each}
                </select>
            </label>
            {#if backgrounds.length === 0}
                <p class="muted small">Envoie des fonds (cartes, décors) dans l'onglet Médias.</p>
            {/if}
            <div class="grid2">
                <label>
                    Colonnes
                    <input type="number" min="4" max="120" value={scene.cols} onchange={(e) => update({ cols: Number(e.currentTarget.value) })} />
                </label>
                <label>
                    Lignes
                    <input type="number" min="4" max="120" value={scene.rows} onchange={(e) => update({ rows: Number(e.currentTarget.value) })} />
                </label>
            </div>
            <div class="row">
                <button class="btn btn-small" disabled={!scene.background} onclick={fitToBackground}>
                    Lignes selon le fond
                </button>
                <label class="check">
                    <input type="checkbox" checked={scene.gridVisible} onchange={(e) => update({ gridVisible: e.currentTarget.checked })} />
                    Grille visible
                </label>
            </div>
            <p class="muted small">Changer les dimensions recouvre toute la scène de brouillard.</p>
            <label>
                Musique jouée à l'ouverture
                <select value={scene.musicUrl ?? ""} onchange={(e) => setMusic(e.currentTarget.value)}>
                    <option value="">Aucune (garder la musique en cours)</option>
                    {#each musics as asset (asset.id)}
                        <option value={asset.url}>{asset.name}</option>
                    {/each}
                </select>
            </label>
        </section>

        <section>
            <h3>Brouillard de guerre</h3>
            <label class="check">
                <input
                    type="checkbox"
                    checked={scene.fogEnabled}
                    onchange={(e) => {
                        update({ fogEnabled: e.currentTarget.checked });
                        if (!e.currentTarget.checked) fogTool = null;
                    }}
                />
                Activer le brouillard
            </label>
            {#if scene.fogEnabled}
                <p class="muted small">
                    Choisis un pinceau puis glisse sur le plateau. Les joueurs ne voient ni le décor ni les
                    jetons sous le brouillard (sauf les leurs).
                </p>
                <div class="chips" role="radiogroup" aria-label="Pinceau">
                    <button class="chip" class:on={fogTool === "reveal"} onclick={() => (fogTool = fogTool === "reveal" ? null : "reveal")}>
                        Révéler
                    </button>
                    <button class="chip" class:on={fogTool === "hide"} onclick={() => (fogTool = fogTool === "hide" ? null : "hide")}>
                        Cacher
                    </button>
                    <button class="chip" class:on={fogTool === null} onclick={() => (fogTool = null)}>
                        Aucun
                    </button>
                </div>
                <div class="chips" role="radiogroup" aria-label="Taille du pinceau">
                    <span class="small">Taille</span>
                    {#each [1, 3, 5] as size (size)}
                        <button class="chip" class:on={fogBrush === size} onclick={() => (fogBrush = size)}>
                            {size}×{size}
                        </button>
                    {/each}
                </div>
                <div class="row">
                    <button class="btn btn-small" onclick={() => client.act("fog.all", { sceneId: scene!.id, revealed: true })}>
                        Tout révéler
                    </button>
                    <button class="btn btn-small" onclick={() => client.act("fog.all", { sceneId: scene!.id, revealed: false })}>
                        Tout cacher
                    </button>
                </div>
            {/if}
        </section>

        {#if scenes.length > 1}
            <button class="btn btn-small btn-danger" onclick={remove}>Supprimer cette scène</button>
        {/if}
    {/if}
</div>

<style>
    .panel-body {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        font-size: 0.9rem;
    }

    section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    section + section {
        border-top: 1px solid var(--border);
        padding-top: 0.75rem;
    }

    h3 {
        font-size: 1.15rem;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        font-size: 0.8rem;
    }

    label.check {
        flex-direction: row;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.85rem;
    }

    input:not([type="checkbox"]),
    select {
        height: 34px;
        font-size: 15px;
        padding: 0 0.5rem;
    }

    .grid2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
    }

    .row,
    .chips {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
    }

    .chip {
        min-height: 30px;
        padding: 0 0.6rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: none;
        color: var(--foreground);
    }

    .chip.on {
        background-color: var(--primary);
        border-color: var(--primary);
        color: var(--background);
    }

    ul {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    li {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.2rem 0.4rem;
        border-radius: var(--radius);
    }

    li.viewing {
        background-color: rgba(229, 184, 204, 0.15);
    }

    .name {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        text-align: left;
        border: none;
        background: none;
        color: var(--foreground);
        font-size: 0.95rem;
        padding: 0.25rem 0;
    }

    .live {
        font-size: 0.7rem;
        padding: 0 0.35rem;
        border-radius: var(--radius);
        background-color: var(--primary);
        color: var(--background);
    }

    .small {
        font-size: 0.8rem;
    }
</style>
