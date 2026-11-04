<script lang="ts">
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { bridge, maze } from "$lib/flux/maze";
    import { HALF_GIANT_COLOR, RACES, type Race } from "$lib/flux/races";

    // Les trois portails : Humains et Géants côte à côte, reliés par la lueur d'un possible
    // demi-géant ; les Éternelles à part. Choisir un portail dévoile une phrase par-dessus les
    // portes ; le franchir ouvre ses deux battants, et on plonge dans la lumière.
    // Les portes ne portent pas le nom de leur peuple : leurs phrases sont les seuls indices.
    let {
        onChoose,
        doorTitle,
    }: {
        onChoose: (race: Race) => void;
        /** Bulle au survol des portes (le secret, voir secret.ts). */
        doorTitle?: string;
    } = $props();

    // Durées de l'ouverture des battants, puis de l'entrée dans le portail (ms).
    const OPEN_MS = 900;
    const ENTER_MS = 750;

    // Repère du labyrinthe autour d'un portail : la porte occupe le centre.
    const VIEW = { width: 260, height: 200 };
    const DOOR = { x: 80, y: 40, w: 100, h: 120 };

    let selected = $state<Race | null>(null);
    let opening = $state(false);
    let entering = $state(false);

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    async function cross() {
        const race = selected;
        if (!race || opening) return;
        opening = true;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return onChoose(race);
        await wait(OPEN_MS);
        entering = true;
        await wait(ENTER_MS);
        onChoose(race);
    }

    const focusOnMount = (el: HTMLElement) => el.focus();
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
    <div
        class="portal {race.id}"
        class:selected={isSelected}
        class:dimmed={selected && !isSelected}
        class:open={isSelected && opening}
        class:entering={isSelected && entering}
        style="--c: {race.color};"
    >
        <!-- La porte et son labyrinthe : c'est ce cadre qui grandit quand on entre. -->
        <div class="frame">
            <svg class="maze" viewBox="0 0 {VIEW.width} {VIEW.height}" aria-hidden="true">
                {#each mazes[race.id] ?? [] as d, i (i)}
                    <path class="trace" {d} />
                    <path class="pulse" {d} pathLength="100" style="animation-delay: {delay(i)};" />
                {/each}
            </svg>

            <button
                class="door"
                aria-label="Portail : {race.motto}"
                title={doorTitle}
                aria-pressed={isSelected}
                disabled={opening}
                onclick={() => (selected = isSelected ? null : race)}
            >
                <!-- Derrière les battants : la lumière de l'autre côté. -->
                <span class="inside" aria-hidden="true"></span>
                {#each ["left", "right"] as side (side)}
                    <span class="leaf {side}" aria-hidden="true">
                        <!-- Chaque battant porte sa moitié de la même façade. -->
                        <span class="face">
                            <span class="swirl"></span>
                            <span class="emblem" class:pair={race.symbols.length > 1}>
                                {#each race.symbols as symbol (symbol)}
                                    <span class="symbol" style="--icon: url('{symbol}');"></span>
                                {/each}
                            </span>
                        </span>
                    </span>
                {/each}
            </button>
        </div>
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
        <div class="duo">
            {@render portal(RACES[0])}
            <div class="bridge" class:dimmed={selected}>
                {@render link(bridges.across, false)}
                {@render link(bridges.down, true)}
            </div>
            {@render portal(RACES[1])}
        </div>
        {@render portal(RACES[2])}
    </div>

    <p class="hint muted" class:hidden={selected}>Choisis le portail de ton peuple.</p>
</section>

<svelte:window onkeydown={(e) => e.key === "Escape" && !opening && (selected = null)} />

<!-- La phrase du portail, par-dessus les portes. -->
{#if selected && !opening}
    <!-- Fond et phrase s'effacent ensemble quand on franchit le portail. -->
    <div class="dialog-layer" transition:fade={{ duration: 200 }}>
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="backdrop" onclick={() => (selected = null)}></div>
        {#key selected.id}
            <div
                class="reveal"
                role="dialog"
                aria-modal="true"
                aria-label="Portail des {selected.name}s"
                style="--c: {selected.color};"
                in:fly={{ y: 16, duration: 350 }}
            >
                <span class="reveal-name">{selected.name}</span>
                <p>{selected.reveal}</p>
                <div class="actions">
                    <button class="btn" onclick={() => (selected = null)}>Revenir en arrière</button>
                    <button class="btn go" use:focusOnMount onclick={cross}>Franchir le portail</button>
                </div>
            </div>
        {/key}
    </div>
{/if}

<style>
    /* Tout tient sur un écran : la taille des portes suit la hauteur disponible. */
    .portals {
        --door-h: clamp(8rem, calc(100svh - 23rem), 19rem);
        --door-w: calc(var(--door-h) * 0.632);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: clamp(0.6rem, 2.5svh, 2rem);
        width: 100%;
        padding: clamp(0.5rem, 3svh, 2rem) 0 0;
        /* Les labyrinthes débordent des portails : c'est la page (main) qui les rogne. */
    }

    .row {
        display: flex;
        align-items: flex-start;
        justify-content: center;
        gap: clamp(2rem, 8vw, 7rem);
        width: 100%;
    }

    .duo {
        display: flex;
        align-items: flex-start;
    }

    .portal {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: clamp(0.5rem, 2svh, 1rem);
        width: var(--door-w);
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

    .frame {
        position: relative;
        width: var(--door-w);
    }

    /* On entre : la porte grandit autour de son centre jusqu'à remplir l'écran. */
    .portal.entering {
        z-index: 5;
    }

    .portal.entering .frame {
        transform: scale(9);
        transition: transform 0.75s cubic-bezier(0.6, 0, 0.9, 0.5);
    }

    /* Une seule couche, agrandie telle quelle : ni ombres ni filtres recalculés à 9 fois la taille. */
    .portal.open .frame {
        will-change: transform;
    }

    .portal.open .motto {
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .portal.entering .maze,
    .portal.entering .leaf {
        display: none;
    }

    .portal.entering .door {
        box-shadow: none;
    }

    .maze {
        position: absolute;
        top: calc(var(--door-w) * -0.208);
        left: 50%;
        width: calc(var(--door-w) * 2.6);
        height: calc(var(--door-w) * 2);
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
        display: block;
        width: 100%;
        height: var(--door-h);
        padding: 0;
        overflow: hidden;
        color: var(--foreground);
        border: 2px solid var(--c);
        border-radius: calc(var(--door-w) / 2) calc(var(--door-w) / 2) var(--radius) var(--radius);
        background: #000;
        box-shadow: 0 0 14px color-mix(in srgb, var(--c) 70%, transparent);
        /* Profondeur des battants qui pivotent vers l'intérieur. */
        perspective: 42rem;
        transition:
            box-shadow 0.4s ease,
            transform 0.3s ease;
    }

    .door:disabled {
        cursor: default;
    }

    .door:hover,
    .door:focus-visible,
    .selected .door {
        box-shadow: 0 0 28px var(--c);
    }

    .inside {
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at 50% 55%, #fff 0%, color-mix(in srgb, var(--c) 80%, #fff) 22%, var(--c) 45%, #050507 100%);
        opacity: 0.35;
        transition: opacity 0.9s ease;
    }

    .open .inside {
        opacity: 1;
    }

    .leaf {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 50%;
        overflow: hidden;
        backface-visibility: hidden;
        transition: transform 0.9s cubic-bezier(0.55, 0.05, 0.3, 1);
    }

    .leaf.left {
        left: 0;
        transform-origin: left center;
        box-shadow: inset -1px 0 0 color-mix(in srgb, var(--c) 55%, transparent);
    }

    .leaf.right {
        right: 0;
        transform-origin: right center;
        box-shadow: inset 1px 0 0 color-mix(in srgb, var(--c) 55%, transparent);
    }

    .open .leaf.left {
        transform: rotateY(100deg);
    }

    .open .leaf.right {
        transform: rotateY(-100deg);
    }

    /* La façade entière, dont chaque battant ne montre que sa moitié. */
    .face {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 200%;
        overflow: hidden;
        background:
            radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--c) 35%, transparent), transparent 70%),
            rgb(10, 10, 12);
        box-shadow: inset 0 0 22px color-mix(in srgb, var(--c) 40%, transparent);
        transition: box-shadow 0.4s ease;
    }

    .left .face {
        left: 0;
    }

    .right .face {
        right: 0;
    }

    .door:hover .face,
    .door:focus-visible .face,
    .selected .face {
        box-shadow: inset 0 0 40px color-mix(in srgb, var(--c) 60%, transparent);
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

    /* Le symbole du peuple, en grand et en filigrane, sur toute la porte. */
    .emblem {
        position: absolute;
        inset: 2.6rem 0.75rem 1.2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .symbol {
        width: 88%;
        aspect-ratio: 1;
        flex-shrink: 1;
        min-height: 0;
        background-color: var(--c);
        mask: var(--icon) center / contain no-repeat;
        opacity: 0.2;
        filter: drop-shadow(0 0 6px var(--c));
        transition: opacity 0.4s ease;
    }

    /* Deux symboles l'un sur l'autre : chacun prend la moitié de la hauteur libre. */
    .emblem.pair .symbol {
        width: min(88%, calc((var(--door-h) - 3.8rem) / 2));
    }

    .door:hover .symbol,
    .door:focus-visible .symbol,
    .selected .symbol {
        opacity: 0.32;
    }

    .motto {
        font-family: var(--titleFont);
        font-size: clamp(0.8rem, 2.2svh, 1rem);
        line-height: 1.35;
        text-align: center;
        color: rgba(255, 255, 255, 0.8);
        /* Lisible par-dessus les traits du labyrinthe. */
        text-shadow: 0 0 6px #000, 0 0 2px #000;
    }

    /* Lueur entre Humains et Géants. */
    .bridge {
        align-self: flex-start;
        width: calc(var(--door-w) * 0.5);
        height: calc(var(--door-h) * 0.16);
        margin-top: calc(var(--door-h) * 0.42);
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

    .hint {
        transition: opacity 0.3s ease;
    }

    .hint.hidden {
        opacity: 0;
    }

    .dialog-layer {
        position: fixed;
        inset: 0;
        z-index: 20;
    }

    .backdrop {
        position: fixed;
        inset: 0;
        z-index: 20;
        background: rgba(4, 4, 6, 0.65);
    }

    .reveal {
        position: fixed;
        top: 50%;
        left: 50%;
        z-index: 21;
        translate: -50% -50%;
        width: min(34rem, calc(100vw - 2rem));
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.2rem;
        padding: 1.4rem 1.6rem;
        text-align: center;
        border: 1px solid var(--c);
        border-radius: var(--radius);
        background: rgba(12, 12, 14, 0.92);
        box-shadow: 0 0 24px color-mix(in srgb, var(--c) 35%, transparent);
    }

    .reveal-name {
        font-family: var(--titleFont);
        font-size: 0.8rem;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: var(--c);
        text-shadow: 0 0 10px var(--c);
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

    /* Téléphone : les trois portes en diagonale, chaque phrase dans l'espace laissé libre. La
       lueur des demi-géants relie en biais les Humains (en haut) aux Géants (au milieu). */
    @media (max-width: 860px) {
        .portals {
            --door-h: clamp(5rem, calc((100svh - 17rem) / 3 - 0.8rem), 11rem);
            --row-gap: clamp(0.4rem, 2svh, 1.2rem);
        }

        .row {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            column-gap: 0.75rem;
            row-gap: var(--row-gap);
            position: relative;
            width: 100%;
        }

        .duo {
            display: contents;
        }

        .portal {
            width: auto;
            flex-direction: row;
            align-items: center;
            gap: 0.9rem;
        }

        .portal.humain {
            grid-area: 1 / 1 / 2 / 4;
        }

        .portal.geant {
            grid-area: 2 / 2 / 3 / 4;
        }

        .portal.eternelle {
            grid-area: 3 / 1 / 4 / 4;
            flex-direction: row-reverse;
        }

        .frame {
            flex: none;
        }

        .motto {
            flex: 1;
            min-width: 0;
            text-align: left;
            font-size: clamp(0.72rem, 1.9svh, 0.9rem);
        }

        .eternelle .motto {
            text-align: right;
        }

        /* Part du centre de la porte des Humains vers celui des Géants. */
        .bridge {
            --dy: calc(var(--door-h) + var(--row-gap));
            position: absolute;
            top: calc(var(--door-h) / 2);
            left: calc(var(--door-w) / 2 - 1.2rem);
            z-index: -1;
            width: 2.4rem;
            height: hypot(calc((100vw - 2rem) / 3 + 0.25rem), var(--dy));
            margin: 0;
            transform-origin: 50% 0;
            rotate: calc(-1 * atan2(calc((100vw - 2rem) / 3 + 0.25rem), var(--dy)));
        }

        .link {
            display: none;
        }

        .link.vertical {
            display: block;
        }

        /* Les phrases à côté des portes suffisent. */
        .hint {
            display: none;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .pulse,
        .swirl {
            animation: none;
        }

        .leaf,
        .inside {
            transition: none;
        }
    }
</style>
