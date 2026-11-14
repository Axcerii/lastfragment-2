<script lang="ts">
    import { tick } from "svelte";
    import { fade } from "svelte/transition";
    import { CONSTELLATION, DRAGONS, type DragonName } from "$lib/flux/discovery";

    // Première énigme de /flux : toucher les onze dragons dans l'ordre. Le serveur vérifie chaque
    // clic ; après un premier échec, ses indices se dévoilent un à un.
    let {
        onComplete,
    }: { onComplete: (icons: Record<DragonName, DOMRect>) => void } = $props();

    // Marge autour du dessin pour que les dragons posés au bord ne soient pas coupés.
    const PAD = 70;
    const VIEW_W = CONSTELLATION.width + PAD * 2;
    const VIEW_H = CONSTELLATION.height + PAD * 2;
    const ICON = 100;

    const left = (name: DragonName) => ((CONSTELLATION.nodes[name].x + PAD) / VIEW_W) * 100;
    const top = (name: DragonName) => ((CONSTELLATION.nodes[name].y + PAD) / VIEW_H) * 100;

    let sequence = $state<DragonName[]>([]);
    let pending = $state<DragonName | null>(null);
    let wrong = $state<DragonName | null>(null);
    let success = $state(false);
    let flash = $state(0);
    let failedOnce = $state(false);
    let hints = $state<string[]>([]);
    let message = $state("");
    // Les dragons ont pris leur envol vers la carte : la page les remplace par les siens.
    let gone = $state(false);

    let hintList = $state<HTMLElement | null>(null);
    let stage = $state<HTMLElement | null>(null);

    // Le symbole du Tout reste invisible : il apparaît le temps d'un clignement à chaque bon dragon
    // (flash), et ne s'affiche vraiment qu'à la fin, en grandissant.
    let glow = $derived(success ? 1 : 0);

    let lines = $derived(
        sequence.slice(1).map((to, i) => ({ from: CONSTELLATION.nodes[sequence[i]], to: CONSTELLATION.nodes[to], key: `${sequence[i]}-${to}` })),
    );

    async function pick(name: DragonName) {
        if (pending || wrong || success || sequence.includes(name)) return;
        pending = name;
        message = "";
        const attempt = [...sequence, name];
        let result: { valid: boolean; complete: boolean; hints: string[] };
        try {
            const res = await fetch("/flux/essai", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ type: "constellation", sequence: attempt }),
            });
            if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "");
            result = await res.json();
        } catch (e) {
            message = (e as Error).message || "Les dragons ne répondent pas. Réessaie.";
            pending = null;
            return;
        }
        pending = null;

        if (result.hints.length > hints.length) hints = result.hints;

        if (!result.valid) {
            failedOnce = true;
            wrong = name;
            setTimeout(() => {
                wrong = null;
                sequence = [];
            }, 900);
        } else {
            sequence = attempt;
            flash++;
            if (result.complete) finish();
        }

        if (failedOnce) {
            await tick();
            hintList?.scrollTo({ top: hintList.scrollHeight, behavior: "smooth" });
        }
    }

    function finish() {
        success = true;
        // Le dessin s'illumine, puis les dragons partent rejoindre la carte.
        setTimeout(() => {
            const rects = {} as Record<DragonName, DOMRect>;
            for (const icon of stage!.querySelectorAll<HTMLElement>("[data-dragon]"))
                rects[icon.dataset.dragon as DragonName] = icon.getBoundingClientRect();
            onComplete(rects);
            gone = true;
        }, 2200);
    }
</script>

<!-- Tout tient sur un écran. La place des indices est réservée dès le départ (à droite sur grand
     écran, dessous sur téléphone) : rien ne bouge quand ils apparaissent. -->
