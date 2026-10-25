<script lang="ts">
    // Ouverture « cristal », gardée de côté : trois coups (ou un glissé du doigt d'un bord à
    // l'autre) fissurent le cristal puis le brisent. Pour la choisir : intro="cristal" sur
    // BoosterOpening.
    import { shatter } from "$lib/cards/patterns";
    import { vibrate } from "./feedback";

    let {
        pack,
        ready,
        error = null,
        best = 1,
        onopened,
    }: {
        pack: { name: string; code: string; color: string; banner: string | null };
        /** Les cartes sont arrivées du serveur. */
        ready: boolean;
        error?: string | null;
        /** Rareté la plus haute du booster : couleur de l'éclair. */
        best?: number;
        onopened: () => void;
    } = $props();

    let cracks = $state(0);
    let burst = $state(false);
    let burstDone = $state(false);

    const seed = Math.floor(Math.random() * 1_000_000);
    const shards = shatter(seed, 9, [20, 44], [50, 46]).map((shard) => {
        const cx = shard.points.reduce((s, p) => s + p[0], 0) / shard.points.length;
        const cy = shard.points.reduce((s, p) => s + p[1], 0) / shard.points.length;
        const angle = Math.atan2(cy - 46, cx - 50);
        const distance = 60 + Math.random() * 90;
        return {
            clip: `polygon(${shard.points.map(([x, y]) => `${x}% ${y}%`).join(", ")})`,
            outline: shard.points.map((p) => p.join(",")).join(" "),
            tx: Math.cos(angle) * distance,
            ty: Math.sin(angle) * distance + 30,
            rot: (Math.random() - 0.5) * 140,
            delay: Math.random() * 0.08,
        };
    });
    const sparks = Array.from({ length: 26 }, () => ({
        angle: Math.random() * Math.PI * 2,
        distance: 30 + Math.random() * 70,
        size: 0.3 + Math.random() * 0.7,
        delay: Math.random() * 0.2,
    }));

    function hit() {
        if (burst || error) return;
        cracks++;
        vibrate(cracks >= 3 ? 50 : 15);
        if (cracks >= 3) shatterNow();
    }

    function shatterNow() {
        burst = true;
        setTimeout(() => (burstDone = true), 950);
    }

    $effect(() => {
        if (burstDone && ready) onopened();
    });

    let swipe: { x: number; width: number } | null = null;

    function onpointerdown(e: PointerEvent) {
        const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
        swipe = { x: e.clientX, width: box.width };
    }

    function onpointermove(e: PointerEvent) {
        if (!swipe || burst || error) return;
        // Un geste franc à travers le cristal le brise d'un coup.
        if (Math.abs(e.clientX - swipe.x) > swipe.width * 0.75) {
            swipe = null;
            cracks = 3;
            vibrate(50);
            shatterNow();
        }
    }

    function onkeydown(e: KeyboardEvent) {
        if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            hit();
        }
    }
</script>

<svelte:window {onkeydown} />

