<script lang="ts">
    // Un paquet de booster en volume : face avant illustrée et bombée, dos imprimé, tranches qui
    // s'amincissent vers les bords sertis, ombre portée au sol. Au repos il pivote doucement sur
    // lui-même (le reflet suit sa rotation) ; avec `follow`, il s'incline vers le doigt.
    // Découpé (`split`), il se sépare en deux au niveau du pointillé : la bande du haut et le corps.
    import type { Snippet } from "svelte";
    import type { PackView } from "$lib/cards/types";

    let {
        pack,
        title,
        code,
        count = 5,
        width = "200px",
        idle = true,
        follow = false,
        angle = 0,
        delay = 0,
        split = false,
        stripGone = false,
        bodyGone = false,
        dir = 1,
        cut = 11,
        overlay,
    }: {
        pack: PackView;
        /** Nom de la série, en grand sur le paquet. */
        title: string;
        code: string;
        count?: number;
        /** Largeur CSS du paquet. */
        width?: string;
        /** Rotation lente au repos. */
        idle?: boolean;
        /** S'incline vers la souris ou le doigt. */
        follow?: boolean;
        /** Angle fixe (degrés) quand il ne pivote pas : il montre alors sa tranche. */
        angle?: number;
        /** Décalage de la rotation au repos (s), pour que plusieurs paquets ne bougent pas ensemble. */
        delay?: number;
        split?: boolean;
        stripGone?: boolean;
        bodyGone?: boolean;
        /** Sens dans lequel la bande découpée s'envole (1 ou -1). */
        dir?: number;
        /** Hauteur du pointillé, en % du paquet. */
        cut?: number;
        /** Posé sur la face avant (pointillé, découpe). */
        overlay?: Snippet;
    } = $props();

    // ─── Contours : bords sertis en dents de scie, découpe en zigzag ───
    const TEETH = 18;
    const CRIMP = 24;
    const pts = (list: number[][]) => list.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(", ");
    let cutEdge = $derived(Array.from({ length: TEETH + 1 }, (_, i) => [(i / TEETH) * 100, cut + (i % 2 ? 0.6 : -0.6)]));
    const topEdge = Array.from({ length: CRIMP + 1 }, (_, i) => [(i / CRIMP) * 100, i % 2 ? 0 : 0.9]);
    const bottomEdge = Array.from({ length: CRIMP + 1 }, (_, i) => [100 - (i / CRIMP) * 100, i % 2 ? 100 : 99.1]);
    const fullClip = `polygon(${pts([...topEdge, ...bottomEdge])})`;
    let stripClip = $derived(`polygon(${pts([...topEdge, ...[...cutEdge].reverse()])})`);
    let bodyClip = $derived(`polygon(${pts([...cutEdge, ...bottomEdge])})`);

    // Tranches : pleines au milieu, nulles aux bords sertis (le paquet y est pincé).
    const PINCH = 6;
    const sideFull = `polygon(50% 0, 100% ${PINCH}%, 100% ${100 - PINCH}%, 50% 100%, 0 ${100 - PINCH}%, 0 ${PINCH}%)`;
    let sideTop = $derived(`polygon(50% 0, 100% ${(PINCH / cut) * 100}%, 100% 100%, 0 100%, 0 ${(PINCH / cut) * 100}%)`);
    let sideBottom = $derived(
        `polygon(0 0, 100% 0, 100% ${((100 - PINCH - cut) / (100 - cut)) * 100}%, 50% 100%, 0 ${((100 - PINCH - cut) / (100 - cut)) * 100}%)`,
    );

    let variant = $derived(pack.name !== title ? pack.name : "");

    // ─── Inclinaison vers le doigt ───
    let el: HTMLDivElement | undefined = $state();

    function onpointermove(e: PointerEvent) {
        if (!follow || !el) return;
        const box = el.getBoundingClientRect();
        el.style.setProperty("--px", (((e.clientX - box.left) / box.width) * 100).toFixed(1));
        el.style.setProperty("--py", (((e.clientY - box.top) / box.height) * 100).toFixed(1));
    }

    function onpointerleave() {
        el?.style.removeProperty("--px");
        el?.style.removeProperty("--py");
    }
</script>