<div class="layout">
    <div class="area">
        <div class="stage" bind:this={stage} class:success class:gone class:shake={wrong} style="aspect-ratio: {VIEW_W} / {VIEW_H}; --ratio: {VIEW_W / VIEW_H};">
            <div class="halo" aria-hidden="true"></div>

            <svg viewBox="{-PAD} {-PAD} {VIEW_W} {VIEW_H}" aria-hidden="true">
                {#key flash}
                    <g class="drawing" class:flash={flash > 0 && !success} style="--glow: {glow};">
                        <circle cx="462.8" cy="387.6" r="188.8" />
                        <circle cx="462.8" cy="198.8" r="188.8" />
                        <circle cx="462.8" cy="576.4" r="188.8" />
                        <circle cx="626.5" cy="482.1" r="188.8" />
                        <circle cx="626.5" cy="293.3" r="188.8" />
                        <circle cx="299.4" cy="482.1" r="188.8" />
                        <circle cx="299.4" cy="293.3" r="188.8" />
                        <circle cx="68.3" cy="388.4" r="58.3" />
                        <circle cx="856.9" cy="388.4" r="58.3" />
                        <line class="thick" x1="655.1" y1="388.4" x2="798.6" y2="388.4" />
                        <line class="thick" x1="126.6" y1="388.4" x2="276" y2="388.4" />
                        <line class="thick" x1="462.6" y1="580.1" x2="462.6" y2="765.2" />
                        <line class="thick" x1="462.6" y1="10.3" x2="462.6" y2="203.5" />
                        <line class="thin" x1="68.1" y1="820.2" x2="68.1" y2="442.5" />
                        <line class="thin" x1="856.9" y1="820.2" x2="856.9" y2="442.5" />
                    </g>
                {/key}

                {#each lines as line (line.key)}
                    <g class="link" out:fade={{ duration: 300 }}>
                        <line class="link-glow" x1={line.from.x} y1={line.from.y} x2={line.to.x} y2={line.to.y} pathLength="1" />
                        <line class="link-core" x1={line.from.x} y1={line.from.y} x2={line.to.x} y2={line.to.y} pathLength="1" />
                    </g>
                {/each}
            </svg>

            {#each DRAGONS as name (name)}
                {@const linked = sequence.includes(name)}
                <button
                    class="dragon"
                    class:linked
                    class:pending={pending === name}
                    class:wrong={wrong === name}
                    style="left: {left(name)}%; top: {top(name)}%; width: {(ICON / VIEW_W) * 100}%;"
                    aria-label={name}
                    aria-pressed={linked}
                    disabled={success}
                    onclick={() => pick(name)}
                >
                    <span class="icon" data-dragon={name} style="--icon: url('/icones/dragons/{name}.svg');"></span>
                </button>
            {/each}
        </div>

        {#if message}
            <p class="message-error" role="alert">{message}</p>
        {/if}
    </div>

    <aside class="hints" class:shown={failedOnce} class:leaving={success} aria-hidden={!failedOnce}>
        {#if failedOnce}
            <h2 in:fade={{ duration: 500 }}>Murmures</h2>
            <div class="hint-list" bind:this={hintList}>
                <!-- Un seul texte, la genèse d'Arthera, qui s'allonge d'une phrase à chaque dragon. -->
                <p class="genesis">
                    {#each hints as hint, i (i)}
                        <span class:current={i === hints.length - 1}>{hint}</span>{" "}
                    {/each}
                </p>
            </div>
            <p class="muted small">Chaque dragon trouvé dévoile la suite.</p>
        {/if}
    </aside>
</div>

<style>
    /* Toute la hauteur sous le titre (--head, posé par la page), sans défilement : la
       constellation prend la place qui reste, les indices ont la leur. */
    .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: minmax(0, 1fr) clamp(7.5rem, 25svh, 12rem);
        gap: 0.8rem;
        width: 100%;
        height: calc(100svh - var(--head, 6rem) - 3.5rem);
    }

    /* Grand écran, ou téléphone couché : les indices à droite. Une colonne vide de même largeur à
       gauche garde la constellation au centre. */
    @media (min-width: 1100px), (orientation: landscape) and (max-height: 600px) {
        .layout {
            --side: clamp(12rem, 22vw, 20rem);
            grid-template-columns: var(--side) minmax(0, 1fr) var(--side);
            grid-template-rows: minmax(0, 1fr);
            column-gap: clamp(1rem, 2vw, 2rem);
        }

        .area {
            grid-column: 2;
        }

        .hints {
            grid-column: 3;
            align-self: center;
            max-height: min(100%, 28rem);
        }
    }

    /* La constellation, aussi grande que sa case le permet, en largeur comme en hauteur. */
    .area {
        position: relative;
        container-type: size;
        display: grid;
        place-items: center;
        min-height: 0;
    }

    .area .message-error {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: max-content;
        max-width: 100%;
        text-align: center;
    }

    .stage {
        position: relative;
        width: min(100cqw, 100cqh * var(--ratio), 56rem);
    }

    .halo {
        position: absolute;
        inset: 12%;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(210, 182, 116, 0.18), transparent 70%);
        filter: blur(30px);
        animation: breathe 6s ease-in-out infinite;
        pointer-events: none;
    }

    svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
        pointer-events: none;
    }

    .drawing {
        fill: none;
        stroke: var(--secondary);
        stroke-width: 20;
        opacity: var(--glow);
        transition: opacity 0.7s ease;
    }

    .drawing .thick {
        stroke-width: 80;
    }

    .drawing .thin {
        stroke-width: 10;
    }

    .drawing.flash {
        animation: flash 0.9s ease-in-out;
    }

    /* Fin : le symbole s'affiche enfin, en grandissant. */
    .success .drawing {
        filter: drop-shadow(0 0 14px rgba(210, 182, 116, 0.7));
        transform-origin: 462.6px 410px;
        animation: ignite 2.2s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
    }

    .link line {
        stroke-linecap: round;
        stroke-dasharray: 1;
        stroke-dashoffset: 1;
        animation: draw 0.5s ease-out forwards;
    }

    .link-glow {
        stroke: rgba(210, 182, 116, 0.45);
        stroke-width: 16;
        filter: blur(5px);
    }

    .link-core {
        stroke: var(--secondary);
        stroke-width: 4;
    }

    .success .link {
        transition: opacity 1.5s ease;
        opacity: 0;
    }

    .dragon {
        position: absolute;
        aspect-ratio: 1;
        min-width: 2.6rem;
        transform: translate(-50%, -50%);
        display: grid;
        place-items: center;
        padding: 0;
        border: 1px solid transparent;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(27, 27, 27, 0.9) 55%, transparent 72%);
        transition:
            transform 0.25s ease,
            border-color 0.3s ease,
            box-shadow 0.3s ease;
        -webkit-tap-highlight-color: transparent;
    }

    .icon {
        width: 74%;
        height: 74%;
        background-color: rgba(255, 255, 255, 0.35);
        mask: var(--icon) center / contain no-repeat;
        transition: background-color 0.35s ease;
    }

    .dragon:not(:disabled):hover {
        transform: translate(-50%, -50%) scale(1.1);
    }

    .dragon:hover .icon,
    .dragon:focus-visible .icon {
        background-color: rgba(255, 255, 255, 0.75);
    }

    .dragon.pending {
        animation: pulse 0.6s ease-in-out infinite;
    }

    .dragon.linked {
        border-color: rgba(210, 182, 116, 0.6);
        box-shadow: 0 0 22px rgba(210, 182, 116, 0.55);
    }

    .dragon.linked .icon {
        background-color: var(--secondary);
    }

    .dragon.wrong {
        border-color: var(--danger);
        box-shadow: 0 0 26px rgba(202, 68, 68, 0.8);
    }

    .dragon.wrong .icon {
        background-color: #ff8a8a;
    }

    .shake .dragon:not(.wrong) {
        animation: shake 0.45s ease-in-out;
    }

    .success .dragon {
        cursor: default;
        border-color: rgba(210, 182, 116, 0.9);
        box-shadow: 0 0 34px rgba(210, 182, 116, 0.8);
    }

    .success .dragon .icon {
        background-color: var(--secondary);
    }

    .gone .dragon {
        visibility: hidden;
    }

    /* Case des indices : réservée, invisible jusqu'au premier échec. */
    .hints {
        justify-self: center;
        box-sizing: border-box;
        width: min(100%, 36rem);
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.9rem 1.1rem;
        border: 1px solid rgba(210, 182, 116, 0.35);
        border-radius: var(--radius);
        background: rgba(20, 20, 20, 0.85);
        opacity: 0;
        visibility: hidden;
        transition:
            opacity 0.6s ease,
            visibility 0.6s;
    }

    .hints.shown {
        opacity: 1;
        visibility: visible;
    }

    .hints.leaving {
        opacity: 0;
        transition-duration: 1s;
    }

    .hints h2 {
        font-size: 1.3rem;
        color: var(--secondary);
    }

    /* Le texte défile dans sa case ; le début s'estompe vers le haut. */
    .hint-list {
        flex: 1;
        min-height: 0;
        padding-right: 0.6rem;
        overflow-y: auto;
        overscroll-behavior: contain;
        font-family: var(--titleFont);
        font-size: 1.05rem;
        line-height: 1.4;
        color: rgba(255, 255, 255, 0.7);
        mask-image: linear-gradient(to bottom, transparent, #000 1.2rem);
        scrollbar-width: thin;
        scrollbar-color: rgba(210, 182, 116, 0.55) transparent;
    }

    /* Barre de défilement : un fil doré, discret. */
    .hint-list::-webkit-scrollbar {
        width: 4px;
    }

    .hint-list::-webkit-scrollbar-track {
        margin: 0.6rem 0;
        background: rgba(210, 182, 116, 0.08);
        border-radius: 2px;
    }

    .hint-list::-webkit-scrollbar-thumb {
        background: linear-gradient(to bottom, rgba(210, 182, 116, 0.3), var(--secondary));
        border-radius: 2px;
    }

    /* La genèse : un texte d'un seul tenant, comme une page de manuscrit, ouvert par une lettrine.
       Chaque nouvelle phrase naît à la suite des autres, dorée, puis rejoint le texte. */
    .genesis {
        margin: 0;
        padding-top: 0.6rem;
        /* Aligné à gauche : justifié, la colonne étroite se creuserait de grands blancs. */
        hyphens: auto;
    }

    .genesis::first-letter {
        float: left;
        margin: 0.08em 0.1em 0 0;
        font-size: 2.6em;
        line-height: 0.85;
        color: var(--secondary);
    }

    .genesis span {
        transition:
            color 1.6s ease,
            text-shadow 1.6s ease;
        animation: emerge 1.4s ease-out backwards;
    }

    .genesis span.current {
        color: var(--secondary);
        text-shadow: 0 0 10px rgba(210, 182, 116, 0.5);
    }

    @keyframes emerge {
        from {
            opacity: 0;
            filter: blur(4px);
        }
    }

    .hints .small {
        flex-shrink: 0;
    }

    /* Téléphone : une case plus serrée. */
    @media (max-width: 700px) {
        .hints {
            padding: 0.6rem 0.8rem;
            gap: 0.3rem;
        }

        .hints h2 {
            font-size: 1.05rem;
        }

        .hint-list {
            font-size: 0.95rem;
            line-height: 1.3;
        }
    }

    .small {
        font-size: 0.8rem;
    }

    @keyframes draw {
        to {
            stroke-dashoffset: 0;
        }
    }

    /* Un bon dragon : le symbole du Tout apparaît le temps d'un clignement, puis disparaît. */
    @keyframes flash {
        0%,
        100% {
            opacity: 0;
        }
        35% {
            opacity: 0.25;
        }
    }

    @keyframes ignite {
        0% {
            opacity: 0;
            transform: scale(0.82);
        }
        55% {
            opacity: 0.9;
        }
        100% {
            opacity: 0.8;
            transform: scale(1.1);
        }
    }

    @keyframes breathe {
        50% {
            opacity: 0.55;
        }
    }

    @keyframes pulse {
        50% {
            box-shadow: 0 0 18px rgba(255, 255, 255, 0.35);
        }
    }

    @keyframes shake {
        20%,
        60% {
            transform: translate(calc(-50% - 4px), -50%);
        }
        40%,
        80% {
            transform: translate(calc(-50% + 4px), -50%);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .halo,
        .drawing.flash,
        .success .drawing,
        .dragon.pending,
        .shake .dragon:not(.wrong),
        .genesis span {
            animation: none;
        }

        .link line {
            animation-duration: 0.01s;
        }
    }
</style>
