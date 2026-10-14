<script lang="ts">
    import type { TableClient } from "$lib/table/client.svelte";
    import {
        BLENDS,
        BLEND_LABELS,
        WEATHERS,
        WEATHER_LABELS,
        type Asset,
        type Blend,
        type SceneEffects,
        type SceneView,
    } from "$lib/table/types";
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
    let overlays = $derived(assets.filter((a) => a.kind === "calque"));

    const update = (fields: Record<string, unknown>) =>
        scene && client.act("scene.update", { id: scene.id, ...fields });

    async function create() {
        const result = await client.act<{ id: number }>("scene.create", {});
        if (result) viewId = result.id;
    }

    async function remove(target: SceneView) {
        if (!confirm(`Supprimer la scène « ${target.name} » et ses jetons (hors joueurs) ?`)) return;
        await client.act("scene.delete", { id: target.id });
        if (viewId === target.id) viewId = activeId;
    }

    // ─── Taille des cases ───
    // Moins de colonnes = des cases (et donc des jetons) plus grandes sur le même fond.
    // Les lignes suivent les proportions du fond, ou à défaut celles de la grille actuelle.
    let ratio = $state(2 / 3);
    let colsDraft = $state<number | null>(null);

    $effect(() => {
        if (!scene) return;
        ratio = scene.rows / scene.cols;
        if (!scene.background) return;
        const img = new Image();
        const id = scene.id;
        img.onload = () => {
            if (scene?.id === id && img.naturalWidth) ratio = img.naturalHeight / img.naturalWidth;
        };
        img.src = scene.background;
    });

    let cols = $derived(colsDraft ?? scene?.cols ?? 24);
    let rows = $derived(Math.max(4, Math.round(cols * ratio)));

    function applySize() {
        if (colsDraft === null) return;
        update({ cols: colsDraft, rows: Math.max(4, Math.min(120, Math.round(colsDraft * ratio))) });
        colsDraft = null;
    }

    // ─── Effets ───
    const TINTS: { label: string; color: string; opacity: number; blend: Blend }[] = [
        { label: "Nuit", color: "#1d2b5e", opacity: 0.6, blend: "multiply" },
        { label: "Obscurité", color: "#000000", opacity: 0.55, blend: "normal" },
        { label: "Crépuscule", color: "#c0602a", opacity: 0.45, blend: "soft-light" },
        { label: "Sang", color: "#8a0f0f", opacity: 0.45, blend: "multiply" },
        { label: "Poison", color: "#3d7a24", opacity: 0.4, blend: "multiply" },
        { label: "Sépia", color: "#704214", opacity: 0.4, blend: "overlay" },
        { label: "Flux", color: "#cfdfc4", opacity: 0.3, blend: "overlay" },
    ];

    let effects = $derived(scene?.effects);

    const setEffects = (patch: Partial<SceneEffects>) =>
        scene && update({ effects: { ...scene.effects, ...patch } });

    const setTint = (patch: Partial<NonNullable<SceneEffects["tint"]>>) =>
        effects?.tint && setEffects({ tint: { ...effects.tint, ...patch } });

    const setOverlay = (patch: Partial<NonNullable<SceneEffects["overlay"]>>) =>
        effects?.overlay && setEffects({ overlay: { ...effects.overlay, ...patch } });

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
                    {#if scenes.length > 1}
                        <button class="btn btn-small btn-danger" onclick={() => remove(s)} aria-label="Supprimer la scène {s.name}" title="Supprimer">✕</button>
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
            <label>
                Taille des cases
                <input
                    type="range"
                    min="6"
                    max="60"
                    step="1"
                    value={cols}
                    oninput={(e) => (colsDraft = Number(e.currentTarget.value))}
                    onchange={applySize}
                />
            </label>
            <div class="scale muted small">
                <span>Grandes cases</span>
                <span>{cols} × {rows}</span>
                <span>Petites cases</span>
            </div>
            <label class="check">
                <input type="checkbox" checked={scene.gridVisible} onchange={(e) => update({ gridVisible: e.currentTarget.checked })} />
                Grille visible
            </label>
            <p class="muted small">
                Le brouillard et les jetons sont replacés à proportion quand la taille change.
            </p>
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

        {#if effects}
            <section>
                <h3>Effets</h3>

                <span class="sub">Teinte <span class="muted">(sur le fond, sous les jetons)</span></span>
                <div class="chips" role="radiogroup" aria-label="Teinte">
                    <button class="chip" class:on={!effects.tint} onclick={() => setEffects({ tint: null })}>Aucune</button>
                    {#each TINTS as tint (tint.label)}
                        <button
                            class="chip"
                            class:on={effects.tint?.color === tint.color && effects.tint?.blend === tint.blend}
                            onclick={() => setEffects({ tint: { color: tint.color, opacity: tint.opacity, blend: tint.blend } })}
                        >
                            <span class="swatch" style="background-color: {tint.color}"></span>{tint.label}
                        </button>
                    {/each}
                </div>
                {#if effects.tint}
                    <div class="grid3">
                        <label>
                            Couleur
                            <input type="color" value={effects.tint.color} onchange={(e) => setTint({ color: e.currentTarget.value })} />
                        </label>
                        <label>
                            Force
                            <input type="range" min="0.05" max="0.95" step="0.05" value={effects.tint.opacity} onchange={(e) => setTint({ opacity: Number(e.currentTarget.value) })} />
                        </label>
                        <label>
                            Mélange
                            <select value={effects.tint.blend} onchange={(e) => setTint({ blend: e.currentTarget.value as Blend })}>
                                {#each BLENDS as b (b)}<option value={b}>{BLEND_LABELS[b]}</option>{/each}
                            </select>
                        </label>
                    </div>
                {/if}

                <span class="sub">Météo <span class="muted">(animée, au-dessus des jetons)</span></span>
                <div class="chips" role="radiogroup" aria-label="Météo">
                    {#each WEATHERS as w (w)}
                        <button class="chip" class:on={effects.weather === w} onclick={() => setEffects({ weather: w })}>
                            {WEATHER_LABELS[w]}
                        </button>
                    {/each}
                </div>
                {#if effects.weather !== "aucune"}
                    <label>
                        Intensité
                        <input type="range" min="0.1" max="1" step="0.05" value={effects.intensity} onchange={(e) => setEffects({ intensity: Number(e.currentTarget.value) })} />
                    </label>
                {/if}

                <span class="sub">Calque <span class="muted">(gif, webp animé ou vidéo webm)</span></span>
                <select
                    value={effects.overlay?.url ?? ""}
                    aria-label="Calque"
                    onchange={(e) => {
                        const url = e.currentTarget.value;
                        setEffects({
                            overlay: url
                                ? { url, opacity: effects?.overlay?.opacity ?? 0.8, blend: effects?.overlay?.blend ?? "screen" }
                                : null,
                        });
                    }}
                >
                    <option value="">Aucun</option>
                    {#each overlays as asset (asset.id)}
                        <option value={asset.url}>{asset.name}</option>
                    {/each}
                </select>
                {#if overlays.length === 0}
                    <p class="muted small">Envoie des calques dans l'onglet Médias → Calques.</p>
                {/if}
                {#if effects.overlay}
                    <div class="grid2">
                        <label>
                            Opacité
                            <input type="range" min="0.05" max="1" step="0.05" value={effects.overlay.opacity} onchange={(e) => setOverlay({ opacity: Number(e.currentTarget.value) })} />
                        </label>
                        <label>
                            Mélange
                            <select value={effects.overlay.blend} onchange={(e) => setOverlay({ blend: e.currentTarget.value as Blend })}>
                                {#each BLENDS as b (b)}<option value={b}>{BLEND_LABELS[b]}</option>{/each}
                            </select>
                        </label>
                    </div>
                    <p class="muted small">« Écran » rend le noir transparent : idéal pour les effets vendus sur fond noir.</p>
                {/if}
            </section>
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

    .grid2,
    .grid3 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
    }

    .grid3 {
        grid-template-columns: 4rem 1fr 1fr;
    }

    input[type="range"] {
        height: auto;
        padding: 0;
        background: none;
        border: none;
    }

    input[type="color"] {
        height: 34px;
        padding: 0.1rem;
    }

    .scale {
        display: flex;
        justify-content: space-between;
        margin-top: -0.3rem;
    }

    .sub {
        font-size: 0.85rem;
        margin-top: 0.25rem;
    }

    .swatch {
        display: inline-block;
        width: 0.7rem;
        height: 0.7rem;
        margin-right: 0.3rem;
        border-radius: 50%;
        border: 1px solid var(--border);
        vertical-align: -1px;
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
