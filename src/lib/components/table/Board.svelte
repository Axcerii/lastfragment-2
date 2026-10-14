<script lang="ts" module>
    /** Taille d'une case à zoom 1, en pixels. */
    export const CELL = 64;
    export type FogTool = "reveal" | "hide" | null;
</script>

<script lang="ts">
    import { isVideo, type SceneView, type TokenView } from "$lib/table/types";
    import TokenPiece from "./TokenPiece.svelte";
    import WeatherLayer from "./WeatherLayer.svelte";

    let {
        scene,
        tokens,
        isAdmin = false,
        readonly = false,
        selectedId = $bindable(null),
        turn = null,
        fogTool = null,
        fogBrush = 1,
        animations = true,
        onmove,
        onfog,
    }: {
        scene: SceneView;
        tokens: TokenView[];
        isAdmin?: boolean;
        /** Vue OBS : rien n'est cliquable. */
        readonly?: boolean;
        selectedId?: number | null;
        turn?: number | null;
        fogTool?: FogTool;
        /** Largeur du pinceau de brouillard, en cases (1, 3, 5…). */
        fogBrush?: number;
        /** Météo animée affichée (réglage propre à chaque spectateur). */
        animations?: boolean;
        onmove?: (token: TokenView, x: number, y: number) => void;
        onfog?: (cells: number[], revealed: boolean) => void;
    } = $props();

    let viewport: HTMLDivElement | undefined = $state();
    let canvas: HTMLCanvasElement | undefined = $state();
    let zoom = $state(1);
    let panX = $state(0);
    let panY = $state(0);

    let width = $derived(scene.cols * CELL);
    let height = $derived(scene.rows * CELL);
    let effects = $derived(scene.effects);

    // Partie du plateau visible à l'écran : seule zone où la météo est dessinée.
    let viewWidth = $state(0);
    let viewHeight = $state(0);
    let weatherRect = $derived.by(() => {
        const left = Math.max(0, panX);
        const top = Math.max(0, panY);
        const right = Math.min(viewWidth, panX + width * zoom);
        const bottom = Math.min(viewHeight, panY + height * zoom);
        return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
    });

    // ─── Cadrage ───
    export function fit() {
        if (!viewport) return;
        const { clientWidth: w, clientHeight: h } = viewport;
        zoom = Math.max(0.15, Math.min(2.5, Math.min(w / width, h / height) * 0.95));
        panX = (w - width * zoom) / 2;
        panY = (h - height * zoom) / 2;
    }

    export function zoomBy(factor: number, cx?: number, cy?: number) {
        if (!viewport) return;
        const x = cx ?? viewport.clientWidth / 2;
        const y = cy ?? viewport.clientHeight / 2;
        const next = Math.max(0.15, Math.min(4, zoom * factor));
        // Le point sous le curseur reste en place.
        panX = x - ((x - panX) * next) / zoom;
        panY = y - ((y - panY) * next) / zoom;
        zoom = next;
    }

    // Recadre à l'arrivée et à chaque changement de scène ou de dimensions.
    let fittedFor = "";
    $effect(() => {
        const key = `${scene.id}:${scene.cols}x${scene.rows}`;
        if (viewport && key !== fittedFor) {
            fittedFor = key;
            fit();
        }
    });

    // ─── Brouillard : une image d'une case par pixel, agrandie sans lissage ───
    let fogPreview = $state<Map<number, boolean>>(new Map());

    $effect(() => {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = scene.cols;
        canvas.height = scene.rows;
        ctx.clearRect(0, 0, scene.cols, scene.rows);
        if (!scene.fogEnabled) return;

        const revealed = new Set(scene.fog);
        for (const [cell, value] of fogPreview) {
            if (value) revealed.add(cell);
            else revealed.delete(cell);
        }
        // Le MJ voit à travers le brouillard ; les joueurs non.
        ctx.fillStyle = isAdmin ? "rgba(10, 10, 20, 0.55)" : "rgb(12, 12, 14)";
        for (let y = 0; y < scene.rows; y++) {
            for (let x = 0; x < scene.cols; x++) {
                if (!revealed.has(y * scene.cols + x)) ctx.fillRect(x, y, 1, 1);
            }
        }
    });

    // ─── Pointeur : déplacer la vue, un jeton, ou peindre le brouillard ───
    type Gesture =
        | { kind: "pan"; startX: number; startY: number; panX: number; panY: number }
        | { kind: "token"; token: TokenView; startX: number; startY: number; moved: boolean }
        | { kind: "fog"; revealed: boolean };

    let gesture: Gesture | null = null;
    let drag = $state<{ id: number; x: number; y: number } | null>(null);

    function boardPoint(e: PointerEvent) {
        const rect = viewport!.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - panX) / zoom,
            y: (e.clientY - rect.top - panY) / zoom,
        };
    }

    const canDrag = (token: TokenView) => !readonly && (isAdmin || token.mine);

    let lastCell: { x: number; y: number } | null = null;

    function paintAt(x: number, y: number, revealed: boolean, next: Map<number, boolean>) {
        const r = Math.floor(fogBrush / 2);
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                const cx = x + dx;
                const cy = y + dy;
                if (cx >= 0 && cy >= 0 && cx < scene.cols && cy < scene.rows) next.set(cy * scene.cols + cx, revealed);
            }
        }
    }

    function paintFog(e: PointerEvent) {
        if (gesture?.kind !== "fog") return;
        const p = boardPoint(e);
        const cell = { x: Math.floor(p.x / CELL), y: Math.floor(p.y / CELL) };
        if (lastCell && lastCell.x === cell.x && lastCell.y === cell.y) return;
        const next = new Map(fogPreview);
        // Un geste rapide saute des cases : on trace le segment depuis la dernière position.
        const from = lastCell ?? cell;
        const steps = Math.max(Math.abs(cell.x - from.x), Math.abs(cell.y - from.y), 1);
        for (let i = 0; i <= steps; i++) {
            paintAt(
                Math.round(from.x + ((cell.x - from.x) * i) / steps),
                Math.round(from.y + ((cell.y - from.y) * i) / steps),
                gesture.revealed,
                next,
            );
        }
        lastCell = cell;
        fogPreview = next;
    }

    function onTokenDown(e: PointerEvent, token: TokenView) {
        if (readonly || e.button !== 0) return;
        if (fogTool && isAdmin) return; // le pinceau passe à travers les jetons
        e.stopPropagation();
        selectedId = token.id;
        if (!canDrag(token)) return;
        viewport!.setPointerCapture(e.pointerId);
        gesture = { kind: "token", token, startX: e.clientX, startY: e.clientY, moved: false };
    }

    function onDown(e: PointerEvent) {
        if (readonly) return;
        if (fogTool && isAdmin && e.button === 0) {
            viewport!.setPointerCapture(e.pointerId);
            gesture = { kind: "fog", revealed: fogTool === "reveal" };
            lastCell = null;
            paintFog(e);
            return;
        }
        viewport!.setPointerCapture(e.pointerId);
        gesture = { kind: "pan", startX: e.clientX, startY: e.clientY, panX, panY };
    }

    function onMoveEvent(e: PointerEvent) {
        if (!gesture) return;
        if (gesture.kind === "pan") {
            panX = gesture.panX + e.clientX - gesture.startX;
            panY = gesture.panY + e.clientY - gesture.startY;
        } else if (gesture.kind === "fog") {
            paintFog(e);
        } else {
            const distance = Math.hypot(e.clientX - gesture.startX, e.clientY - gesture.startY);
            if (distance > 4) gesture.moved = true;
            if (gesture.moved) {
                const p = boardPoint(e);
                const half = (gesture.token.size * CELL) / 2;
                drag = { id: gesture.token.id, x: p.x - half, y: p.y - half };
            }
        }
    }

    function onUp(e: PointerEvent) {
        const g = gesture;
        gesture = null;
        if (!g) return;

        if (g.kind === "pan") {
            // Un simple clic sur le plateau désélectionne.
            if (Math.hypot(e.clientX - g.startX, e.clientY - g.startY) < 4) selectedId = null;
        } else if (g.kind === "fog") {
            const cells = [...fogPreview.keys()];
            if (cells.length) onfog?.(cells, g.revealed);
            // On garde l'aperçu le temps que le serveur réponde, puis on l'efface.
            setTimeout(() => (fogPreview = new Map()), 400);
        } else if (g.moved && drag) {
            const size = g.token.size;
            const x = Math.max(0, Math.min(scene.cols - size, Math.round(drag.x / CELL)));
            const y = Math.max(0, Math.min(scene.rows - size, Math.round(drag.y / CELL)));
            if (x !== g.token.x || y !== g.token.y) onmove?.(g.token, x, y);
        }
        drag = null;
    }

    function onWheel(e: WheelEvent) {
        e.preventDefault();
        const rect = viewport!.getBoundingClientRect();
        zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - rect.left, e.clientY - rect.top);
    }

    // Pendant un déplacement, le jeton suit le pointeur au pixel près.
    const position = (token: TokenView) =>
        drag?.id === token.id ? { x: drag.x, y: drag.y } : { x: token.x * CELL, y: token.y * CELL };
