<script lang="ts">
    import { onMount } from "svelte";
    import Tabs from "$lib/components/ui/Tabs.svelte";
    import Board, { type FogTool } from "$lib/components/table/Board.svelte";
    import TokenCard from "$lib/components/table/TokenCard.svelte";
    import LogPanel from "$lib/components/table/LogPanel.svelte";
    import ActionsPanel from "$lib/components/table/ActionsPanel.svelte";
    import TokensPanel from "$lib/components/table/TokensPanel.svelte";
    import ScenePanel from "$lib/components/table/ScenePanel.svelte";
    import CombatPanel from "$lib/components/table/CombatPanel.svelte";
    import MediaPanel from "$lib/components/table/MediaPanel.svelte";
    import AudioEngine from "$lib/components/table/AudioEngine.svelte";
    import VolumeControl from "$lib/components/table/VolumeControl.svelte";
    import OrderStrip from "$lib/components/table/OrderStrip.svelte";
    import Showcase from "$lib/components/table/Showcase.svelte";
    import DiceMenu from "$lib/components/table/DiceMenu.svelte";
    import FloatingWindow from "$lib/components/ui/FloatingWindow.svelte";
    import { TableClient } from "$lib/table/client.svelte";
    import type { TokenView } from "$lib/table/types";

    let { data } = $props();

    const client = new TableClient(data.sessionId);
    onMount(() => {
        client.connect();
        return () => client.disconnect();
    });

    let view = $derived(client.view);
    let isAdmin = $derived(view?.viewer.isAdmin ?? false);
    let assets = $state(data.admin?.assets ?? []);

    // Le MJ peut préparer une autre scène que celle montrée aux joueurs.
    let viewSceneId = $state<number | null>(null);
    $effect(() => {
        if (!view) return;
        if (!view.scenes.some((s) => s.id === viewSceneId)) viewSceneId = view.session.sceneId ?? view.scenes[0]?.id ?? null;
        if (!isAdmin) viewSceneId = view.session.sceneId;
    });
    let scene = $derived(view?.scenes.find((s) => s.id === viewSceneId) ?? null);
    let sceneTokens = $derived(view?.tokens.filter((t) => t.sceneId === viewSceneId) ?? []);
    let preparing = $derived(isAdmin && scene !== null && scene.id !== view?.session.sceneId);

    let selectedId = $state<number | null>(null);
    let selected = $derived(view?.tokens.find((t) => t.id === selectedId) ?? null);
    $effect(() => {
        if (selectedId !== null && !selected) selectedId = null;
    });

    let fogTool = $state<FogTool>(null);
    let fogBrush = $state(3);
    let board: Board | undefined = $state();

    type Tab = "actions" | "jetons" | "scenes" | "combat" | "medias";
    let tab = $state<Tab>("actions");
    const ADMIN_TABS: { value: Tab; label: string }[] = [
        { value: "actions", label: "Jets" },
        { value: "jetons", label: "Jetons" },
        { value: "scenes", label: "Scènes" },
        { value: "combat", label: "Combat" },
        { value: "medias", label: "Médias" },
    ];

    let volumes = $state({ music: 0.7, ambience: 0.7, effects: 0.8, muted: false, animations: true });

    // Écran étroit : le journal reste rangé sous les panneaux au lieu de flotter sur le plateau.
    let narrow = $state(false);
    onMount(() => {
        const query = matchMedia("(max-width: 900px)");
        narrow = query.matches;
        const onChange = () => (narrow = query.matches);
        query.addEventListener("change", onChange);
        return () => query.removeEventListener("change", onChange);
    });

    async function deleteScene() {
        if (!scene || !view || view.scenes.length < 2) return;
        if (!confirm(`Supprimer la scène « ${scene.name} » et ses jetons (hors joueurs) ?`)) return;
        await client.act("scene.delete", { id: scene.id });
        viewSceneId = view.session.sceneId;
    }
    let unlocked = $state(false);

    function move(token: TokenView, x: number, y: number) {
        client.act("token.move", { id: token.id, x, y, sceneId: isAdmin ? viewSceneId : undefined });
    }

    function fog(cells: number[], revealed: boolean) {
        if (scene) client.act("fog.set", { sceneId: scene.id, cells, revealed });
    }

    // Raccourcis clavier : Échap désélectionne / range le pinceau.
    function onKey(e: KeyboardEvent) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (e.key === "Escape") {
            selectedId = null;
            fogTool = null;
        }
    }
</script>

<svelte:head>
    <title>{view?.session.name ?? "Table de jeu"} : Last Fragment</title>
</svelte:head>

<svelte:window onkeydown={onKey} />

