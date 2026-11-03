<script lang="ts">
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { bridge, maze } from "$lib/flux/maze";
    import { HALF_GIANT_COLOR, RACES, type Race } from "$lib/flux/races";

    // Les trois portails : Humains et Géants côte à côte, reliés par la lueur d'un possible
    // demi-géant ; les Éternelles à part. Choisir un portail dévoile une phrase, puis le test.
    let { onChoose }: { onChoose: (race: Race) => void } = $props();

    // Repère du labyrinthe autour d'un portail : la porte occupe le centre.
    const VIEW = { width: 260, height: 200 };
    const DOOR = { x: 80, y: 40, w: 100, h: 120 };

    let selected = $state<Race | null>(null);
    let mazes = $state<Record<string, string[]>>({});
    let bridges = $state<{ across: string[]; down: string[] }>({ across: [], down: [] });

    // Tirés dans le navigateur, à chaque visite.
    onMount(() => {
        const edge = (random: () => number) => {
            const side = Math.floor(random() * 4);
            const t = random();
            if (side === 0) return { x: DOOR.x + t * DOOR.w, y: DOOR.y };
            if (side === 1) return { x: DOOR.x + t * DOOR.w, y: DOOR.y + DOOR.h };
            if (side === 2) return { x: DOOR.x, y: DOOR.y + t * DOOR.h };
            return { x: DOOR.x + DOOR.w, y: DOOR.y + t * DOOR.h };
        };
        for (const race of RACES)
            mazes[race.id] = maze({ ...VIEW, step: 8, walks: 16, turns: [4, 10], start: edge, avoid: DOOR });
        bridges = { across: bridge(120, 48, 8, 5), down: bridge(80, 48, 8, 5, true) };
    });

    const delay = (i: number) => `${(i * 0.37) % 3}s`;
</script>

