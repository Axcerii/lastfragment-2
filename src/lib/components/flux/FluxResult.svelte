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

    // Fin du test, sur un seul écran : la citation du dragon naît devant soi et se dissipe, puis
    // le certificat apparaît. Les stats défilent puis se figent, le potentiel se déploie, et le
    // flux ne se révèle qu'en dernier.
    let {
        result,
        race,
        intro = false,
        onRetry,
        onMap,
    }: {
        result: FluxResult;
        race: Race | null;
        /** Arrivée depuis le test : l'écran sort de la lumière du noyau. */
        intro?: boolean;
        onRetry: () => void;
        onMap: () => void;
    } = $props();

    let flux = $derived(revealFlux(result));

    // Shizari a la couleur du fond du site : on l'éclaircit pour qu'il se lise.
    const DRAGON_COLOR: Record<string, string> = { Shizari: "#bdbdbd", Chaos: "#ff3b3b" };
    const toneOf = (dragon: string) => DRAGON_COLOR[dragon] ?? `var(--${dragon})`;
    let tone = $derived(toneOf(flux.dragon));
    let secondTone = $derived(toneOf(result.chaos ? "Chaos" : result.second));

    // Citation (ms) : elle naît, reste lisible, puis se dissipe.
    const QUOTE_HOLD = 2800;
    const QUOTE_FADE = 1100;
    // Certificat : les stats défilent au hasard (comme dans la V1), puis se figent sur les vraies.
    const ROLL_DELAY = 900;
    const ROLL_MS = 4000;
    // Le flux se révèle une fois le pentagone déployé.
    const REVEAL_DELAY = 1300;

    let phase = $state<"quote" | "leaving" | "sheet">("quote");
    let rolling = $state<StatBlock | null>(null);
    let shown = $derived(rolling ?? result.stats);
    let settled = $state(false);
    let revealed = $state(false);
    // Le pentagone se déploie depuis son centre une fois les stats figées.
    let grow = $state(0);

    const timers: number[] = [];
    let roll = 0;
    let frame = 0;
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const randomStats = () =>
        Object.fromEntries(STAT_KEYS.map((k) => [k, (20 + Math.floor(Math.random() * 41)) * STATS[k].scale])) as StatBlock;

    function settle() {
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
        later(REVEAL_DELAY, () => (revealed = true));
    }

    function showSheet() {
        if (phase === "sheet") return;
        timers.forEach(clearTimeout);
        phase = "sheet";
        rolling = randomStats();
        later(ROLL_DELAY, () => (roll = window.setInterval(() => (rolling = randomStats()), 50)));
        later(ROLL_DELAY + ROLL_MS, settle);
    }

    // Un clic ou une touche passe la citation.
    function skip() {
        if (phase !== "sheet") showSheet();
    }

    onMount(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            phase = "sheet";
            settled = true;
            revealed = true;
            grow = 1;
            return;
        }
        later(QUOTE_HOLD, () => (phase = "leaving"));
        later(QUOTE_HOLD + QUOTE_FADE, showSheet);
        return () => {
            timers.forEach(clearTimeout);
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

<svelte:window onkeydown={skip} />

<article class="result" style="--d: {tone};">
    {#if phase !== "sheet"}
        <!-- Un clic sur la citation la passe (une touche aussi). -->
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="quote-stage" class:leaving={phase === "leaving"} out:fade={{ duration: 200 }} onclick={skip}>
            <blockquote>
                <p>« {flux.quote} »</p>
                <cite>{flux.dragon}</cite>
            </blockquote>
        </div>
    {:else}
        <div class="sheet">
            <div class="card" class:revealed in:fly={{ y: 20, duration: 700 }} aria-live="polite">
                <!-- Tant que les stats défilent, le flux reste voilé (le contenu garde sa place). -->
                {#if !revealed}
                    <p class="veiled" out:fade={{ duration: 400 }}>
                        <span class="orb" aria-hidden="true"></span>
                        Ton flux s'éveille…
                    </p>
                {/if}
                {#if flux.dragon !== "Chaos"}
                    <span class="emblem" style="--icon: url('/icones/dragons/{flux.dragon}.svg');" aria-hidden="true"></span>
                {/if}
                <p class="blessing">
                    {#if race}{race.name} · {/if}Bénédiction de <strong>{flux.dragon}</strong>
                </p>
                <h2>{flux.name}</h2>
                <p class="quote">« {flux.quote} »</p>
                <p class="description">{flux.description}</p>
                {#if race?.resultNote}
                    <p class="note">{race.resultNote}</p>
                {/if}
                {#if flux.names.length}
                    <p class="names"><span class="muted">Prénoms possibles :</span> {flux.names.join(", ")}</p>
                {/if}
            </div>

            <div class="potential" in:fly={{ y: 20, duration: 700, delay: 200 }}>
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
                <p class="power" class:settled>
                    Puissance totale <strong>{settled ? totalPower(result.stats) : "…"}</strong>
                </p>
            </div>

            <section class="stats" in:fly={{ y: 20, duration: 700, delay: 400 }} aria-label="Statistiques">
                {#each GROUPS as group (group.title)}
                    <div class="group">
                        <h3>{group.title}</h3>
                        {#each group.stats as stat (stat)}
                            <div class="row" class:settled>
                                <span class="label">{STATS[stat].barLabel ?? STATS[stat].label}</span>
                                <Bar
                                    label={STATS[stat].label}
                                    valueText={String(shown[stat])}
                                    value={barPercent(stat, shown[stat])}
                                    color="var(--{STATS[stat].dragon})"
                                    height="10px"
                                />
                                <span class="value">{shown[stat]}</span>
                            </div>
                        {/each}
                    </div>
                {/each}
            </section>

            <div class="actions" in:fade={{ delay: 700 }}>
                <button class="btn btn-small" onclick={onRetry}>Refaire le test</button>
                <button class="btn btn-small" onclick={onMap}>Revoir la carte</button>
            </div>
        </div>
    {/if}
</article>

{#if intro}
    <!-- On sort de la lumière du noyau. -->
    <div class="burst" style="--d: {tone};" aria-hidden="true"></div>
{/if}

<style>
    /* Tout tient sur un écran : la page ne défile pas (sauf écran vraiment trop petit). */
    .result {
        position: fixed;
        inset: 0;
        z-index: 2;
        display: flex;
        overflow-y: auto;
        padding: 3.5rem clamp(1rem, 3vw, 2.5rem) 1rem;
        box-sizing: border-box;
    }

    /* La citation naît devant soi, puis se dissipe en se dispersant. */
    .quote-stage {
        margin: auto;
        cursor: pointer;
        max-width: 48rem;
        text-align: center;
        animation: spawn 1.3s cubic-bezier(0.15, 0.7, 0.2, 1) backwards;
    }

    .quote-stage.leaving {
        opacity: 0;
        filter: blur(18px);
        scale: 1.35;
        letter-spacing: 0.25em;
        transition:
            opacity 1.1s ease-in,
            filter 1.1s ease-in,
            scale 1.1s cubic-bezier(0.5, 0, 0.9, 0.5),
            letter-spacing 1.1s ease-in;
    }

    @keyframes spawn {
        from {
            opacity: 0;
            scale: 0.55;
            filter: blur(14px);
        }
    }

    blockquote {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        font-family: var(--titleFont);
    }

    blockquote p {
        font-size: clamp(2rem, 5.5vw, 3.6rem);
        font-style: italic;
        line-height: 1.2;
        color: var(--d);
        text-shadow:
            0 0 24px color-mix(in srgb, var(--d) 60%, transparent),
            0 0 4px #000;
    }

    cite {
        font-size: 1.1rem;
        font-style: normal;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: var(--muted);
    }

    .burst {
        position: fixed;
        inset: 0;
        z-index: 3;
        background: radial-gradient(circle, #fff 0%, #fff 30%, color-mix(in srgb, var(--d, #fff) 40%, #fff) 70%);
        pointer-events: none;
        animation: burst 1.4s ease-out forwards;
    }

    @keyframes burst {
        to {
            opacity: 0;
        }
    }

    /* Le certificat : le flux et son potentiel en haut, les stats dessous. */
    .sheet {
        margin: auto;
        display: grid;
        grid-template-columns: minmax(0, 1.6fr) minmax(13rem, 1fr);
        grid-template-areas:
            "card potential"
            "stats stats"
            "actions actions";
        gap: clamp(0.8rem, 2svh, 1.4rem) 1.5rem;
        width: min(100%, 64rem);
    }

    .card,
    .potential,
    .stats {
        border-radius: var(--radius);
        background: rgba(12, 12, 14, 0.92);
    }

    .card {
        grid-area: card;
        position: relative;
        transition:
            border-color 1s ease,
            box-shadow 1s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: clamp(0.4rem, 1.2svh, 0.8rem);
        padding: clamp(1rem, 2.5svh, 1.6rem) 1.5rem;
        text-align: center;
        /* Neutre tant que le flux est voilé : sa couleur arrive avec lui. */
        border: 1px solid rgba(255, 255, 255, 0.12);
        overflow: hidden;
    }

    .card.revealed {
        border-color: var(--d);
        box-shadow: 0 0 30px color-mix(in srgb, var(--d) 25%, transparent);
    }

    /* Contenu du flux : invisible jusqu'à la révélation, puis il apparaît ligne à ligne. */
    .card > :not(.veiled) {
        opacity: 0;
        visibility: hidden;
    }

    .card.revealed > :not(.veiled) {
        visibility: visible;
        animation: rise 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
    }

    .card.revealed h2 {
        animation-delay: 0.1s;
    }

    .card.revealed .quote {
        animation-delay: 0.25s;
    }

    .card.revealed .description,
    .card.revealed .note,
    .card.revealed .names {
        animation-delay: 0.5s;
    }

    .card.revealed h2 {
        animation-name: rise, glow;
        animation-duration: 0.8s, 1.6s;
    }

    @keyframes rise {
        from {
            opacity: 0;
            translate: 0 0.6rem;
            filter: blur(6px);
        }
        to {
            opacity: 1;
        }
    }

    @keyframes glow {
        0% {
            text-shadow: 0 0 30px var(--d);
        }
        100% {
            text-shadow: none;
        }
    }

    .card.revealed > .emblem {
        animation-name: emblem;
    }

    @keyframes emblem {
        from {
            opacity: 0;
            scale: 0.6;
        }
        to {
            opacity: 0.08;
        }
    }

    .veiled {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        font-family: var(--titleFont);
        font-size: 1.1rem;
        font-style: italic;
        color: var(--muted);
    }

    .orb {
        width: 2.4rem;
        height: 2.4rem;
        border-radius: 50%;
        background: radial-gradient(circle, #fff 0%, var(--secondary) 35%, transparent 70%);
        animation: breathe 1.6s ease-in-out infinite alternate;
    }

    @keyframes breathe {
        from {
            scale: 0.7;
            opacity: 0.5;
        }
        to {
            scale: 1.15;
            opacity: 1;
        }
    }

    .emblem {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 15rem;
        height: 15rem;
        transform: translate(-50%, -50%);
        background-color: var(--d);
        mask: var(--icon) center / contain no-repeat;
        opacity: 0.08;
        pointer-events: none;
    }

    .blessing {
        position: relative;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
    }

    .blessing strong {
        color: var(--d);
    }

    h2 {
        position: relative;
        font-size: clamp(1.8rem, 5svh, 2.8rem);
        line-height: 1.1;
        color: var(--foreground);
    }

    .quote,
    .description,
    .note,
    .names {
        position: relative;
        line-height: 1.4;
    }

    .quote {
        font-family: var(--titleFont);
        font-style: italic;
        color: var(--d);
    }

    .description {
        font-family: var(--titleFont);
        font-size: clamp(0.95rem, 2.2svh, 1.1rem);
    }

    .note {
        font-size: 0.9rem;
        font-style: italic;
        color: var(--secondary);
    }

    .names {
        font-size: 0.85rem;
    }

    h3 {
        font-size: 0.75rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--muted);
    }

    .potential {
        grid-area: potential;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        padding: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.12);
    }

    .potential svg {
        width: 100%;
        max-height: min(17rem, 30svh);
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

    .power {
        font-family: var(--titleFont);
        font-size: 1.05rem;
    }

    .power strong {
        margin-left: 0.4rem;
        font-size: 1.3rem;
        font-weight: normal;
    }

    .power.settled strong {
        color: var(--secondary);
        text-shadow: 0 0 10px rgba(210, 182, 116, 0.5);
    }

    .stats {
        grid-area: stats;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.8rem 1.5rem;
        padding: 1rem 1.25rem;
        border: 1px solid rgba(255, 255, 255, 0.12);
    }

    .group {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }

    /* Une stat par ligne : nom, barre, valeur. */
    .row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) 2.4em;
        align-items: center;
        gap: 0.6rem;
        font-size: 0.8rem;
    }

    .label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .value {
        text-align: right;
    }

    .value {
        font-variant-numeric: tabular-nums;
        color: var(--muted);
        transition: color 0.4s ease;
    }

    .row.settled .value {
        color: var(--foreground);
    }

    .actions {
        grid-area: actions;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.75rem;
    }

    /* Téléphone et tablette en portrait : tout en colonne, stats sur deux colonnes. */
    @media (max-width: 760px) {
        .result {
            padding: 2.9rem 0.6rem 0.6rem;
        }

        .sheet {
            grid-template-columns: minmax(0, 1fr);
            grid-template-areas: "card" "potential" "stats" "actions";
            gap: 0.6rem;
        }

        .card {
            padding: 0.7rem 0.9rem;
            gap: 0.3rem;
        }

        .blessing {
            font-size: 0.7rem;
        }

        h2 {
            font-size: clamp(1.4rem, 3.6svh, 2rem);
        }

        .note,
        .names {
            font-size: 0.78rem;
            line-height: 1.3;
        }

        .quote {
            display: none;
        }

        .description {
            font-size: clamp(0.8rem, 1.9svh, 0.9rem);
            line-height: 1.35;
        }

        /* Pentagone et puissance côte à côte. */
        .potential {
            flex-direction: row;
            padding: 0.25rem 0.75rem;
            gap: 1.25rem;
        }

        .potential h3 {
            display: none;
        }

        .potential svg {
            flex: none;
            width: min(9rem, 17svh);
            height: auto;
        }

        .power {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .power strong {
            margin: 0;
            font-size: 1.6rem;
        }

        .stats {
            display: block;
            columns: 2;
            column-gap: 0.9rem;
            padding: 0.5rem 0.6rem 0.2rem;
        }

        .group {
            break-inside: avoid;
            margin-bottom: 0.4rem;
            gap: 0.2rem;
        }

        .group h3 {
            font-size: 0.65rem;
        }

        .row {
            grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr) 2.2em;
            gap: 0.3rem;
            font-size: 0.7rem;
        }
    }

    /* Petit téléphone : chaque ligne gagne quelques pixels. */
    @media (max-width: 760px) and (max-height: 720px) {
        .result {
            padding-top: 2.5rem;
        }

        .sheet {
            gap: 0.4rem;
        }

        .card {
            padding: 0.5rem 0.75rem;
            gap: 0.2rem;
        }

        .description {
            font-size: 0.76rem;
            line-height: 1.3;
        }

        .potential svg {
            width: 15svh;
        }

        .stats {
            padding-top: 0.35rem;
        }

        .group {
            gap: 0.1rem;
            margin-bottom: 0.25rem;
        }

        .row {
            font-size: 0.66rem;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .quote-stage,
        .burst,
        .orb,
        .card.revealed > :not(.veiled) {
            animation: none;
        }

        .card.revealed > :not(.veiled) {
            opacity: 1;
        }

        .card.revealed > .emblem {
            opacity: 0.08;
        }

        .burst {
            display: none;
        }
    }
</style>
