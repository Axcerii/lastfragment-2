<script lang="ts">
    // Fenêtre flottante : déplaçable par sa barre de titre, redimensionnable par son coin,
    // réductible. Position et taille sont gardées dans ce navigateur.
    import { onMount, type Snippet } from "svelte";

    let {
        title,
        storageKey,
        initial,
        children,
    }: {
        title: string;
        storageKey: string;
        /** Position de départ, par rapport au conteneur (valeurs négatives : depuis la droite / le bas). */
        initial: { x: number; y: number; width: number; height: number };
        children: Snippet;
    } = $props();

    let win: HTMLElement | undefined = $state();
    let x = $state(0);
    let y = $state(0);
    let width = $state(0);
    let height = $state(0);
    let collapsed = $state(false);
    let ready = $state(false);

    const container = () => win?.offsetParent as HTMLElement | null;

    function clamp() {
        const parent = container();
        if (!parent || !win) return;
        const w = win.offsetWidth;
        const h = win.offsetHeight;
        x = Math.max(0, Math.min(parent.clientWidth - Math.min(w, parent.clientWidth), x));
        y = Math.max(0, Math.min(parent.clientHeight - Math.min(h, parent.clientHeight), y));
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
        width = saved.width ?? initial.width;
        height = saved.height ?? initial.height;
        collapsed = saved.collapsed ?? false;
        const pw = parent?.clientWidth ?? 0;
        const ph = parent?.clientHeight ?? 0;
        x = saved.x ?? (initial.x < 0 ? pw - width + initial.x : initial.x);
        y = saved.y ?? (initial.y < 0 ? ph - height + initial.y : initial.y);
        ready = true;
        requestAnimationFrame(clamp);

        // Le conteneur change de taille (fenêtre du navigateur) : la fenêtre reste visible.
        const parentObserver = new ResizeObserver(clamp);
        if (parent) parentObserver.observe(parent);

        // Redimensionnement par le coin (CSS resize) : on mémorise la nouvelle taille.
        const sizeObserver = new ResizeObserver(() => {
            if (!win || collapsed) return;
            width = win.offsetWidth;
            height = win.offsetHeight;
            save();
        });
        if (win) sizeObserver.observe(win);
        return () => {
            parentObserver.disconnect();
            sizeObserver.disconnect();
        };
    });

    let drag: { dx: number; dy: number } | null = null;

    function onDown(e: PointerEvent) {
        if ((e.target as HTMLElement).closest("button")) return;
        drag = { dx: e.clientX - x, dy: e.clientY - y };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    function onMove(e: PointerEvent) {
        if (!drag) return;
        x = e.clientX - drag.dx;
        y = e.clientY - drag.dy;
        clamp();
    }

    function onUp() {
        if (!drag) return;
        drag = null;
        save();
    }

    function toggle() {
        collapsed = !collapsed;
        save();
        requestAnimationFrame(clamp);
    }
</script>

<section
    bind:this={win}
    class="window"
    class:collapsed
    class:ready
    style="left: {x}px; top: {y}px; width: {width}px; {collapsed ? '' : `height: ${height}px;`}"
    aria-label={title}
>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <header onpointerdown={onDown} onpointermove={onMove} onpointerup={onUp} onpointercancel={onUp}>
        <span class="grip" aria-hidden="true">⠿</span>
        <h2>{title}</h2>
        <button class="btn btn-small" onclick={toggle} aria-expanded={!collapsed} aria-label={collapsed ? "Déplier" : "Réduire"}>
            {collapsed ? "▴" : "▾"}
        </button>
    </header>
    <div class="body" hidden={collapsed}>
        {@render children()}
    </div>
</section>

<style>
    .window {
        position: absolute;
        z-index: 35;
        display: flex;
        flex-direction: column;
        min-width: 16rem;
        min-height: 10rem;
        max-width: 100%;
        max-height: 100%;
        resize: both;
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

    .window.collapsed {
        min-height: 0;
        resize: none;
    }

    header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.3rem 0.4rem 0.3rem 0.6rem;
        border-bottom: 1px solid var(--border);
        cursor: move;
        touch-action: none;
        user-select: none;
    }

    .collapsed header {
        border-bottom: none;
    }

    .grip {
        color: var(--muted);
    }

    h2 {
        flex: 1;
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
</style>
