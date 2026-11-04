<script lang="ts">
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";
    import Bar from "$lib/components/ui/Bar.svelte";
    import { POTENTIAL_AXES, potential, revealFlux, type FluxResult } from "$lib/flux/quiz";
    import type { Race } from "$lib/flux/races";
    import {
        COMBAT_STATS,
        CONSO_STATS,
        SOCIAL_STATS,
        STAT_KEYS,
        STATS,
        barPercent,
        totalPower,
        type StatBlock,
    } from "$lib/game/stats";

    // Fin du test : le flux révélé, le dragon qui l'a béni et ses mots.
    let {
        result,
        race,
        onRetry,
        onMap,
    }: { result: FluxResult; race: Race | null; onRetry: () => void; onMap: () => void } = $props();

    let flux = $derived(revealFlux(result));

    // Shizari a la couleur du fond du site : on l'éclaircit pour qu'il se lise.
    const DRAGON_COLOR: Record<string, string> = { Shizari: "#bdbdbd", Chaos: "#ff3b3b" };
    const toneOf = (dragon: string) => DRAGON_COLOR[dragon] ?? `var(--${dragon})`;
    let tone = $derived(toneOf(flux.dragon));
    let secondTone = $derived(toneOf(result.chaos ? "Chaos" : result.second));

    // Certificat : les stats défilent au hasard (comme dans la V1), puis se figent sur les vraies.
    const ROLL_DELAY = 2600;
    const ROLL_MS = 4000;
    let rolling = $state<StatBlock | null>(null);
    let shown = $derived(rolling ?? result.stats);
    let settled = $state(false);
    // Le pentagone se déploie depuis son centre une fois les stats figées.
    let grow = $state(0);

    onMount(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            settled = true;
            grow = 1;
            return;
        }
        const random = () =>
            Object.fromEntries(
                STAT_KEYS.map((k) => [k, (20 + Math.floor(Math.random() * 41)) * STATS[k].scale]),
            ) as StatBlock;
        rolling = random();
        let roll = 0;
        let frame = 0;
        const start = setTimeout(() => {
            roll = window.setInterval(() => (rolling = random()), 50);
        }, ROLL_DELAY);
        const stop = setTimeout(() => {
            clearInterval(roll);
            rolling = null;
            settled = true;
            const from = performance.now();
            const step = (now: number) => {
                const t = Math.min(1, (now - from) / 1100);
                grow = 1 - Math.pow(1 - t, 3);
                if (t < 1) frame = requestAnimationFrame(step);
            };
            frame = requestAnimationFrame(step);
        }, ROLL_DELAY + ROLL_MS);
        return () => {
            clearTimeout(start);
            clearTimeout(stop);
            clearInterval(roll);
            cancelAnimationFrame(frame);
        };
    });

    const GROUPS = [
        { title: "Consommables", stats: CONSO_STATS },
        { title: "Combat", stats: COMBAT_STATS },
        { title: "Hors-combat", stats: SOCIAL_STATS },
    ];

    // Pentagone (V1) : Leader en haut, puis dans le sens horaire. Le Chaos déborde du cadre.
    let axes = $derived(potential(result.stats));
    const vertex = (i: number, radius: number) => {
        const a = ((72 * i - 90) * Math.PI) / 180;
        return [50 + Math.cos(a) * radius, 50 + Math.sin(a) * radius];
    };
    let shape = $derived(
        POTENTIAL_AXES.map((axis, i) => vertex(i, (50 * Math.min(axes[axis], 160) * grow) / 100).join(",")).join(" "),
    );
    const ring = (level: number) => POTENTIAL_AXES.map((_, i) => vertex(i, 50 * level).join(",")).join(" ");
</script>

