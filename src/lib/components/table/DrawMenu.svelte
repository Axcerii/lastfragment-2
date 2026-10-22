<script lang="ts">
    // Dessin à main levée sur le plateau : bouton crayon et petit menu en dessous
    // (couleur, épaisseur, gomme, effacer). Tout le monde dessine ; le MJ peut tout effacer.
    import { DRAW_COLORS, DRAW_WIDTHS } from "$lib/table/types";
    import type { DrawTool } from "./Board.svelte";

    let {
        isAdmin,
        tool = $bindable(),
        onundo,
        onclear,
    }: {
        isAdmin: boolean;
        tool: DrawTool;
        /** Retire son dernier trait. */
        onundo: () => void;
        /** Efface ses traits, ou tous (`all`, MJ). */
        onclear: (all: boolean) => void;
    } = $props();

    let open = $state(false);
    let color = $state<string>(DRAW_COLORS[0]);
    let width = $state<number>(DRAW_WIDTHS[1]);
    let menu: HTMLElement | undefined = $state();

    export function toggleMenu() {
        open = !open;
    }

    /** Crayon (P) : active avec la couleur et l'épaisseur choisies, ou range l'outil. */
    export function togglePen() {
        tool = tool?.mode === "draw" ? null : { mode: "draw", color, width };
    }

    /** Gomme (E). */
    export function toggleEraser() {
        tool = tool?.mode === "erase" ? null : { mode: "erase" };
    }


    function pick(next: { color?: string; width?: number }) {
        if (next.color) color = next.color;
        if (next.width) width = next.width;
        tool = { mode: "draw", color, width };
    }


    function onWindowDown(e: PointerEvent) {
        if (open && menu && !menu.contains(e.target as Node)) open = false;
    }
</script>

<svelte:window onpointerdown={onWindowDown} />

<div class="draw" bind:this={menu}>
    <button
        class="trigger"
        class:active={tool !== null}
        onclick={toggleMenu}
        aria-expanded={open}
        aria-label="Dessiner sur le plateau"
        title="Dessin (P : crayon, E : gomme)"
    >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            {#if tool?.mode === "erase"}
                <path d="M16 3 21 8 10 19H5l-2-2L16 3Z M8 12l5 5" />
            {:else}
                <path d="M3 21l3.5-1 12-12-2.5-2.5-12 12L3 21Z M14.5 5.5 17 8" />
            {/if}
        </svg>
        {#if tool?.mode === "draw"}<span class="dot" style="background-color: {tool.color}"></span>{/if}
    </button>

    {#if open}
        <div class="menu" role="dialog" aria-label="Dessin">
            <div class="modes" role="radiogroup" aria-label="Outil">
                <button class="chip" class:on={tool?.mode === "draw"} onclick={togglePen}>Crayon <kbd>P</kbd></button>
                <button class="chip" class:on={tool?.mode === "erase"} onclick={toggleEraser}>Gomme <kbd>E</kbd></button>
            </div>

            <div class="colors" role="radiogroup" aria-label="Couleur">
                {#each DRAW_COLORS as c (c)}
                    <button
                        class="color"
                        class:on={color === c}
                        style="background-color: {c}"
                        aria-label="Couleur {c}"
                        onclick={() => pick({ color: c })}
                    ></button>
                {/each}
                <input type="color" value={color} aria-label="Autre couleur" onchange={(e) => pick({ color: e.currentTarget.value })} />
            </div>

            <div class="widths" role="radiogroup" aria-label="Épaisseur">
                {#each DRAW_WIDTHS as w (w)}
                    <button class="chip" class:on={width === w} onclick={() => pick({ width: w })} aria-label="Épaisseur {w}">
                        <span class="line" style="height: {Math.max(2, w / 2)}px"></span>
                    </button>
                {/each}
            </div>

            <div class="actions">
                <button class="btn btn-small" onclick={onundo}>Annuler mon dernier trait <kbd>Ctrl+Z</kbd></button>
                <button class="btn btn-small" onclick={() => onclear(false)}>Effacer mes dessins</button>
                {#if isAdmin}
                    <button class="btn btn-small btn-danger" onclick={() => onclear(true)}>Tout effacer (MJ)</button>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .draw {
        position: relative;
        pointer-events: auto;
    }

    .trigger {
        position: relative;
        display: grid;
        place-items: center;
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        border: 1px solid var(--Artrish);
        background-color: rgba(20, 20, 20, 0.88);
        transition: var(--transition);
    }

    .trigger svg {
        fill: none;
        stroke: var(--Artrish);
        stroke-width: 1.8;
        stroke-linejoin: round;
        stroke-linecap: round;
    }

    .trigger:hover,
    .trigger.active {
        background-color: rgba(255, 255, 255, 0.14);
    }

    .trigger.active {
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
    }

    .dot {
        position: absolute;
        right: 2px;
        bottom: 2px;
        width: 0.7rem;
        height: 0.7rem;
        border-radius: 50%;
        border: 2px solid var(--background);
    }

    .menu {
        position: absolute;
        top: calc(100% + 0.5rem);
        left: 0;
        z-index: 45;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        width: 17rem;
        padding: 0.8rem;
        background-color: var(--surface);
        border: 1px solid var(--Artrish);
        border-radius: var(--radius);
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.6);
        font-size: 0.85rem;
    }

    .modes,
    .colors,
    .widths,
    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        align-items: center;
    }

    .actions {
        flex-direction: column;
        align-items: stretch;
    }

    .actions .btn {
        justify-content: space-between;
    }

    .chip {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        min-height: 30px;
        padding: 0 0.6rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: none;
        color: var(--foreground);
    }

    .chip.on {
        background-color: var(--Artrish);
        border-color: var(--Artrish);
        color: var(--background);
    }

    .widths .chip {
        width: 3rem;
        justify-content: center;
    }

    .line {
        display: block;
        width: 100%;
        border-radius: 999px;
        background-color: currentColor;
    }

    .color {
        width: 1.6rem;
        height: 1.6rem;
        border-radius: 50%;
        border: 2px solid var(--border);
        padding: 0;
    }

    .color.on {
        border-color: var(--foreground);
        box-shadow: 0 0 0 2px var(--Artrish);
    }

    input[type="color"] {
        width: 2rem;
        height: 1.8rem;
        padding: 0;
        border-radius: var(--radius);
    }

    kbd {
        font-family: monospace;
        font-size: 0.75rem;
        padding: 0 0.3rem;
        border: 1px solid var(--border);
        border-radius: 3px;
        opacity: 0.8;
    }
</style>