{#snippet front()}
    {#if pack.image}
        <!-- Le design du MJ couvre toute la face ; le site n'ajoute que le volume et les reflets
             (l'aluminium dessous ne se voit qu'à travers les zones transparentes). -->
        <div class="foil"></div>
        <img class="artwork" src={pack.image} alt="" loading="lazy" decoding="async" />
    {:else}
        <div class="foil"></div>
        <div class="crimp top"></div>
        <div class="crimp bottom"></div>
        <div class="window">
            {#if pack.banner}
                <img src={pack.banner} alt="" loading="lazy" decoding="async" />
            {:else}
                <div class="emblem"><img src="/layout/Logo.svg" alt="" /></div>
            {/if}
        </div>
    {/if}
    {#if pack.showText || !pack.image}
        <div class="brand">
            <img src="/layout/Logo.svg" alt="" />
            <span>Last Fragment</span>
        </div>
        <div class="label">
            <strong>{title}</strong>
            {#if variant}<em>{variant}</em>{/if}
            <small>{code} · Booster · {count} cartes</small>
        </div>
    {/if}
    <div class="wrinkles"></div>
    <div class="pillow"></div>
    <div class="sheen"></div>
{/snippet}

{#snippet back()}
    <div class="foil dark"></div>
    <div class="crimp top"></div>
    <div class="crimp bottom"></div>
    <div class="back-text">
        <img src="/layout/Logo.svg" alt="" />
        <strong>Last Fragment</strong>
        <span>Cartes à collectionner</span>
        <small>Ce paquet contient {count} cartes tirées au hasard.<br />La dernière est au moins Rare.</small>
        <i class="barcode"></i>
    </div>
    <div class="pillow"></div>
{/snippet}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    bind:this={el}
    class="model"
    class:idle
    style="--w: {width}; --c: {pack.color}; --dir: {dir}; --angle: {angle}deg; --delay: {-delay}s"
    {onpointermove}
    {onpointerleave}
>
    <div class="shadow"></div>
    <div class="turntable">
        <div class="box">
            {#if !split}
                <div class="face front" style="clip-path: {fullClip}">
                    {@render front()}
                    {@render overlay?.()}
                </div>
                <div class="face back" style="clip-path: {fullClip}">{@render back()}</div>
                <div class="side left" style="clip-path: {sideFull}"></div>
                <div class="side right" style="clip-path: {sideFull}"></div>
            {:else}
                <div class="group strip" class:gone={stripGone}>
                    <div class="face front" style="clip-path: {stripClip}">{@render front()}</div>
                    <div class="face back" style="clip-path: {stripClip}">{@render back()}</div>
                    <div class="side left top" style="clip-path: {sideTop}; height: {cut}%"></div>
                    <div class="side right top" style="clip-path: {sideTop}; height: {cut}%"></div>
                </div>
                <div class="group body" class:gone={bodyGone}>
                    <div class="face front" style="clip-path: {bodyClip}">
                        {@render front()}
                        {@render overlay?.()}
                    </div>
                    <div class="face back" style="clip-path: {bodyClip}">{@render back()}</div>
                    <div class="side left bottom" style="clip-path: {sideBottom}; top: {cut}%; height: {100 - cut}%"></div>
                    <div class="side right bottom" style="clip-path: {sideBottom}; top: {cut}%; height: {100 - cut}%"></div>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .model {
        --px: 50;
        --py: 50;
        --t: calc(var(--w) * 0.09);
        position: relative;
        width: var(--w);
        aspect-ratio: 1 / 1.62;
        perspective: calc(var(--w) * 5);
    }

    /* ─── Volume ──────────────────────────────────────────────── */

    .turntable,
    .box,
    .group {
        position: absolute;
        inset: 0;
        transform-style: preserve-3d;
    }

    .turntable {
        transform: rotateY(var(--angle));
    }

    .idle .turntable {
        animation: idle 7s ease-in-out var(--delay) infinite;
    }

    .box {
        transform: rotateX(calc((50 - var(--py)) * 0.22deg)) rotateY(calc((var(--px) - 50) * 0.5deg));
        transition: transform 0.25s ease-out;
    }

    .face {
        position: absolute;
        inset: 0;
        overflow: hidden;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
    }

    .front {
        transform: translateZ(calc(var(--t) / 2));
    }

    .back {
        transform: rotateY(180deg) translateZ(calc(var(--t) / 2));
    }

    .side {
        position: absolute;
        top: 0;
        height: 100%;
        left: calc(50% - var(--t) / 2);
        width: var(--t);
        background:
            repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0 3px, transparent 3px 9px),
            linear-gradient(90deg, color-mix(in srgb, var(--c) 30%, #000), color-mix(in srgb, var(--c) 55%, #000) 50%, color-mix(in srgb, var(--c) 30%, #000));
    }

    .side.left {
        transform: rotateY(-90deg) translateZ(calc(var(--w) / 2));
    }

    .side.right {
        transform: rotateY(90deg) translateZ(calc(var(--w) / 2));
    }

    /* Ombre au sol : elle s'étire et pâlit quand le paquet monte. */
    .shadow {
        position: absolute;
        left: 12%;
        right: 12%;
        bottom: -7%;
        height: 7%;
        border-radius: 50%;
        background: radial-gradient(closest-side, rgba(0, 0, 0, 0.6), transparent);
        filter: blur(3px);
    }

    .idle .shadow {
        animation: shadow 7s ease-in-out var(--delay) infinite;
    }

    /* ─── Le paquet ───────────────────────────────────────────── */

    .foil {
        position: absolute;
        inset: 0;
        background:
            repeating-linear-gradient(-55deg, rgba(255, 255, 255, 0.07) 0 2px, transparent 2px 7px),
            linear-gradient(
                115deg,
                color-mix(in srgb, var(--c) 35%, #000) 0%,
                var(--c) 22%,
                color-mix(in srgb, var(--c) 45%, #fff) 42%,
                var(--c) 58%,
                color-mix(in srgb, var(--c) 30%, #000) 100%
            );
        background-size:
            auto,
            220% 100%;
        background-position:
            0 0,
            calc(var(--px) * 1% + var(--idle) * 25%) 0;
    }

    .foil.dark {
        background:
            repeating-linear-gradient(-55deg, rgba(255, 255, 255, 0.05) 0 2px, transparent 2px 7px),
            linear-gradient(160deg, color-mix(in srgb, var(--c) 45%, #000), color-mix(in srgb, var(--c) 20%, #000));
    }

    .crimp {
        position: absolute;
        left: 0;
        right: 0;
        height: 4.5%;
        background:
            repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.35) 0 1.5px, rgba(0, 0, 0, 0.28) 1.5px 3px),
            color-mix(in srgb, var(--c) 55%, #000);
    }

    .crimp.top {
        top: 0;
    }

    .crimp.bottom {
        bottom: 0;
    }

    .brand {
        position: absolute;
        top: 14%;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: calc(var(--w) * 0.03);
        color: #fff;
        font-family: var(--titleFont);
        font-size: calc(var(--w) * 0.055);
        letter-spacing: 0.25em;
        text-transform: uppercase;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
        white-space: nowrap;
    }

    .brand img {
        width: calc(var(--w) * 0.09);
        filter: brightness(0) invert(1) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.6));
    }

    .window {
        position: absolute;
        top: 24%;
        left: 9%;
        right: 9%;
        bottom: 27%;
        border-radius: calc(var(--w) * 0.025);
        overflow: hidden;
        border: calc(var(--w) * 0.008) solid rgba(255, 255, 255, 0.75);
        box-shadow:
            inset 0 0 calc(var(--w) * 0.08) rgba(0, 0, 0, 0.5),
            0 calc(var(--w) * 0.02) calc(var(--w) * 0.05) rgba(0, 0, 0, 0.35);
        background: radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--c) 60%, #fff), color-mix(in srgb, var(--c) 30%, #000));
    }

    .artwork {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .window > img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .emblem {
        width: 100%;
        height: 100%;
        display: grid;
        place-items: center;
    }

    .emblem img {
        width: 55%;
        opacity: 0.85;
        filter: brightness(0) invert(1);
    }

    .label {
        position: absolute;
        left: 6%;
        right: 6%;
        bottom: 7.5%;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        color: #fff;
        text-shadow: 0 2px 6px rgba(0, 0, 0, 0.7);
    }

    .label strong {
        font-family: var(--titleFont);
        font-size: calc(var(--w) * 0.08);
        line-height: 1.05;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .label em {
        font-family: var(--titleFont);
        font-size: calc(var(--w) * 0.055);
        opacity: 0.95;
    }

    .label small {
        margin-top: calc(var(--w) * 0.02);
        font-size: calc(var(--w) * 0.038);
        letter-spacing: 0.2em;
        text-transform: uppercase;
        opacity: 0.9;
    }

    /* Plis de l'aluminium près des bords sertis. */
    .wrinkles {
        position: absolute;
        inset: 0;
        background:
            repeating-linear-gradient(97deg, transparent 0 calc(var(--w) * 0.03), rgba(255, 255, 255, 0.14) calc(var(--w) * 0.03) calc(var(--w) * 0.034), transparent calc(var(--w) * 0.034) calc(var(--w) * 0.07)),
            repeating-linear-gradient(83deg, transparent 0 calc(var(--w) * 0.05), rgba(0, 0, 0, 0.16) calc(var(--w) * 0.05) calc(var(--w) * 0.055), transparent calc(var(--w) * 0.055) calc(var(--w) * 0.09));
        -webkit-mask-image: linear-gradient(180deg, transparent 4%, #000 5%, transparent 13%, transparent 87%, #000 95%, transparent 96%);
        mask-image: linear-gradient(180deg, transparent 4%, #000 5%, transparent 13%, transparent 87%, #000 95%, transparent 96%);
    }

    /* Bombé : bords assombris, milieu éclairé, comme un paquet gonflé d'air. */
    .pillow {
        position: absolute;
        inset: 0;
        background:
            linear-gradient(90deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0) 14%, rgba(255, 255, 255, 0.1) 50%, rgba(0, 0, 0, 0) 86%, rgba(0, 0, 0, 0.5) 100%),
            linear-gradient(180deg, transparent 4.5%, rgba(0, 0, 0, 0.22) 5%, rgba(255, 255, 255, 0.1) 10%, transparent 24%, transparent 84%, rgba(0, 0, 0, 0.28) 95%, transparent 95.5%);
        pointer-events: none;
    }

    .sheen {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            105deg,
            transparent calc(var(--px) * 1% - var(--idle) * 30% - 22%),
            rgba(255, 255, 255, 0.5) calc(var(--px) * 1% - var(--idle) * 30%),
            transparent calc(var(--px) * 1% - var(--idle) * 30% + 22%)
        );
        mix-blend-mode: overlay;
        pointer-events: none;
    }

    .back-text {
        position: absolute;
        inset: 14% 10%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: calc(var(--w) * 0.025);
        text-align: center;
        color: rgba(255, 255, 255, 0.85);
    }

    .back-text img {
        width: 34%;
        filter: brightness(0) invert(1);
        opacity: 0.8;
    }

    .back-text strong {
        font-family: var(--titleFont);
        font-size: calc(var(--w) * 0.08);
        letter-spacing: 0.15em;
        text-transform: uppercase;
    }

    .back-text span {
        font-size: calc(var(--w) * 0.05);
    }

    .back-text small {
        font-size: calc(var(--w) * 0.038);
        opacity: 0.75;
    }

    .barcode {
        width: 55%;
        height: calc(var(--w) * 0.1);
        margin-top: calc(var(--w) * 0.04);
        background:
            repeating-linear-gradient(90deg, #111 0 2px, #fff 2px 3px, #111 3px 4px, #fff 4px 7px, #111 7px 10px, #fff 10px 11px),
            #fff;
        border: calc(var(--w) * 0.012) solid #fff;
    }

    /* ─── Découpe ─────────────────────────────────────────────── */

    .group.strip.gone {
        animation: strip-off 0.7s cubic-bezier(0.3, 0.6, 0.4, 1) forwards;
    }

    .group.body.gone {
        animation: drop 0.85s cubic-bezier(0.55, 0, 0.8, 0.35) forwards;
    }

    @keyframes idle {
        0%,
        100% {
            --idle: -1;
            translate: 0 0;
        }
        50% {
            --idle: 1;
            translate: 0 calc(var(--w) * -0.04);
        }
    }

    .idle .turntable {
        transform: rotateY(calc(var(--angle) + var(--idle) * 16deg)) rotateZ(calc(var(--idle) * -1.5deg));
    }

    @keyframes shadow {
        0%,
        100% {
            transform: scaleX(1);
            opacity: 1;
        }
        50% {
            transform: scaleX(0.85);
            opacity: 0.7;
        }
    }

    @keyframes strip-off {
        to {
            transform: translate3d(calc(var(--dir) * 45%), -70%, 0) rotate(calc(var(--dir) * 24deg));
            opacity: 0;
        }
    }

    @keyframes drop {
        to {
            transform: translateY(95%) rotate(3deg);
            opacity: 0;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .idle .turntable,
        .idle .shadow {
            animation: none;
        }
    }
</style>