<article class="result" style="--d: {tone};">
    <blockquote in:fade={{ duration: 1400 }}>
        <p>« {flux.quote} »</p>
        <cite>— {flux.dragon}</cite>
    </blockquote>

    <div class="card" in:fly={{ y: 24, duration: 800, delay: 1200 }}>
        {#if flux.dragon !== "Chaos"}
            <span class="emblem" style="--icon: url('/icones/dragons/{flux.dragon}.svg');" aria-hidden="true"></span>
        {/if}
        <p class="blessing">
            {#if race}{race.name} · {/if}Bénédiction de <strong>{flux.dragon}</strong>
        </p>
        <h2>{flux.name}</h2>
        <p class="description">{flux.description}</p>
        {#if race?.resultNote}
            <p class="note">{race.resultNote}</p>
        {/if}
        {#if flux.names.length}
            <p class="names"><span class="muted">Prénoms possibles :</span> {flux.names.join(", ")}</p>
        {/if}
    </div>

    <section class="certificate" in:fly={{ y: 24, duration: 800, delay: 2200 }} aria-label="Certificat de flux">
        <div class="potential">
            <h3>Potentiel</h3>
            <svg viewBox="-14 -10 128 122" style="--first: {tone}; --second: {secondTone};" role="img" aria-label={POTENTIAL_AXES.map((a) => `${a} ${axes[a]}`).join(", ")}>
                {#each [0.25, 0.5, 0.75, 1] as level (level)}
                    <polygon class="grid" points={ring(level)} />
                {/each}
                {#each POTENTIAL_AXES as _, i (i)}
                    {@const [x, y] = vertex(i, 50)}
                    <line class="grid" x1="50" y1="50" x2={x} y2={y} />
                {/each}
                <polygon class="shape" points={shape} />
                {#each POTENTIAL_AXES as axis, i (axis)}
                    {@const [x, y] = vertex(i, 60)}
                    <text {x} y={y + 1.5} class:dim={!settled}>
                        {axis}
                        {#if settled}<tspan class="score" x={x} dy="6">{axes[axis]}</tspan>{/if}
                    </text>
                {/each}
            </svg>
        </div>

        <div class="stats">
            {#each GROUPS as group (group.title)}
                <div class="group">
                    <h3>{group.title}</h3>
                    {#each group.stats as stat (stat)}
                        <div class="row" class:settled>
                            <span class="label">{STATS[stat].barLabel ?? STATS[stat].label}</span>
                            <span class="value">{shown[stat]}</span>
                            <Bar
                                label={STATS[stat].label}
                                valueText={String(shown[stat])}
                                value={barPercent(stat, shown[stat])}
                                color="var(--{STATS[stat].dragon})"
                                icon={STATS[stat].icon ?? `/dragons/normal/${STATS[stat].dragon}.svg`}
                                height="16px"
                            />
                        </div>
                    {/each}
                </div>
            {/each}
            <p class="power" class:settled>
                Puissance totale : <strong>{settled ? totalPower(result.stats) : "…"}</strong>
            </p>
        </div>
    </section>

    <div class="actions" in:fade={{ delay: 2600 }}>
        <button class="btn" onclick={onRetry}>Refaire le test</button>
        <button class="btn" onclick={onMap}>Revoir la carte</button>
    </div>
</article>

<style>
    .result {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        width: min(100%, 56rem);
        margin: 0 auto;
        padding: 2rem 0 1rem;
        text-align: center;
    }

    blockquote {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        font-family: var(--titleFont);
    }

    blockquote p {
        font-size: clamp(1.5rem, 4vw, 2.2rem);
        font-style: italic;
        line-height: 1.25;
        color: var(--d);
        text-shadow: 0 0 18px color-mix(in srgb, var(--d) 50%, transparent);
    }

    cite {
        font-size: 1rem;
        color: var(--muted);
    }

    .card {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.9rem;
        width: 100%;
        padding: 2rem 1.5rem 1.6rem;
        border: 1px solid var(--d);
        border-radius: var(--radius);
        background: rgba(12, 12, 14, 0.92);
        box-shadow: 0 0 30px color-mix(in srgb, var(--d) 25%, transparent);
        overflow: hidden;
    }

    .emblem {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 16rem;
        height: 16rem;
        transform: translate(-50%, -50%);
        background-color: var(--d);
        mask: var(--icon) center / contain no-repeat;
        opacity: 0.08;
        pointer-events: none;
    }

    .blessing {
        position: relative;
        font-size: 0.9rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
    }

    .blessing strong {
        color: var(--d);
    }

    h2 {
        position: relative;
        font-size: clamp(2rem, 6vw, 3rem);
        color: var(--foreground);
    }

    .description,
    .note,
    .names {
        position: relative;
        line-height: 1.45;
    }

    .description {
        font-family: var(--titleFont);
        font-size: 1.15rem;
    }

    .note {
        font-style: italic;
        color: var(--secondary);
    }

    .names {
        font-size: 0.9rem;
    }

    .certificate {
        display: grid;
        grid-template-columns: minmax(14rem, 18rem) minmax(0, 1fr);
        gap: 2rem;
        align-items: center;
        width: 100%;
        padding: 1.6rem;
        text-align: left;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: var(--radius);
        background: rgba(12, 12, 14, 0.92);
    }

    .certificate h3 {
        font-size: 0.85rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--muted);
    }

    .potential {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    .potential svg {
        width: 100%;
        overflow: visible;
    }

    .grid {
        fill: none;
        stroke: rgba(255, 255, 255, 0.14);
        stroke-width: 0.4;
    }

    .shape {
        fill: var(--first);
        fill-opacity: 0.6;
        stroke: var(--second);
        stroke-width: 1.2;
        stroke-linejoin: round;
        filter: drop-shadow(0 0 3px var(--second));
    }

    text {
        font-family: var(--titleFont);
        font-size: 5.5px;
        text-anchor: middle;
        fill: var(--foreground);
        transition: opacity 0.4s ease;
    }

    text.dim {
        opacity: 0.4;
    }

    .score {
        font-size: 5px;
        fill: var(--secondary);
    }

    .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
        gap: 1rem 1.5rem;
    }

    .group {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.15rem 0.5rem;
        font-size: 0.85rem;
    }

    .row :global(.bar) {
        grid-column: 1 / -1;
    }

    .value {
        font-variant-numeric: tabular-nums;
        color: var(--muted);
        transition: color 0.4s ease;
    }

    .row.settled .value {
        color: var(--foreground);
    }

    .power {
        grid-column: 1 / -1;
        text-align: center;
        font-family: var(--titleFont);
        font-size: 1.2rem;
    }

    .power.settled strong {
        color: var(--secondary);
    }

    @media (max-width: 720px) {
        .certificate {
            grid-template-columns: 1fr;
            padding: 1.2rem;
        }

        .potential svg {
            width: min(100%, 18rem);
        }
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.75rem;
    }
</style>
