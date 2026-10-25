<script lang="ts">
    // Le booster à ouvrir : on glisse le doigt le long du pointillé du haut, dans un sens ou dans
    // l'autre. La découpe suit le doigt, la bande du haut s'envole, puis le paquet tombe et laisse
    // les cartes à leur place.
    import type { PackView } from "$lib/cards/types";
    import PackModel from "./PackModel.svelte";
    import { vibrate } from "./feedback";

    let {
        pack,
        title,
        code,
        count = 5,
        waiting = false,
        leaving = false,
        error = null,
        oncut,
    }: {
        pack: PackView;
        title: string;
        code: string;
        count?: number;
        /** Découpé, mais les cartes ne sont pas encore arrivées du serveur. */
        waiting?: boolean;
        /** Le paquet tombe : les cartes sortent. */
        leaving?: boolean;
        error?: string | null;
        oncut: () => void;
    } = $props();

    const CUT = 11;

    let done = $state(false);
    let direction = $state(1);
    let from = $state<number | null>(null);
    let to = $state(0);
    let el: HTMLDivElement | undefined = $state();
    let start: { x: number; y: number; pct: number } | null = null;

    function pct(clientX: number) {
        const box = el!.getBoundingClientRect();
        return Math.min(100, Math.max(0, ((clientX - box.left) / box.width) * 100));
    }

    function cut(dir: number) {
        if (done) return;
        done = true;
        direction = dir;
        vibrate(40);
        oncut();
    }

    function onpointerdown(e: PointerEvent) {
        if (done || error || !el) return;
        el.setPointerCapture(e.pointerId);
        start = { x: e.clientX, y: e.clientY, pct: pct(e.clientX) };
    }

    function onpointermove(e: PointerEvent) {
        if (!start || done || !el) return;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (from === null && (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy) * 0.8)) return;
        from = start.pct;
        to = pct(e.clientX);
        // Assez découpé : le reste se déchire tout seul.
        if (Math.abs(to - from) >= 68) cut(Math.sign(to - from) || 1);
    }

    function onpointerup() {
        start = null;
        if (!done) from = null;
    }
</script>

{#snippet cutline()}
    <svg class="cutline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {#if !done}
            <line class="dashes" x1="3" x2="97" y1={CUT} y2={CUT} />
        {/if}
        {#if from !== null && !done}
            <line class="progress" x1={from} x2={to} y1={CUT} y2={CUT} />
        {/if}
    </svg>
    {#if !done}
        <span class="scissors" style="top: {CUT}%">✂</span>
        {#if from === null}<span class="guide" style="top: {CUT}%"></span>{/if}
    {:else}
        <span class="flashline" style="top: {CUT}%"></span>
        <span class="glow" class:waiting style="top: {CUT}%"></span>
    {/if}
{/snippet}

<div class="intro">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        bind:this={el}
        class="hold"
        class:done
        {onpointerdown}
        {onpointermove}
        {onpointerup}
        onpointercancel={onpointerup}
    >
        <PackModel
            {pack}
            {title}
            {code}
            {count}
            width="calc(var(--card-w) * 1.1)"
            idle={!done}
            follow={!done}
            split={done}
            stripGone={done}
            bodyGone={leaving}
            dir={direction}
            cut={CUT}
            overlay={cutline}
        />
    </div>

    <p class="hint" class:hidden={leaving} aria-live="polite">
        {#if error}
            <span class="message-error">{error}</span>
        {:else if done && waiting}
            Les cartes arrivent…
        {:else if !done}
            Glisse le doigt le long du pointillé pour découper le haut
        {/if}
    </p>
</div>

<style>
    .intro {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
    }

    .hold {
        touch-action: none;
        cursor: grab;
    }

    .hold.done {
        cursor: default;
    }

    .cutline {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: visible;
    }

    .dashes {
        stroke: rgba(255, 255, 255, 0.85);
        stroke-width: 1.4;
        stroke-dasharray: 5 4;
        vector-effect: non-scaling-stroke;
    }

    .progress {
        stroke: #fff;
        stroke-width: 3;
        stroke-linecap: round;
        vector-effect: non-scaling-stroke;
        filter: drop-shadow(0 0 4px #fff) drop-shadow(0 0 8px var(--c));
    }

    .scissors {
        position: absolute;
        left: 1%;
        transform: translateY(-58%);
        font-size: calc(var(--w) * 0.07);
        color: #fff;
        text-shadow: 0 0 6px rgba(0, 0, 0, 0.8);
        pointer-events: none;
    }

    /* Une étincelle parcourt le pointillé pour montrer le geste. */
    .guide {
        position: absolute;
        left: 8%;
        width: 10px;
        height: 10px;
        margin: -5px 0 0 -5px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 0 10px 3px #fff;
        animation: guide 1.8s ease-in-out infinite;
        pointer-events: none;
    }

    .flashline {
        position: absolute;
        left: 0;
        right: 0;
        height: 3px;
        margin-top: -1.5px;
        background: #fff;
        box-shadow:
            0 0 12px 4px #fff,
            0 0 30px 8px var(--c);
        animation: flashline 0.6s ease-out forwards;
        pointer-events: none;
    }

    /* La lumière des cartes par l'ouverture, en attendant qu'elles sortent. */
    .glow {
        position: absolute;
        left: 8%;
        right: 8%;
        height: 9%;
        border-radius: 50%;
        background: radial-gradient(closest-side, rgba(255, 255, 255, 0.9), transparent);
        opacity: 0.4;
        pointer-events: none;
    }

    .glow.waiting {
        animation: glow 1.2s ease-in-out infinite alternate;
    }

    .hint {
        min-height: 1.4em;
        font-size: 0.85rem;
        color: var(--muted);
        text-align: center;
    }

    .hint.hidden {
        visibility: hidden;
    }

    @keyframes guide {
        0% {
            left: 8%;
            opacity: 0;
        }
        15% {
            opacity: 1;
        }
        85% {
            opacity: 1;
        }
        100% {
            left: 97%;
            opacity: 0;
        }
    }

    @keyframes flashline {
        to {
            opacity: 0;
            transform: scaleY(4);
        }
    }

    @keyframes glow {
        from {
            opacity: 0.25;
        }
        to {
            opacity: 0.85;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .guide {
            animation: none;
        }
    }
</style>
