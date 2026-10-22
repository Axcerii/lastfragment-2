<script lang="ts" module>
    // La dernière fenêtre touchée passe devant les autres (sans dépasser les menus de la table).
    let front = $state(0);
    let count = 0;
</script>

<script lang="ts">
    // Fenêtre flottante : déplaçable par sa barre de titre, redimensionnable par ses bords
    // droit et bas et par son coin, réductible. Position et taille sont gardées dans ce navigateur.
    // Tout est géré au pointeur (souris, stylet, doigt) : pas de poignée native du navigateur,
    // qui entrerait en conflit avec la taille calculée ici.
    import { onMount, type Snippet } from "svelte";

    let {
        title,
        storageKey,
        initial,
        children,
        onclose,
    }: {
        title: string;
        storageKey: string;
        /** Position de départ, par rapport au conteneur (valeurs négatives : depuis la droite / le bas). */
        initial: { x: number; y: number; width: number; height: number };
        children: Snippet;
        /** Si présent, la barre de titre a un bouton de fermeture. */
        onclose?: () => void;
    } = $props();

    const MIN_WIDTH = 260;
    const MIN_HEIGHT = 160;
    const HEADER_HEIGHT = 38;

    let win: HTMLElement | undefined = $state();
    let x = $state(0);
    let y = $state(0);
    let width = $state(0);
    let height = $state(0);
    let collapsed = $state(false);
    let ready = $state(false);
    const id = ++count;
    const raise = () => {
        if (front !== id) front = id;
    };

    const container = () => win?.offsetParent as HTMLElement | null;

    /** Garde la fenêtre entière dans le conteneur, en la réduisant si le conteneur est trop petit. */
    function clamp() {
        const parent = container();
        if (!parent) return;
        const pw = parent.clientWidth;
        const ph = parent.clientHeight;
        width = Math.max(Math.min(MIN_WIDTH, pw), Math.min(width, pw));
        height = Math.max(Math.min(MIN_HEIGHT, ph), Math.min(height, ph));
        const h = collapsed ? HEADER_HEIGHT : height;
        x = Math.max(0, Math.min(pw - width, x));
        y = Math.max(0, Math.min(ph - h, y));
    }

    function save() {
        try {
            localStorage.setItem(storageKey, JSON.stringify({ x, y, width, height, collapsed }));
        } catch {
            /* stockage indisponible */
        }
    }

    onMount(() => {
        const parent = container();
        let saved: Partial<{ x: number; y: number; width: number; height: number; collapsed: boolean }> = {};
        try {
            saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}") ?? {};
        } catch {
            /* rien */
        }
        const valid = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
        width = valid(saved.width) ? saved.width : initial.width;
        height = valid(saved.height) ? saved.height : initial.height;
        collapsed = saved.collapsed === true;
        const pw = parent?.clientWidth ?? 0;
        const ph = parent?.clientHeight ?? 0;
        x = valid(saved.x) ? saved.x : initial.x < 0 ? pw - width + initial.x : initial.x;
        y = valid(saved.y) ? saved.y : initial.y < 0 ? ph - height + initial.y : initial.y;
        clamp();
        ready = true;

        // Le conteneur change de taille (fenêtre du navigateur) : la fenêtre reste visible.
        const observer = new ResizeObserver(() => clamp());
        if (parent) observer.observe(parent);
        return () => observer.disconnect();
    });

    // ─── Gestes ───
    type Edge = "move" | "right" | "bottom" | "corner";
    let gesture: {
        edge: Edge;
        startX: number;
        startY: number;
        x: number;
        y: number;
        width: number;
        height: number;
    } | null = null;
    let active = $state<Edge | null>(null);

    function start(e: PointerEvent, edge: Edge) {
        if (e.button !== 0) return;
        if (edge === "move" && (e.target as HTMLElement).closest("button")) return;
        e.preventDefault();
        e.stopPropagation();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        gesture = { edge, startX: e.clientX, startY: e.clientY, x, y, width, height };
        active = edge;
    }

    function move(e: PointerEvent) {
        if (!gesture) return;
        const parent = container();
        if (!parent) return;
        const dx = e.clientX - gesture.startX;
        const dy = e.clientY - gesture.startY;

        if (gesture.edge === "move") {
            const h = collapsed ? HEADER_HEIGHT : height;
            x = Math.max(0, Math.min(parent.clientWidth - width, gesture.x + dx));
            y = Math.max(0, Math.min(parent.clientHeight - h, gesture.y + dy));
            return;
        }
        // Le bord droit et le bas s'arrêtent au bord du conteneur.
        if (gesture.edge === "right" || gesture.edge === "corner") {
            width = Math.max(MIN_WIDTH, Math.min(parent.clientWidth - x, gesture.width + dx));
        }
        if (gesture.edge === "bottom" || gesture.edge === "corner") {
            height = Math.max(MIN_HEIGHT, Math.min(parent.clientHeight - y, gesture.height + dy));
        }
    }

    function end(e: PointerEvent) {
        if (!gesture) return;
        const target = e.currentTarget as HTMLElement;
        if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
        gesture = null;
        active = null;
        save();
    }

    export function toggle() {
        collapsed = !collapsed;
        clamp();
        save();
    }
