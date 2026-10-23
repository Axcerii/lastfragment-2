<script lang="ts">
    import { onMount } from "svelte";
    import Tabs from "$lib/components/ui/Tabs.svelte";
    import Board, { MAX_TOKEN_SIZE, type DrawTool, type FogTool } from "$lib/components/table/Board.svelte";
    import DrawMenu from "$lib/components/table/DrawMenu.svelte";
    import ShortcutsHelp from "$lib/components/table/ShortcutsHelp.svelte";
    import TokenCard from "$lib/components/table/TokenCard.svelte";
    import LogPanel from "$lib/components/table/LogPanel.svelte";
    import ActionsPanel from "$lib/components/table/ActionsPanel.svelte";
    import TokensPanel from "$lib/components/table/TokensPanel.svelte";
    import ScenePanel from "$lib/components/table/ScenePanel.svelte";
    import CombatPanel from "$lib/components/table/CombatPanel.svelte";
    import MediaPanel from "$lib/components/table/MediaPanel.svelte";
    import AudioEngine from "$lib/components/table/AudioEngine.svelte";
    import SoundToken from "$lib/components/table/SoundToken.svelte";
    import OrderStrip from "$lib/components/table/OrderStrip.svelte";
    import Showcase from "$lib/components/table/Showcase.svelte";
    import DiceMenu from "$lib/components/table/DiceMenu.svelte";
    import RollToast from "$lib/components/table/RollToast.svelte";
    import FloatingWindow from "$lib/components/ui/FloatingWindow.svelte";
    import { TableClient } from "$lib/table/client.svelte";
    import type { DiceResult, TokenView } from "$lib/table/types";

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
    let drawTool = $state<DrawTool>(null);
    let board: Board | undefined = $state();
    let diceMenu: DiceMenu | undefined = $state();
    let lastRoll = $state<(DiceResult & { at: number }) | null>(null);
    let drawMenu: DrawMenu | undefined = $state();
    let journal: FloatingWindow | undefined = $state();
    let helpOpen = $state(false);

    // Un seul outil à la fois : prendre le crayon range le pinceau de brouillard, et inversement.
    let lastDraw: DrawTool = null;
    let lastFog: FogTool = null;
    $effect(() => {
        if (drawTool && !lastDraw) fogTool = null;
        lastDraw = drawTool;
    });
    $effect(() => {
        if (fogTool && !lastFog) drawTool = null;
        lastFog = fogTool;
    });

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

    function resize(token: TokenView, size: number) {
        client.act("token.update", { id: token.id, size: Math.max(1, Math.min(MAX_TOKEN_SIZE, size)) });
    }

    // ─── Dessin ───
    // Le plateau affiche tout de suite traits et effacements ; le serveur les partage ensuite
    // à tout le monde. Un refus du serveur rétablit l'affichage.

    async function draw(points: number[], color: string, width: number): Promise<number | null> {
        if (!viewSceneId) return null;
        const result = await client.act<{ id: number }>("draw.add", { sceneId: viewSceneId, points, color, width });
        return result?.id ?? null;
    }

    async function eraseDrawing(id: number): Promise<boolean> {
        return (await client.act("draw.delete", { id })) !== null;
    }

    async function undoDrawing() {
        const last = board?.lastOwn();
        if (last === "sending") return board?.dropLastSending();
        if (last == null) return;
        board?.hideDrawings([last]);
        if (!(await eraseDrawing(last))) board?.showDrawings([last]);
    }

    async function clearDrawings(all: boolean) {
        if (!viewSceneId || !board) return;
        const ids = board.drawingIds(all ? "erasable" : "mine");
        board.hideDrawings(ids);
        board.dropSending();
        const result = await client.act("draw.clear", { sceneId: viewSceneId, all });
        if (result === null) board.showDrawings(ids);
    }

    // ─── Raccourcis clavier ───
    // Les lettres suivent la touche tapée (AZERTY comme QWERTY) ; les chiffres suivent la position
    // de la touche, pour que 1 à 5 marchent sans Maj sur un clavier français.

    const canMove = (token: TokenView) => isAdmin || token.mine;

    function nudge(dx: number, dy: number) {
        if (!selected || !scene || !canMove(selected)) return false;
        const x = Math.max(0, Math.min(scene.cols - selected.size, selected.x + dx));
        const y = Math.max(0, Math.min(scene.rows - selected.size, selected.y + dy));
        if (x !== selected.x || y !== selected.y) move(selected, x, y);
        return true;
    }

    function cycleToken(step: number) {
        if (sceneTokens.length === 0) return;
        const index = sceneTokens.findIndex((t) => t.id === selectedId);
        selectedId = sceneTokens[(index + step + sceneTokens.length) % sceneTokens.length].id;
    }

    function stepScene(step: number) {
        if (!view || view.scenes.length === 0) return;
        const index = view.scenes.findIndex((s) => s.id === viewSceneId);
        viewSceneId = view.scenes[(index + step + view.scenes.length) % view.scenes.length].id;
    }

    function nextTurn() {
        const order = view?.session.order ?? [];
        if (order.length === 0) return;
        const index = view?.session.turn == null ? -1 : order.indexOf(view.session.turn);
        client.act("order.turn", { turn: order[(index + 1) % order.length] });
    }

    function toggleOrder(token: TokenView) {
        const order = view?.session.order ?? [];
        client.act("order.set", {
            order: order.includes(token.id) ? order.filter((id) => id !== token.id) : [...order, token.id],
        });
    }

    const typing = (target: EventTarget | null) =>
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);

    function onKey(e: KeyboardEvent) {
        if (!view) return;
        // Ctrl + / ouvre l'aide même depuis un champ de saisie, et la referme. « / » se tape avec
        // Maj sur un clavier français : on lit le caractère (e.key) plutôt que la touche.
        if ((e.ctrlKey || e.metaKey) && (e.key === "/" || e.code === "NumpadDivide")) {
            e.preventDefault();
            helpOpen = !helpOpen;
            return;
        }
        if (typing(e.target)) return;
        if (e.key === "Escape") {
            selectedId = null;
            fogTool = null;
            drawTool = null;
            diceMenu?.close();
            return;
        }
        // Une fenêtre (aide, confirmation) est ouverte : on ne touche à rien.
        if (document.querySelector("dialog[open]")) return;
        if (e.altKey) return;

        const key = e.key.toLowerCase();
        const ctrl = e.ctrlKey || e.metaKey;
        let handled = true;

        // ── Avec Ctrl / Cmd ──
        if (ctrl) {
            if (key === "z" && !e.shiftKey) undoDrawing();
            else if (key === "d" && isAdmin && selected && selected.kind !== "player") {
                client.act("token.duplicate", { id: selected.id });
            } else handled = false;
            if (handled) e.preventDefault();
            return;
        }

        // ── Pour tout le monde ──
        if (e.key === "?") helpOpen = true;
        else if (e.key === "Enter") document.getElementById("table-chat")?.focus();
        else if (key === "j") journal?.toggle();
        else if (key === "m") volumes.muted = !volumes.muted;
        else if (key === "d" && e.shiftKey) client.act("roll.dice", { formula: "d20" });
        else if (key === "d") diceMenu?.toggle();
        else if (key === "p") drawMenu?.togglePen();
        else if (key === "e") drawMenu?.toggleEraser();
        else if (e.key === "+" || e.key === "=" || e.code === "NumpadAdd") board?.zoomBy(1.2);
        else if (e.key === "-" || e.key === "_" || e.code === "NumpadSubtract") board?.zoomBy(1 / 1.2);
        else if (e.code === "Digit0" || e.code === "Numpad0") board?.fit();
        else if (e.key === "ArrowUp") handled = nudge(0, -1);
        else if (e.key === "ArrowDown") handled = nudge(0, 1);
        else if (e.key === "ArrowLeft") handled = nudge(-1, 0);
        else if (e.key === "ArrowRight") handled = nudge(1, 0);
        else if (e.key === "Tab" && (document.activeElement === document.body || document.activeElement === null)) {
            cycleToken(e.shiftKey ? -1 : 1);
        } else handled = false;

        // ── MJ ──
        if (!handled && isAdmin) {
            handled = true;
            const digit = /^(?:Digit|Numpad)([1-5])$/.exec(e.code);
            if (digit && !e.shiftKey) tab = ADMIN_TABS[Number(digit[1]) - 1].value;
            else if (e.key === "PageUp") stepScene(-1);
            else if (e.key === "PageDown") stepScene(1);
            else if (key === "a" && preparing && scene) client.act("scene.activate", { id: scene.id });
            else if (key === "g" && scene) client.act("scene.update", { id: scene.id, gridVisible: !scene.gridVisible });
            else if (key === "f" && scene) {
                if (!scene.fogEnabled) client.act("scene.update", { id: scene.id, fogEnabled: true });
                const wanted = e.shiftKey ? "hide" : "reveal";
                fogTool = fogTool === wanted ? null : wanted;
            } else if (e.key === "[" || e.key === "<") fogBrush = Math.max(1, fogBrush - 2);
            else if (e.key === "]" || e.key === ">") fogBrush = Math.min(9, fogBrush + 2);
            else if (key === "c") client.act("combat.set", { combat: !view.session.combat });
            else if (key === "t") nextTurn();
            else if (selected && key === "h") client.act("token.update", { id: selected.id, hidden: !selected.hidden });
            else if (selected && key === "n" && selected.kind !== "player") {
                client.act("token.update", { id: selected.id, nameHidden: !selected.nameHidden });
            } else if (selected && key === "s") client.act("token.update", { id: selected.id, revealed: !selected.revealed });
            else if (selected && key === "o") toggleOrder(selected);
            else if (selected && (e.key === "Delete" || e.key === "Backspace")) {
                if (confirm(`Retirer ${selected.name} du plateau ?`)) client.act("token.delete", { id: selected.id });
            } else handled = false;
        }

        if (handled) e.preventDefault();
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
            <label class="open players-check">
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
                <button class="btn btn-small btn-players" onclick={() => client.act("scene.activate", { id: scene!.id })}>
                    Montrer aux joueurs
                </button>
            {/if}
        {:else if scene}
            <span class="muted scene-name">{scene.name}</span>
        {/if}

        <span class="spacer"></span>
        <button class="btn btn-small help" onclick={() => (helpOpen = true)} title="Raccourcis clavier (? ou Ctrl + /)" aria-label="Raccourcis clavier">
            ⌨ <kbd>?</kbd>
        </button>
        {#if view}
            <SoundToken bind:volumes {unlocked} {client} session={view.session} {isAdmin} {assets} />
        {/if}
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
                        {drawTool}
                        playerId={view.viewer.playerId}
                        onmove={move}
                        onresize={resize}
                        ondraw={draw}
                        onerase={eraseDrawing}
                        onfog={fog}
                    />
                {:else}
                    <p class="empty muted">
                        {isAdmin ? "Crée une scène dans l'onglet Scènes." : "Le MJ prépare la scène…"}
                    </p>
                {/if}

                <div class="overlay top">
                    <div class="top-row">
                        <div class="tools-column">
                            <DiceMenu
                                bind:this={diceMenu}
                                {client}
                                {isAdmin}
                                onresult={(result) => (lastRoll = { ...result, at: Date.now() })}
                            />
                            <DrawMenu
                                bind:this={drawMenu}
                                {isAdmin}
                                bind:tool={drawTool}
                                onundo={undoDrawing}
                                onclear={clearDrawings}
                            />
                        </div>
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
                    {#if drawTool}
                        <span class="banner">
                            {drawTool.mode === "draw" ? "Crayon" : "Gomme"} actif
                            <button class="btn btn-small" onclick={() => (drawTool = null)}>Terminer <kbd>Échap</kbd></button>
                        </span>
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

                <!-- Fiche du jeton : fenêtre déplaçable et redimensionnable, taille gardée dans ce navigateur. -->
                {#if selected}
                    <FloatingWindow
                        title={selected.name}
                        storageKey="lf-table-token"
                        initial={{ x: 12, y: -12, width: 400, height: 480 }}
                        onclose={() => (selectedId = null)}
                    >
                        <TokenCard
                            token={selected}
                            {client}
                            {isAdmin}
                            inOrder={view.session.order.includes(selected.id)}
                            armors={data.admin?.armors}
                            onclose={() => (selectedId = null)}
                        />
                    </FloatingWindow>
                {/if}

                {#if !narrow}
                    <FloatingWindow
                        bind:this={journal}
                        title="Journal"
                        storageKey="lf-table-journal"
                        initial={{ x: -12, y: -60, width: 360, height: 380 }}
                    >
                        <LogPanel {client} {isAdmin} />
                    </FloatingWindow>
                {/if}

                <RollToast bind:roll={lastRoll} />

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
        <ShortcutsHelp bind:open={helpOpen} {isAdmin} />
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
        align-items: flex-start;
        gap: 0.6rem;
        max-width: 100%;
    }

    /* Dés au-dessus, stylo en dessous. */
    .tools-column {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .help kbd,
    .banner kbd {
        font-family: monospace;
        font-size: 0.75rem;
        padding: 0 0.3rem;
        border: 1px solid currentColor;
        border-radius: 3px;
        opacity: 0.8;
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

    /* Le halo de focus (2 px + 2 px d'écart) dépasse des champs : le conteneur qui défile
       garde une marge intérieure d'autant, compensée pour ne pas décaler la mise en page. */
    .tool-body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 5px 0.6rem 5px 5px;
        margin: -5px -0.35rem -5px -5px;
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