</script>

<div
    class="viewport"
    class:painting={fogTool && isAdmin}
    class:readonly
    bind:this={viewport}
    bind:clientWidth={viewWidth}
    bind:clientHeight={viewHeight}
    onpointerdown={onDown}
    onpointermove={onMoveEvent}
    onpointerup={onUp}
    onpointercancel={onUp}
    onwheel={onWheel}
    role="application"
    aria-label="Plateau de jeu"
>
    <div
        class="world"
        style="width: {width}px; height: {height}px; transform: translate({panX}px, {panY}px) scale({zoom});"
    >
        {#if scene.background}
            <img class="background" src={scene.background} alt="" draggable="false" />
        {:else}
            <div class="background empty"></div>
        {/if}

        {#if effects.tint}
            <div
                class="tint"
                style="background-color: {effects.tint.color}; opacity: {effects.tint.opacity}; mix-blend-mode: {effects.tint.blend};"
            ></div>
        {/if}

        {#if scene.gridVisible}
            <div class="grid" style="background-size: {CELL}px {CELL}px;"></div>
        {/if}

        {#each tokens as token (token.id)}
            {@const p = position(token)}
            <TokenPiece
                {token}
                x={p.x}
                y={p.y}
                cell={CELL}
                selected={selectedId === token.id}
                active={turn === token.id}
                dragging={drag?.id === token.id}
                draggable={canDrag(token)}
                onpointerdown={(e) => onTokenDown(e, token)}
            />
        {/each}

        <canvas class="fog" bind:this={canvas}></canvas>

        {#if effects.overlay}
            {#if isVideo(effects.overlay.url)}
                <video
                    class="overlay"
                    src={effects.overlay.url}
                    autoplay
                    loop
                    muted
                    playsinline
                    style="opacity: {effects.overlay.opacity}; mix-blend-mode: {effects.overlay.blend};"
                ></video>
            {:else}
                <img
                    class="overlay"
                    src={effects.overlay.url}
                    alt=""
                    draggable="false"
                    style="opacity: {effects.overlay.opacity}; mix-blend-mode: {effects.overlay.blend};"
                />
            {/if}
        {/if}
    </div>

    {#if animations && effects.weather !== "aucune" && weatherRect.width > 0 && weatherRect.height > 0}
        <div
            class="weather"
            style="left: {weatherRect.left}px; top: {weatherRect.top}px; width: {weatherRect.width}px; height: {weatherRect.height}px;"
        >
            <WeatherLayer
                weather={effects.weather}
                intensity={effects.intensity}
                width={weatherRect.width}
                height={weatherRect.height}
            />
        </div>
    {/if}
</div>

<style>
    .viewport {
        position: absolute;
        inset: 0;
        overflow: hidden;
        touch-action: none;
        cursor: grab;
        background-color: #0e0e0e;
        user-select: none;
    }

    .viewport:active {
        cursor: grabbing;
    }

    .viewport.painting {
        cursor: crosshair;
    }

    .viewport.readonly {
        cursor: default;
    }

    .world {
        position: absolute;
        top: 0;
        left: 0;
        transform-origin: 0 0;
    }

    .background {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: fill;
        pointer-events: none;
    }

    .background.empty {
        background-color: #1f1f1f;
        background-image: url("/layout/soft-neige1B1B1B.png");
    }

    .tint,
    .overlay {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
    }

    .tint {
        z-index: 1;
    }

    .overlay {
        z-index: 7;
        object-fit: cover;
    }

    .weather {
        position: absolute;
        z-index: 8;
        overflow: hidden;
        pointer-events: none;
    }

    .grid {
        position: absolute;
        z-index: 2;
        inset: 0;
        pointer-events: none;
        background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.2) 2px, transparent 2px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 2px, transparent 2px);
    }

    .fog {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        image-rendering: pixelated;
        pointer-events: none;
        z-index: 5;
    }
</style>