<div class="intro" style="--pack: {pack.color}; --best: var(--rarity-{best})">
    <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
    <div
        class="crystal cracks-{cracks}"
        onclick={hit}
        {onpointerdown}
        {onpointermove}
        onpointerup={() => (swipe = null)}
    >
        {#if !burst}
            <div class="shape">
                {#if pack.banner}<img src={pack.banner} alt="" />{/if}
                <div class="facets"></div>
                <div class="sheen"></div>
                <span class="title"><strong>{pack.name}</strong><small>{pack.code}</small></span>
                <svg class="crack-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    {#each shards as shard, i (i)}
                        {#if i % 3 < cracks}<polygon points={shard.outline} />{/if}
                    {/each}
                </svg>
            </div>
        {:else}
            {#each shards as shard, i (i)}
                <div class="shard" style="clip-path: {shard.clip}; --tx: {shard.tx}%; --ty: {shard.ty}%; --rot: {shard.rot}deg; --delay: {shard.delay}s">
                    <div class="shape">
                        {#if pack.banner}<img src={pack.banner} alt="" />{/if}
                        <div class="facets"></div>
                    </div>
                </div>
            {/each}
            <div class="flash"></div>
            {#each sparks as spark, i (i)}
                <i
                    class="spark"
                    style="--x: {Math.cos(spark.angle) * spark.distance}vmin; --y: {Math.sin(spark.angle) * spark.distance}vmin; --s: {spark.size}; --delay: {spark.delay}s"
                ></i>
            {/each}
        {/if}
    </div>
    <p class="hint" aria-live="polite">
        {#if burstDone && !ready}
            Les fragments se rassemblent…
        {:else if !burst}
            Touche le cristal pour le briser · ou glisse d’un bord à l’autre
        {/if}
    </p>
</div>

<style>
    .intro {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    .hint {
        min-height: 1.4em;
        font-size: 0.85rem;
        color: var(--muted);
        text-align: center;
    }

    .crystal {
        position: relative;
        width: min(62vw, 270px, 42dvh);
        aspect-ratio: 5 / 8;
        cursor: pointer;
        touch-action: none;
        animation: float 3.2s ease-in-out infinite;
        filter: drop-shadow(0 0 2rem color-mix(in srgb, var(--pack) 60%, transparent));
    }

    .cracks-1 {
        animation:
            float 3.2s ease-in-out infinite,
            shake 0.25s ease-out;
    }

    .cracks-2 {
        animation:
            float 3.2s ease-in-out infinite,
            shake 0.3s ease-out;
        filter: drop-shadow(0 0 3rem color-mix(in srgb, var(--pack) 80%, #fff));
    }

    .shape {
        position: absolute;
        inset: 0;
        clip-path: polygon(50% 0, 100% 17%, 100% 83%, 50% 100%, 0 83%, 0 17%);
        background: linear-gradient(
            160deg,
            color-mix(in srgb, var(--pack) 70%, #fff),
            var(--pack) 45%,
            color-mix(in srgb, var(--pack) 35%, #000)
        );
        overflow: hidden;
    }

    .shape img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.85;
        mix-blend-mode: luminosity;
    }

    .facets {
        position: absolute;
        inset: 0;
        background:
            linear-gradient(118deg, rgba(255, 255, 255, 0.35) 0 22%, transparent 22% 100%),
            linear-gradient(62deg, transparent 0 60%, rgba(255, 255, 255, 0.18) 60% 78%, transparent 78%),
            linear-gradient(180deg, transparent 0 48%, rgba(0, 0, 0, 0.25) 48% 52%, transparent 52%),
            linear-gradient(90deg, rgba(0, 0, 0, 0.3), transparent 25%, transparent 75%, rgba(0, 0, 0, 0.35));
        mix-blend-mode: overlay;
    }

    .sheen {
        position: absolute;
        inset: -50%;
        background: linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.55) 50%, transparent 60%);
        animation: sheen 3s ease-in-out infinite;
    }

    .title {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 22%;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        color: #fff;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
        padding: 0 12%;
    }

    .title strong {
        font-family: var(--titleFont);
        font-size: clamp(1.1rem, 5vw, 1.6rem);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        line-height: 1.1;
    }

    .title small {
        font-size: 0.75rem;
        letter-spacing: 0.3em;
        opacity: 0.85;
    }

    .crack-lines {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
    }

    .crack-lines polygon {
        fill: rgba(255, 255, 255, 0.06);
        stroke: #fff;
        stroke-width: 0.6;
        vector-effect: non-scaling-stroke;
        stroke-dasharray: 400;
        stroke-dashoffset: 400;
        animation: crack 0.35s ease-out forwards;
        filter: drop-shadow(0 0 2px #fff);
    }

    .shard {
        position: absolute;
        inset: 0;
        animation: fly 0.9s cubic-bezier(0.15, 0.7, 0.3, 1) var(--delay) forwards;
    }

    .flash {
        position: absolute;
        inset: -60%;
        border-radius: 50%;
        background: radial-gradient(circle, #fff 0%, var(--best) 30%, transparent 65%);
        animation: flash 0.9s ease-out forwards;
        pointer-events: none;
    }

    .spark {
        position: absolute;
        left: 50%;
        top: 46%;
        width: calc(var(--s) * 0.9rem);
        height: calc(var(--s) * 0.9rem);
        background: color-mix(in srgb, var(--best) 60%, #fff);
        clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
        animation: spark 1s ease-out var(--delay) forwards;
        opacity: 0;
    }

    @keyframes float {
        50% {
            transform: translateY(-10px) rotate(-1deg);
        }
    }

    @keyframes shake {
        25% {
            translate: -4px 1px;
        }
        50% {
            translate: 3px -2px;
        }
        75% {
            translate: -2px 2px;
        }
    }

    @keyframes sheen {
        from {
            transform: translateX(-40%);
        }
        to {
            transform: translateX(40%);
        }
    }

    @keyframes crack {
        to {
            stroke-dashoffset: 0;
        }
    }

    @keyframes fly {
        to {
            transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(0.6);
            opacity: 0;
        }
    }

    @keyframes flash {
        0% {
            opacity: 0;
            transform: scale(0.2);
        }
        15% {
            opacity: 1;
        }
        100% {
            opacity: 0;
            transform: scale(1.4);
        }
    }

    @keyframes spark {
        0% {
            opacity: 1;
            transform: translate(-50%, -50%);
        }
        100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) rotate(180deg);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .crystal,
        .sheen {
            animation: none !important;
        }
    }
</style>