</script>

<section
    bind:this={win}
    class="window"
    class:collapsed
    class:ready
    class:busy={active !== null}
    style:left="{x}px"
    style:top="{y}px"
    style:width="{width}px"
    style:height={collapsed ? "auto" : `${height}px`}
    style:z-index={front === id ? 36 : 35}
    aria-label={title}
    onpointerdowncapture={raise}
    onfocusin={raise}
>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <header
        class:grabbing={active === "move"}
        onpointerdown={(e) => start(e, "move")}
        onpointermove={move}
        onpointerup={end}
        onpointercancel={end}
    >
        <span class="grip" aria-hidden="true">⠿</span>
        <h2>{title}</h2>
        <button class="btn btn-small" onclick={toggle} aria-expanded={!collapsed} aria-label={collapsed ? "Déplier" : "Réduire"}>
            {collapsed ? "▴" : "▾"}
        </button>
        {#if onclose}
            <button class="btn btn-small" onclick={onclose} aria-label="Fermer">✕</button>
        {/if}
    </header>

    <div class="body" hidden={collapsed}>
        {@render children()}
    </div>

    {#if !collapsed}
        {#each ["right", "bottom", "corner"] as const as edge (edge)}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="handle {edge}"
                onpointerdown={(e) => start(e, edge)}
                onpointermove={move}
                onpointerup={end}
                onpointercancel={end}
                aria-hidden="true"
            ></div>
        {/each}
    {/if}
</section>

<style>
    .window {
        position: absolute;
        z-index: 35;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        visibility: hidden;
        background-color: rgba(27, 27, 27, 0.94);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
    }

    .window.ready {
        visibility: visible;
    }

    /* Pendant un geste, le contenu ne capte rien (sélection de texte, iframes…). */
    .window.busy .body {
        pointer-events: none;
        user-select: none;
    }

    header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        height: 38px;
        box-sizing: border-box;
        flex-shrink: 0;
        padding: 0 0.4rem 0 0.6rem;
        border-bottom: 1px solid var(--border);
        cursor: grab;
        touch-action: none;
        user-select: none;
    }

    header.grabbing {
        cursor: grabbing;
    }

    .collapsed header {
        border-bottom: none;
    }

    .grip {
        color: var(--muted);
    }

    h2 {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 1.05rem;
    }

    header .btn {
        min-height: 26px;
        width: 26px;
        padding: 0;
    }

    .body {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
    }

    .body[hidden] {
        display: none;
    }

    .handle {
        position: absolute;
        z-index: 2;
        touch-action: none;
    }

    .handle.right {
        top: 38px;
        right: 0;
        bottom: 14px;
        width: 8px;
        cursor: ew-resize;
    }

    .handle.bottom {
        left: 0;
        right: 14px;
        bottom: 0;
        height: 8px;
        cursor: ns-resize;
    }

    .handle.corner {
        right: 0;
        bottom: 0;
        width: 18px;
        height: 18px;
        cursor: nwse-resize;
        background: linear-gradient(
            135deg,
            transparent 0 55%,
            var(--muted) 55% 62%,
            transparent 62% 72%,
            var(--muted) 72% 79%,
            transparent 79%
        );
    }

    .handle:hover,
    .busy .handle {
        background-color: rgba(229, 184, 204, 0.18);
    }

    /* Au doigt, des poignées plus faciles à attraper. */
    @media (pointer: coarse) {
        .handle.right {
            width: 16px;
            bottom: 28px;
        }

        .handle.bottom {
            height: 16px;
            right: 28px;
        }

        .handle.corner {
            width: 30px;
            height: 30px;
        }
    }
</style>