{#snippet portal(race: Race)}
    {@const isSelected = selected?.id === race.id}
    <div class="portal" class:selected={isSelected} class:dimmed={selected && !isSelected} style="--c: {race.color};">
        <svg class="maze" viewBox="0 0 {VIEW.width} {VIEW.height}" aria-hidden="true">
            {#each mazes[race.id] ?? [] as d, i (i)}
                <path class="trace" {d} />
                <path class="pulse" {d} pathLength="100" style="animation-delay: {delay(i)};" />
            {/each}
        </svg>

        <button
            class="door"
            aria-label="Portail des {race.name}s"
            aria-pressed={isSelected}
            onclick={() => (selected = isSelected ? null : race)}
        >
            <span class="swirl" aria-hidden="true"></span>
            <span class="symbols" aria-hidden="true">
                {#each race.symbols as symbol (symbol)}
                    <span class="symbol" style="--icon: url('{symbol}');"></span>
                {/each}
            </span>
            <span class="name">{race.name}</span>
        </button>
        <p class="motto">{race.motto}</p>
    </div>
{/snippet}

{#snippet link(paths: string[], vertical: boolean)}
    <svg
        class="link"
        class:vertical
        viewBox={vertical ? "0 0 48 80" : "0 0 120 48"}
        preserveAspectRatio="none"
        aria-hidden="true"
    >
        <defs>
            <linearGradient id="half-giant-{vertical ? 'v' : 'h'}" x1="0" y1="0" x2={vertical ? 0 : 1} y2={vertical ? 1 : 0}>
                <stop offset="0" stop-color={RACES[0].color} />
                <stop offset="0.5" stop-color={HALF_GIANT_COLOR} />
                <stop offset="1" stop-color={RACES[1].color} />
            </linearGradient>
        </defs>
        {#each paths as d, i (i)}
            <path class="trace" {d} stroke="url(#half-giant-{vertical ? 'v' : 'h'})" />
            <path class="pulse" {d} pathLength="100" stroke={HALF_GIANT_COLOR} style="animation-delay: {delay(i)};" />
        {/each}
    </svg>
{/snippet}

<section class="portals">
    <div class="row">
        <div class="pair">
            {@render portal(RACES[0])}
            <div class="bridge" class:dimmed={selected}>
                {@render link(bridges.across, false)}
                {@render link(bridges.down, true)}
            </div>
            {@render portal(RACES[1])}
        </div>
        {@render portal(RACES[2])}
    </div>

    {#if selected}
        {#key selected.id}
            <div class="reveal" style="--c: {selected.color};" in:fly={{ y: 16, duration: 450 }} out:fade={{ duration: 150 }}>
                <p>{selected.reveal}</p>
                <div class="actions">
                    <button class="btn" onclick={() => (selected = null)}>Revenir en arrière</button>
                    <button class="btn go" onclick={() => onChoose(selected!)}>Franchir le portail</button>
                </div>
            </div>
        {/key}
    {:else}
        <p class="hint muted" in:fade>Choisis le portail de ton peuple.</p>
    {/if}
</section>

<style>
    .portals {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        width: 100%;
        padding: 2rem 0 1rem;
        /* Les labyrinthes débordent des portails, jamais de la page. */
        overflow-x: clip;
    }

    .row {
        display: flex;
        align-items: flex-start;
        justify-content: center;
        gap: clamp(2rem, 8vw, 7rem);
        width: 100%;
    }

    .pair {
        display: flex;
        align-items: flex-start;
    }

    .portal {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        width: 12rem;
        transition:
            opacity 0.5s ease,
            filter 0.5s ease,
            transform 0.5s ease;
    }

    .portal.dimmed {
        opacity: 0.25;
        filter: blur(1px) grayscale(0.6);
    }

    .portal.selected {
        transform: scale(1.04);
    }

    .maze {
        position: absolute;
        top: -2.5rem;
        left: 50%;
        width: 31.2rem;
        height: 24rem;
        transform: translateX(-50%);
        overflow: visible;
        pointer-events: none;
        z-index: -1;
        filter: drop-shadow(0 0 3px var(--c));
    }

    .trace,
    .pulse {
        fill: none;
        stroke-linecap: square;
        stroke-linejoin: miter;
    }

    .maze .trace {
        stroke: var(--c);
        stroke-width: 0.8;
        opacity: 0.22;
    }

    .maze .pulse {
        stroke: var(--c);
    }

    .pulse {
        stroke-width: 1.2;
        stroke-dasharray: 12 88;
        animation: current 3.2s linear infinite;
        opacity: 0.85;
    }

    .door {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 0.8rem;
        width: 100%;
        height: 19rem;
        padding: 2.2rem 1rem 1rem;
        overflow: hidden;
        color: var(--foreground);
        border: 2px solid var(--c);
        border-radius: 6rem 6rem var(--radius) var(--radius);
        background:
            radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--c) 35%, transparent), transparent 70%),
            rgba(10, 10, 12, 0.92);
        box-shadow:
            0 0 14px color-mix(in srgb, var(--c) 70%, transparent),
            inset 0 0 22px color-mix(in srgb, var(--c) 40%, transparent);
        transition:
            box-shadow 0.4s ease,
            transform 0.3s ease;
    }

    .door:hover,
    .door:focus-visible,
    .selected .door {
        box-shadow:
            0 0 28px var(--c),
            inset 0 0 40px color-mix(in srgb, var(--c) 60%, transparent);
    }

    .swirl {
        position: absolute;
        inset: 30% -40% -40%;
        background: conic-gradient(
            from 0deg,
            transparent,
            color-mix(in srgb, var(--c) 25%, transparent),
            transparent 30%,
            color-mix(in srgb, var(--c) 18%, transparent) 55%,
            transparent 70%
        );
        filter: blur(14px);
        animation: spin 14s linear infinite;
        pointer-events: none;
    }

    .selected .swirl {
        animation-duration: 4s;
    }

    .symbols {
        position: relative;
        display: flex;
        gap: 0.6rem;
    }

    .symbol {
        width: 3.4rem;
        height: 3.4rem;
        background-color: var(--c);
        mask: var(--icon) center / contain no-repeat;
    }

    .name {
        position: relative;
        font-family: var(--titleFont);
        font-size: 1.6rem;
        color: var(--c);
        text-shadow: 0 0 10px var(--c);
    }

    .motto {
        font-family: var(--titleFont);
        font-size: 1rem;
        line-height: 1.35;
        text-align: center;
        color: rgba(255, 255, 255, 0.8);
        /* Lisible par-dessus les traits du labyrinthe. */
        text-shadow: 0 0 6px #000, 0 0 2px #000;
    }

    /* Lueur entre Humains et Géants. */
    .bridge {
        align-self: flex-start;
        width: 6rem;
        height: 3rem;
        margin-top: 8rem;
        transition: opacity 0.5s ease;
        filter: drop-shadow(0 0 3px var(--half, #a9d8ff));
    }

    .bridge.dimmed {
        opacity: 0.3;
    }

    .link {
        width: 100%;
        height: 100%;
        overflow: visible;
    }

    .link .trace,
    .link .pulse {
        vector-effect: non-scaling-stroke;
    }

    .link .trace {
        stroke-width: 1.5;
        opacity: 0.7;
    }

    .link .pulse {
        stroke-width: 2;
    }

    .link.vertical {
        display: none;
    }

    .reveal {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.2rem;
        max-width: 34rem;
        padding: 1.4rem 1.6rem;
        text-align: center;
        border: 1px solid var(--c);
        border-radius: var(--radius);
        background: rgba(12, 12, 14, 0.92);
        box-shadow: 0 0 24px color-mix(in srgb, var(--c) 35%, transparent);
    }

    .reveal p {
        font-family: var(--titleFont);
        font-size: 1.3rem;
        line-height: 1.4;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.75rem;
    }

    .btn.go {
        border-color: var(--c);
        box-shadow: 0 0 10px color-mix(in srgb, var(--c) 50%, transparent);
    }

    .btn.go:hover {
        background-color: var(--c);
        color: var(--background);
    }

    @keyframes current {
        to {
            stroke-dashoffset: -100;
        }
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    /* Téléphone : les portails s'empilent, la lueur relie Humains et Géants de haut en bas. */
    @media (max-width: 860px) {
        .row,
        .pair {
            flex-direction: column;
            align-items: center;
        }

        .row {
            gap: 4rem;
        }

        .bridge {
            align-self: center;
            width: 3rem;
            height: 5rem;
            margin: 0.5rem 0;
        }

        .link {
            display: none;
        }

        .link.vertical {
            display: block;
        }

        .door {
            height: 16rem;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .pulse,
        .swirl {
            animation: none;
        }
    }
</style>
