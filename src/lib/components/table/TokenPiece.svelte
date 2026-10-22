<script lang="ts">
    import type { TokenView } from "$lib/table/types";
    import { gaugeRatio } from "./gauges";

    let {
        token,
        x,
        y,
        cell,
        size: cells = token.size,
        selected = false,
        active = false,
        dragging = false,
        draggable = false,
        resizable = false,
        onpointerdown,
        onresizedown,
    }: {
        token: TokenView;
        x: number;
        y: number;
        cell: number;
        /** Taille affichée, en cases (aperçu pendant un redimensionnement). */
        size?: number;
        selected?: boolean;
        active?: boolean;
        dragging?: boolean;
        draggable?: boolean;
        /** Coin de redimensionnement visible (MJ, jeton sélectionné). */
        resizable?: boolean;
        onpointerdown?: (e: PointerEvent) => void;
        onresizedown?: (e: PointerEvent) => void;
    } = $props();

    let size = $derived(cells * cell);
    let hp = $derived(gaugeRatio(token.pv));
    let down = $derived(hp !== null && hp <= 0);
    let initials = $derived(
        token.name
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
    );
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="token side-{token.side}"
    class:selected
    class:active
    class:dragging
    class:draggable
    class:hidden={token.hidden}
    class:down
    class:mine={token.mine}
    class:masked={token.nameHidden}
    style="left: {x}px; top: {y}px; width: {size}px; height: {size}px;"
    {onpointerdown}
    title={token.name}
>
    <div class="disc">
        {#if token.image}
            <img src={token.image} alt="" draggable="false" />
        {:else}
            <span class="initials">{initials}</span>
        {/if}
    </div>
    {#if hp !== null}
        <div class="hp" aria-hidden="true">
            <span style="width: {Math.max(0, hp) * 100}%"></span>
        </div>
    {/if}
    <span class="name">{token.name}</span>
    {#if resizable}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span class="resize" title="Tirer pour changer la taille ({cells}×{cells})" onpointerdown={onresizedown}></span>
    {/if}
</div>

<style>
    .token {
        position: absolute;
        z-index: 6;
        padding: 4px;
        box-sizing: border-box;
        transition:
            left 0.2s ease-out,
            top 0.2s ease-out;
        --ring: var(--muted);
    }

    .token.dragging {
        transition: none;
        z-index: 20;
        opacity: 0.85;
    }

    .token.draggable {
        cursor: grab;
    }

    .side-ally {
        --ring: var(--primary);
    }

    .side-enemy {
        --ring: var(--danger);
    }

    .side-neutral {
        --ring: var(--secondary);
    }

    .disc {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        overflow: hidden;
        border: 3px solid var(--ring);
        background-color: var(--surface-raised);
        box-sizing: border-box;
        display: grid;
        place-items: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
    }

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        pointer-events: none;
    }

    .initials {
        font-family: var(--titleFont);
        font-size: 1.1rem;
    }

    .mine .disc {
        border-style: double;
        border-width: 5px;
    }

    .selected .disc {
        outline: 3px solid var(--accent);
        outline-offset: 2px;
    }

    .active .disc {
        box-shadow:
            0 0 0 4px rgba(229, 184, 204, 0.4),
            0 0 18px 6px var(--accent);
    }

    .hidden {
        opacity: 0.5;
    }

    .hidden .disc {
        border-style: dashed;
    }

    .down .disc {
        filter: grayscale(1) brightness(0.6);
    }

    /* Nom caché aux joueurs : le MJ le voit barré d'un trait discret. */
    .masked .name {
        font-style: italic;
        text-decoration: line-through;
        text-decoration-color: var(--accent);
    }

    .resize {
        position: absolute;
        right: -6px;
        bottom: -6px;
        width: 16px;
        height: 16px;
        border-radius: 3px;
        background-color: var(--accent);
        border: 2px solid var(--background);
        cursor: nwse-resize;
        touch-action: none;
        z-index: 2;
    }

    .hp {
        position: absolute;
        left: 12%;
        right: 12%;
        bottom: 0;
        height: 6px;
        border-radius: 3px;
        background-color: rgba(0, 0, 0, 0.7);
        overflow: hidden;
    }

    .hp span {
        display: block;
        height: 100%;
        background-color: #6fbf73;
    }

    .side-enemy .hp span {
        background-color: var(--danger);
    }

    .name {
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-top: 2px;
        padding: 0 0.35rem;
        border-radius: var(--radius);
        background-color: rgba(0, 0, 0, 0.7);
        font-size: 0.7rem;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s;
    }

    .token:hover .name,
    .selected .name,
    .active .name {
        opacity: 1;
    }

    @media (prefers-reduced-motion: reduce) {
        .token {
            transition: none;
        }
    }
</style>
