<script lang="ts" module>
    /** Taille d'une case à zoom 1, en pixels. */
    export const CELL = 64;
    export type FogTool = "reveal" | "hide" | null;
    /** Outil de dessin : crayon (couleur, épaisseur) ou gomme. */
    export type DrawTool = { mode: "draw"; color: string; width: number } | { mode: "erase" } | null;
    /** Taille maximale d'un jeton, en cases. */
    export const MAX_TOKEN_SIZE = 6;
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
        drawTool = null,
        playerId = null,
        onmove,
        onfog,
        onresize,
        ondraw,
        onerase,
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
        drawTool?: DrawTool;
        /** Joueur qui regarde : ses traits sont ceux qu'il peut annuler. */
        playerId?: number | null;
        onmove?: (token: TokenView, x: number, y: number) => void;
        onfog?: (cells: number[], revealed: boolean) => void;
        onresize?: (token: TokenView, size: number) => void;
        /** Enregistre un trait ; renvoie son id, ou null si le serveur l'a refusé. */
        ondraw?: (points: number[], color: string, width: number) => Promise<number | null>;
        /** Efface un trait ; renvoie false si le serveur a refusé. */
        onerase?: (id: number) => Promise<boolean>;
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

    // Recadre à l'arrivée et à chaque changement de scène ou de dimensions. Une page ouverte en
    // arrière-plan n'a pas encore de taille : on attend qu'elle en ait une pour cadrer.
    let fittedFor = "";
    $effect(() => {
        const key = `${scene.id}:${scene.cols}x${scene.rows}`;
        if (viewport && viewWidth > 0 && viewHeight > 0 && key !== fittedFor) {
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
        | { kind: "fog"; revealed: boolean }
        | { kind: "resize"; token: TokenView }
        | { kind: "draw" }
        | { kind: "erase"; erased: Set<number> };

    let gesture: Gesture | null = null;
    let drag = $state<{ id: number; x: number; y: number } | null>(null);
    /** Taille en cours pendant qu'on tire le coin d'un jeton. */
    let resizing = $state<{ id: number; size: number } | null>(null);
    /** Trait en cours, en coordonnées du plateau. */
    let stroke = $state<number[]>([]);

    // ─── Dessins : affichage optimiste ───
    // Un trait envoyé s'affiche tout de suite (« local ») jusqu'à ce que le serveur le renvoie
    // dans l'état partagé ; un trait effacé disparaît tout de suite (« gone ») jusqu'à ce que
    // le serveur confirme. En cas de refus, on revient à l'état du serveur.
    interface LocalStroke {
        key: number;
        points: number[];
        color: string;
        width: number;
        /** Id attribué par le serveur, null tant que l'envoi est en cours. */
        id: number | null;
        /** Effacé avant même d'avoir reçu son id : on l'efface dès qu'il arrive. */
        doomed: boolean;
    }
    let local = $state<LocalStroke[]>([]);
    let gone = $state<Set<number>>(new Set());
    let seq = 0;
    let hoverId = $state<number | null>(null);

    interface ShownStroke {
        key: string;
        id: number | null;
        points: number[];
        color: string;
        width: number;
        erasable: boolean;
        mine: boolean;
    }

    let shown = $derived.by((): ShownStroke[] => {
        const serverIds = new Set(scene.drawings.map((d) => d.id));
        return [
            ...scene.drawings
                .filter((d) => !gone.has(d.id))
                .map((d) => ({
                    key: `s${d.id}`,
                    id: d.id,
                    points: d.points,
                    color: d.color,
                    width: d.width,
                    erasable: d.erasable,
                    mine: playerId !== null && d.playerId === playerId,
                })),
            ...local
                .filter((l) => !l.doomed && (l.id === null || (!serverIds.has(l.id) && !gone.has(l.id))))
                .map((l) => ({
                    key: `l${l.key}`,
                    id: l.id,
                    points: l.points,
                    color: l.color,
                    width: l.width,
                    erasable: l.id !== null,
                    mine: true,
                })),
        ];
    });

    // Quand l'état du serveur contient un trait local, la version locale n'a plus lieu d'être.
    // Les ids effacés restent dans « gone » : un id supprimé ne revient jamais, et cela évite
    // qu'un état parti avant l'effacement ne fasse réapparaître le trait un instant.
    $effect(() => {
        const serverIds = new Set(scene.drawings.map((d) => d.id));
        if (local.some((l) => l.id !== null && serverIds.has(l.id))) {
            local = local.filter((l) => l.id === null || !serverIds.has(l.id));
        }
    });

    async function sendStroke(points: number[], color: string, width: number) {
        const entry: LocalStroke = { key: ++seq, points, color, width, id: null, doomed: false };
        local = [...local, entry];
        const id = (await ondraw?.(points, color, width)) ?? null;
        const current = local.find((l) => l.key === entry.key);
        if (id === null || !current) {
            local = local.filter((l) => l.key !== entry.key);
            return;
        }
        if (current.doomed) {
            // Effacé pendant l'envoi : on le retire aussi côté serveur.
            local = local.filter((l) => l.key !== entry.key);
            void onerase?.(id);
            return;
        }
        local = local.map((l) => (l.key === entry.key ? { ...l, id } : l));
        // Filet de sécurité : si l'état partagé ne l'a jamais contenu (effacé entre-temps), on l'oublie.
        setTimeout(() => (local = local.filter((l) => l.key !== entry.key)), 5000);
    }

    /** Masque des traits tout de suite (effacement en cours). */
    export function hideDrawings(ids: number[]) {
        if (!ids.length) return;
        gone = new Set([...gone, ...ids]);
        local = local.filter((l) => l.id === null || !ids.includes(l.id));
    }

    /** Annule un masquage refusé par le serveur. */
    export function showDrawings(ids: number[]) {
        gone = new Set([...gone].filter((id) => !ids.includes(id)));
    }

    /** Oublie les traits encore en cours d'envoi (« effacer » pendant l'envoi). */
    export function dropSending() {
        local = local.map((l) => (l.id === null ? { ...l, doomed: true } : l));
    }

    /** Traits affichés : ceux du spectateur, ou tous ceux qu'il peut effacer. */
    export function drawingIds(which: "mine" | "erasable"): number[] {
        return shown
            .filter((d) => d.id !== null && (which === "mine" ? d.mine : d.erasable))
            .map((d) => d.id as number);
    }

    /** Son dernier trait : id connu, « sending » s'il part encore, ou null. */
    export function lastOwn(): number | "sending" | null {
        const sending = local.filter((l) => l.id === null && !l.doomed);
        if (sending.length) return "sending";
        const mine = shown.filter((d) => d.mine && d.id !== null);
        return mine.length ? (mine[mine.length - 1].id as number) : null;
    }

    /** Oublie le dernier trait encore en cours d'envoi (annuler pendant l'envoi). */
    export function dropLastSending() {
        const last = [...local].reverse().find((l) => l.id === null && !l.doomed);
        if (last) local = local.map((l) => (l === last ? { ...l, doomed: true } : l));
    }

    async function eraseOne(id: number) {
        hideDrawings([id]);
        const ok = (await onerase?.(id)) ?? false;
        if (!ok) showDrawings([id]);
    }

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

    /** Traits effaçables sous un point de l'écran (zones de prise invisibles, plus larges). */
    function drawingsAt(x: number, y: number): number[] {
        const ids: number[] = [];
        for (const el of document.elementsFromPoint(x, y)) {
            const id = Number((el as SVGElement).dataset?.drawing);
            if (id && !ids.includes(id)) ids.push(id);
        }
        return ids;
    }

    let lastErase: { x: number; y: number } | null = null;

    /** Gomme : efface les traits survolés, en suivant tout le chemin du pointeur. */
    function eraseAt(e: PointerEvent) {
        if (gesture?.kind !== "erase") return;
        const from = lastErase ?? { x: e.clientX, y: e.clientY };
        const steps = Math.max(1, Math.ceil(Math.hypot(e.clientX - from.x, e.clientY - from.y) / 6));
        for (let i = 0; i <= steps; i++) {
            const x = from.x + ((e.clientX - from.x) * i) / steps;
            const y = from.y + ((e.clientY - from.y) * i) / steps;
            for (const id of drawingsAt(x, y)) {
                if (gesture.erased.has(id)) continue;
                gesture.erased.add(id);
                void eraseOne(id);
            }
        }
        lastErase = { x: e.clientX, y: e.clientY };
    }

    function addPoint(e: PointerEvent) {
        const p = boardPoint(e);
        const n = stroke.length;
        // Un point tous les 3 px environ suffit et garde les traits légers.
        if (n >= 2 && Math.hypot(p.x - stroke[n - 2], p.y - stroke[n - 1]) < 3 / zoom) return;
        stroke = [...stroke, Math.round(p.x), Math.round(p.y)];
    }

    function onResizeDown(e: PointerEvent, token: TokenView) {
        if (readonly || !isAdmin || e.button !== 0) return;
        e.stopPropagation();
        viewport!.setPointerCapture(e.pointerId);
        gesture = { kind: "resize", token };
        resizing = { id: token.id, size: token.size };
    }

    function onTokenDown(e: PointerEvent, token: TokenView) {
        if (readonly || e.button !== 0) return;
        if (fogTool && isAdmin) return; // le pinceau passe à travers les jetons
        if (drawTool) return; // le crayon et la gomme aussi
        e.stopPropagation();
        selectedId = token.id;
        if (!canDrag(token)) return;
        viewport!.setPointerCapture(e.pointerId);
        gesture = { kind: "token", token, startX: e.clientX, startY: e.clientY, moved: false };
    }

    function onDown(e: PointerEvent) {
        if (readonly) return;
        if (drawTool && e.button === 0) {
            viewport!.setPointerCapture(e.pointerId);
            if (drawTool.mode === "draw") {
                gesture = { kind: "draw" };
                stroke = [];
                addPoint(e);
            } else {
                gesture = { kind: "erase", erased: new Set() };
                lastErase = null;
                eraseAt(e);
            }
            return;
        }
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
        // Gomme au repos : on montre quel trait partirait.
        if (!gesture && drawTool?.mode === "erase") hoverId = drawingsAt(e.clientX, e.clientY)[0] ?? null;
        if (!gesture) return;
        if (gesture.kind === "pan") {
            panX = gesture.panX + e.clientX - gesture.startX;
            panY = gesture.panY + e.clientY - gesture.startY;
        } else if (gesture.kind === "fog") {
            paintFog(e);
        } else if (gesture.kind === "draw") {
            addPoint(e);
        } else if (gesture.kind === "erase") {
            eraseAt(e);
        } else if (gesture.kind === "resize") {
            // La taille suit le coin tiré : distance au coin haut-gauche du jeton, en cases.
            const p = boardPoint(e);
            const t = gesture.token;
            const span = Math.max(p.x - t.x * CELL, p.y - t.y * CELL) / CELL;
            const limit = Math.min(MAX_TOKEN_SIZE, scene.cols - t.x, scene.rows - t.y);
            resizing = { id: t.id, size: Math.max(1, Math.min(limit, Math.round(span))) };
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
        } else if (g.kind === "draw") {
            if (stroke.length >= 4 && drawTool?.mode === "draw") {
                void sendStroke(stroke, drawTool.color, drawTool.width);
            }
            stroke = [];
        } else if (g.kind === "resize") {
            if (resizing && resizing.size !== g.token.size) onresize?.(g.token, resizing.size);
            setTimeout(() => (resizing = null), 300);
        } else if (g.kind === "fog") {
            const cells = [...fogPreview.keys()];
            if (cells.length) onfog?.(cells, g.revealed);
            // On garde l'aperçu le temps que le serveur réponde, puis on l'efface.
            setTimeout(() => (fogPreview = new Map()), 400);
        } else if (g.kind === "token" && g.moved && drag) {
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

    const sizeOf = (token: TokenView) => (resizing?.id === token.id ? resizing.size : token.size);

    const pointsOf = (points: number[]) => {
        const pairs: string[] = [];
        for (let i = 0; i + 1 < points.length; i += 2) pairs.push(`${points[i]},${points[i + 1]}`);
        return pairs.join(" ");
    };

    // Pendant un déplacement, le jeton suit le pointeur au pixel près.
    const position = (token: TokenView) =>
        drag?.id === token.id ? { x: drag.x, y: drag.y } : { x: token.x * CELL, y: token.y * CELL };
</script>

<div
    class="viewport"
    class:painting={(fogTool && isAdmin) || drawTool?.mode === "draw"}
    class:erasing={drawTool?.mode === "erase"}
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
                size={sizeOf(token)}
                dragging={drag?.id === token.id}
                draggable={canDrag(token)}
                resizable={isAdmin && !readonly && !drawTool && selectedId === token.id}
                onpointerdown={(e) => onTokenDown(e, token)}
                onresizedown={(e) => onResizeDown(e, token)}
            />
        {/each}

        <canvas class="fog" bind:this={canvas}></canvas>

        <svg
            class="drawings"
            class:erasing={drawTool?.mode === "erase"}
            viewBox="0 0 {width} {height}"
            width={width}
            height={height}
            aria-hidden="true"
        >
            {#each shown as d (d.key)}
                <polyline
                    points={pointsOf(d.points)}
                    stroke={d.color}
                    stroke-width={d.width}
                    class:hovered={hoverId !== null && hoverId === d.id}
                />
            {/each}
            {#if drawTool?.mode === "erase"}
                <!-- Zones de prise invisibles, au moins 18 px à l'écran quel que soit le zoom. -->
                {#each shown.filter((d) => d.erasable) as d (d.key)}
                    <polyline
                        class="hit"
                        points={pointsOf(d.points)}
                        stroke="transparent"
                        stroke-width={Math.max(d.width, 18 / zoom)}
                        data-drawing={d.id}
                    />
                {/each}
            {/if}
            {#if stroke.length >= 2 && drawTool?.mode === "draw"}
                <polyline points={pointsOf(stroke)} stroke={drawTool.color} stroke-width={drawTool.width} />
            {/if}
        </svg>

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

    .drawings {
        position: absolute;
        inset: 0;
        z-index: 9;
        overflow: visible;
        pointer-events: none;
    }

    .drawings polyline {
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
    }

    /* Gomme : seules les zones de prise des traits effaçables réagissent. */
    .drawings polyline.hit {
        pointer-events: stroke;
    }

    .drawings polyline.hovered {
        opacity: 0.35;
    }

    .viewport.erasing {
        cursor: cell;
    }

    .weather {
        position: absolute;
        z-index: 10;
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