<div class="app">
    <header class="topbar">
        <a class="back" href="/outils/table" aria-label="Retour aux parties">←</a>
        <h1>{view?.session.name ?? "Table de jeu"}</h1>
        <span class="status status-{client.status}" title="Connexion">
            {client.status === "online" ? "En ligne" : client.status === "closed" ? "Fermée" : "Connexion…"}
        </span>

        {#if isAdmin && view}
            <label class="open">
                <input
                    type="checkbox"
                    checked={view.session.open}
                    onchange={(e) => client.act("session.update", { open: e.currentTarget.checked })}
                />
                Ouverte aux joueurs
            </label>
            <select class="scene-select" bind:value={viewSceneId} aria-label="Scène affichée">
                {#each view.scenes as s (s.id)}
                    <option value={s.id}>{s.name}{s.id === view.session.sceneId ? " (montrée)" : ""}</option>
                {/each}
            </select>
            <button
                class="btn btn-small btn-danger delete-scene"
                disabled={view.scenes.length < 2}
                onclick={deleteScene}
                aria-label="Supprimer la scène {scene?.name ?? ''}"
                title={view.scenes.length < 2 ? "Il faut garder au moins une scène" : "Supprimer cette scène"}
            >
                ✕
            </button>
            {#if preparing && scene}
                <button class="btn btn-small btn-accent" onclick={() => client.act("scene.activate", { id: scene!.id })}>
                    Montrer aux joueurs
                </button>
            {/if}
        {:else if scene}
            <span class="muted scene-name">{scene.name}</span>
        {/if}

        <span class="spacer"></span>
        <VolumeControl bind:volumes {unlocked} />
    </header>

    {#if client.status === "closed"}
        <div class="closed panel">
            <h2>La partie est fermée</h2>
            <p class="muted">Le MJ l'a fermée ou supprimée. Tu pourras la rejoindre depuis Outils quand elle rouvrira.</p>
            <a class="btn" href="/outils/table">Retour aux parties</a>
        </div>
    {:else if !view}
        <p class="loading muted">Connexion à la partie…</p>
    {:else}
        <div class="main">
            <section class="board-area" aria-label="Plateau">
                {#if scene}
                    <Board
                        bind:this={board}
                        {scene}
                        tokens={sceneTokens}
                        {isAdmin}
                        bind:selectedId
                        turn={view.session.turn}
                        fogTool={isAdmin ? fogTool : null}
                        {fogBrush}
                        animations={volumes.animations}
                        onmove={move}
                        onfog={fog}
                    />
                {:else}
                    <p class="empty muted">
                        {isAdmin ? "Crée une scène dans l'onglet Scènes." : "Le MJ prépare la scène…"}
                    </p>
                {/if}

                <div class="overlay top">
                    <div class="top-row">
                        <DiceMenu {client} {isAdmin} />
                        <OrderStrip
                        order={view.session.order}
                        tokens={view.tokens}
                        turn={view.session.turn}
                        combat={view.session.combat}
                        />
                    </div>
                    {#if preparing}
                        <span class="banner">Préparation : les joueurs voient une autre scène.</span>
                    {/if}
                    {#if fogTool && isAdmin}
                        <span class="banner">
                            Pinceau : {fogTool === "reveal" ? "révéler" : "cacher"}
                            <button class="btn btn-small" onclick={() => (fogTool = null)}>Terminer</button>
                        </span>
                    {/if}
                </div>

                <div class="zoom">
                    <button class="btn btn-small" onclick={() => board?.zoomBy(1.25)} aria-label="Zoomer">+</button>
                    <button class="btn btn-small" onclick={() => board?.zoomBy(0.8)} aria-label="Dézoomer">−</button>
                    <button class="btn btn-small" onclick={() => board?.fit()}>Cadrer</button>
                </div>

                {#if selected}
                    <div class="overlay card">
                        <TokenCard
                            token={selected}
                            {client}
                            {isAdmin}
                            inOrder={view.session.order.includes(selected.id)}
                            onclose={() => (selectedId = null)}
                        />
                    </div>
                {/if}

                {#if !narrow}
                    <FloatingWindow
                        title="Journal"
                        storageKey="lf-table-journal"
                        initial={{ x: -12, y: -60, width: 360, height: 380 }}
                    >
                        <LogPanel {client} {isAdmin} />
                    </FloatingWindow>
                {/if}

                {#if client.notice}
                    <div class="notice" role="status">{client.notice}</div>
                {/if}
            </section>

            <aside class="side">
                <div class="tools">
                    {#if isAdmin && data.admin}
                        <Tabs bind:value={tab} options={ADMIN_TABS} label="Outils du MJ" />
                        <div class="tool-body">
                            {#if tab === "actions"}
                                <ActionsPanel {client} tokens={sceneTokens} {isAdmin} {selectedId} />
                            {:else if tab === "jetons" && scene}
                                <TokensPanel
                                    {client}
                                    {scene}
                                    tokens={sceneTokens}
                                    sources={data.admin.sources}
                                    {assets}
                                    bind:selectedId
                                />
                            {:else if tab === "jetons"}
                                <p class="muted">Crée d'abord une scène.</p>
                            {:else if tab === "scenes"}
                                <ScenePanel
                                    {client}
                                    scenes={view.scenes}
                                    activeId={view.session.sceneId}
                                    bind:viewId={viewSceneId}
                                    {assets}
                                    bind:fogTool
                                    bind:fogBrush
                                />
                            {:else if tab === "combat"}
                                <CombatPanel {client} {view} {sceneTokens} />
                            {:else if tab === "medias"}
                                <MediaPanel {client} {view} {scene} bind:assets obsUrl={data.admin.obsUrl} />
                            {/if}
                        </div>
                    {:else}
                        <div class="tool-body">
                            <ActionsPanel {client} tokens={sceneTokens} {isAdmin} {selectedId} />
                        </div>
                    {/if}
                </div>
                {#if narrow}
                    <div class="journal">
                        <h2>Journal</h2>
                        <LogPanel {client} {isAdmin} />
                    </div>
                {/if}
            </aside>
        </div>

        <Showcase url={view.session.showcase} />
        <AudioEngine
            music={view.session.music}
            ambiences={view.session.ambiences}
            clockOffset={client.clockOffset}
            bind:volumes
            bind:unlocked
            registerSfx={(play) => (client.onSfx = play)}
        />
    {/if}
</div>

<style>
    .app {
        display: flex;
        flex-direction: column;
        height: 100dvh;
        overflow: hidden;
    }

    .topbar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.75rem;
        padding: 0.5rem 1rem;
        border-bottom: 1px solid var(--border);
        background-color: var(--surface);
        font-size: 0.9rem;
    }

    .back {
        font-size: 1.4rem;
        padding: 0 0.25rem;
    }

    h1 {
        font-size: 1.4rem;
    }

    .status {
        font-size: 0.75rem;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        border: 1px solid var(--border);
    }

    .status-online {
        color: var(--primary);
    }

    .status-offline,
    .status-connecting {
        color: var(--secondary);
    }

    .status-closed {
        color: var(--danger);
    }

    .open {
        display: flex;
        align-items: center;
        gap: 0.35rem;
    }

    .scene-select {
        width: auto;
        height: 32px;
        font-size: 15px;
        padding: 0 0.5rem;
    }

    .spacer {
        flex: 1;
    }

    .main {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: 1fr 24rem;
    }

    .board-area {
        position: relative;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
    }

    .empty,
    .loading {
        padding: 2rem;
    }

    .overlay {
        position: absolute;
        z-index: 30;
        pointer-events: none;
    }

    .top-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        max-width: 100%;
    }

    .delete-scene {
        min-height: 32px;
        width: 32px;
        padding: 0;
    }

    .overlay.top {
        /* Au-dessus du journal flottant, pour que le menu des dés passe devant. */
        z-index: 40;
        top: 0.75rem;
        left: 0.75rem;
        right: 0.75rem;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .banner {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.3rem 0.6rem;
        border-radius: var(--radius);
        background-color: rgba(210, 182, 116, 0.9);
        color: var(--background);
        font-size: 0.85rem;
        pointer-events: auto;
    }

    .overlay.card {
        left: 0.75rem;
        bottom: 0.75rem;
        width: min(26rem, calc(100% - 1.5rem));
        max-height: calc(100% - 5rem);
        overflow-y: auto;
        pointer-events: auto;
    }

    .zoom {
        position: absolute;
        z-index: 30;
        right: 0.75rem;
        bottom: 0.75rem;
        display: flex;
        gap: 0.3rem;
    }

    .zoom .btn {
        background-color: rgba(27, 27, 27, 0.85);
    }

    .notice {
        position: absolute;
        z-index: 40;
        left: 50%;
        bottom: 1rem;
        transform: translateX(-50%);
        padding: 0.5rem 1rem;
        border-radius: var(--radius);
        background-color: var(--danger);
        font-size: 0.9rem;
    }

    .side {
        display: flex;
        flex-direction: column;
        min-height: 0;
        border-left: 1px solid var(--border);
        background-color: var(--surface);
    }

    .tools {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        min-height: 0;
        padding: 0.75rem;
    }

    .tools :global(.tabs button) {
        min-height: 32px;
        padding: 0 0.6rem;
        font-size: 15px;
    }

    .tool-body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding-right: 0.25rem;
    }

    .journal {
        display: flex;
        flex-direction: column;
        min-height: 0;
        border-top: 1px solid var(--border);
    }

    .journal h2 {
        font-size: 1.1rem;
        padding: 0.5rem 0.75rem 0;
    }

    .closed {
        margin: 3rem auto;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        max-width: 32rem;
    }

    /* Écrans étroits : le plateau au-dessus, les panneaux en dessous. */
    @media (max-width: 900px) {
        .app {
            height: auto;
            min-height: 100dvh;
            overflow: visible;
        }

        .main {
            grid-template-columns: 1fr;
        }

        .board-area {
            height: 60dvh;
        }

        .side {
            display: flex;
            flex-direction: column;
            border-left: none;
            border-top: 1px solid var(--border);
        }

        .journal {
            height: 60dvh;
        }

        .scene-name {
            display: none;
        }
    }
</style>
