<script lang="ts">
    import { cubicOut } from "svelte/easing";
    import { fade } from "svelte/transition";
    import type { Address } from "$lib/flux/address";
    import { QUESTIONS } from "$lib/flux/quiz-data";

    // Entrée du don de flux (première visite, ou après « Recommencer »), en deux écrans : ce qui
    // attend le visiteur, puis comment s'adresser à son personnage. Deux stèles en forme de porte
    // lévitent côte à côte, nimbées de la même lueur : rien, ni couleur ni place, ne distingue l'une
    // de l'autre. Ces textes précèdent le choix : ils ne s'accordent à personne.
    let { onChoose }: { onChoose: (address: Address) => void } = $props();

    const STONES: { address: Address; article: string; word: string }[] = [
        { address: "il", article: "un", word: "voyageur" },
        { address: "elle", article: "une", word: "voyageuse" },
    ];

    // Un écran se dissipe dans une brume avant que le suivant n'en sorte (jamais les deux à la fois :
    // la page n'a pas à se recentrer en plein passage).
    type Step = "lore" | "address" | "done";
    let step = $state<Step>("lore");
    // Écran à montrer quand celui-ci aura fini de se dissiper.
    let next: Step = "lore";

    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function mist(_: Element, { delay = 0, duration = 600, y = 14 } = {}) {
        return {
            delay,
            duration: reduced ? 0 : duration,
            easing: cubicOut,
            css: (t: number, u: number) =>
                `opacity: ${t}; filter: blur(${u * 10}px); transform: translateY(${u * y}px) scale(${1 - u * 0.03});`,
        };
    }

    function leave(target: Step) {
        next = target;
        step = "done";
    }

    // La stèle choisie s'embrase, l'autre s'efface, puis l'écran se dissipe sur la constellation.
    const CHOSEN_MS = 750;
    let chosen = $state<Address | null>(null);

    async function choose(address: Address) {
        if (chosen) return;
        chosen = address;
        await new Promise((r) => setTimeout(r, reduced ? 0 : CHOSEN_MS));
        leave("done");
    }

    // Un écran a fini de se dissiper : le suivant apparaît, ou la constellation après le choix.
    function gone() {
        if (next === "done" && chosen) onChoose(chosen);
        else step = next;
    }

    // Le contrat : la date du jour, puis une signature qui se trace avant de passer au choix.
    const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    // La signature : le Tout réduit à l'essentiel, un cercle tracé à main levée puis une croix
    // droite (+) dedans. Chaque trait se dessine après le précédent (début et durée en s).
    const SIGNATURE = [
        { d: "M 98 7 C 116 4, 128 16, 127 30 C 126 45, 113 55, 99 54 C 84 53, 72 43, 73 29 C 74 15, 86 6, 104 9", start: 0, duration: 0.6 },
        { d: "M 100 13 C 101 25, 99 37, 100 48", start: 0.65, duration: 0.25 },
        { d: "M 81 31 C 93 30, 107 31, 119 29", start: 0.95, duration: 0.25 },
    ];
    const SIGN_MS = 1500;
    let signed = $state(false);

    async function sign() {
        if (signed) return;
        signed = true;
        await new Promise((r) => setTimeout(r, reduced ? 0 : SIGN_MS));
        leave("address");
    }

    // Motif de fond : les symboles des onze dragons en quinconce, blancs et très pâles.
    const PATTERN_DRAGONS = ["Aqua", "Artrish", "Chronos", "Drii", "Goliath", "Guizamark", "Lada", "Pestia", "Pura", "Shizari", "Yinva"];
    const COLS = 8;
    const ROWS = 10;
    const pattern = Array.from({ length: COLS * ROWS }, (_, n) => {
        const row = Math.floor(n / COLS);
        const col = n % COLS;
        const dragon = PATTERN_DRAGONS[(col * 3 + row * 5) % PATTERN_DRAGONS.length];
        return {
            dragon,
            x: ((col + (row % 2) * 0.5) / COLS) * 100,
            y: (row / (ROWS - 1)) * 100,
            delay: -((n * 0.73) % 9),
        };
    });

    // Le contrat dépasse l'écran (téléphone, petit écran) : tant que la signature reste sous le
    // bord, un signe invite à descendre ; le toucher y mène.
    let signBelow = $state(false);
    let signField: HTMLElement | null = null;

    function watchSign(node: HTMLElement) {
        signField = node;
        // Dès que la signature dépasse, même en partie, du bas de l'écran.
        const seen = new IntersectionObserver(([entry]) => {
            signBelow = entry.boundingClientRect.bottom > window.innerHeight;
        });
        seen.observe(node);
        // Premier état tout de suite, puis à chaque défilement (en plus de l'observateur).
        const check = () => (signBelow = node.getBoundingClientRect().bottom > window.innerHeight);
        check();
        window.addEventListener("scroll", check, { passive: true });
        window.addEventListener("resize", check);
        return {
            destroy() {
                seen.disconnect();
                window.removeEventListener("scroll", check);
                window.removeEventListener("resize", check);
                signField = null;
                signBelow = false;
            },
        };
    }

    const toSign = () => signField?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });

    // La question prend le focus à l'arrivée du second écran (et non une des stèles : aucune n'est
    // proposée avant l'autre).
    const focusOnMount = (el: HTMLElement) => el.focus({ preventScroll: true });
</script>

<div class="pattern" aria-hidden="true">
    {#each pattern as p, n (n)}
        <span style="left: {p.x}%; top: {p.y}%; --icon: url('/icones/dragons/{p.dragon}.svg'); animation-delay: {p.delay}s;"></span>
    {/each}
</div>

{#if signBelow && step === "lore"}
    <div class="more" transition:fade={{ duration: 250 }}>
        <button class="more-hint" onclick={toSign} aria-label="Descendre jusqu'à la signature">
            <span class="chevrons" aria-hidden="true"><i></i><i></i></span>
        </button>
    </div>
{/if}

<section class="intro">
    {#if step === "lore"}
        <div class="screen" in:mist={{ duration: 800 }} out:mist={{ duration: 450, y: -18 }} onoutroend={gone}>
            <!-- Le texte, présenté comme un contrat : signer, c'est continuer. -->
            <article class="contract">
                <header class="contract-head">
                    <span class="seal" aria-hidden="true"></span>
                    <h2 class="title">Bienvenue sur Arthera.</h2>
                </header>
                <div class="lore">
                    <p>
                        Tu t'apprêtes à faire un pas dans un monde où la magie est reine : une magie que l'on appelle le flux. Ici, chacun naît avec un pouvoir déjà inscrit en lui. Ton caractère et ton ambition en forgent la nature, mais seule ta créativité lui donnera sa vraie puissance. Quelle pseudo-divinité d'Arthera a laissé sa marque dans ton sang ? Et jusqu'où iras-tu pour la développer ?
                    </p>
                    <p>
                        C'est ce que nous allons voir. À l'issue de ces épreuves, tu recevras ton certificat de flux et pourras façonner le personnage que tu incarneras sur Arthera, telle une petite marionnette.
                    </p>
                    <p>
                        Trêve de politesse : ton jugement commence maintenant. Bon courage.
                    </p>
                </div>
                <footer class="sign">
                    <p class="place">Fait sur Arthera,<br />le {today}</p>
                    <div class="sign-field" use:watchSign>
                        <span class="sign-label">Signature</span>
                        <button class="signature" class:signed disabled={signed} onclick={sign}>
                            {#if signed}
                                <svg viewBox="0 0 200 60" aria-hidden="true">
                                    {#each SIGNATURE as stroke, i (i)}
                                        <path
                                            d={stroke.d}
                                            pathLength="100"
                                            style="animation-delay: {stroke.start}s; animation-duration: {stroke.duration}s;"
                                        />
                                    {/each}
                                </svg>
                            {:else}
                                <span class="sign-here">Continuer</span>
                            {/if}
                        </button>
                    </div>
                </footer>
            </article>
        </div>
    {:else if step === "address"}
        <div class="screen" in:mist={{ duration: 800 }} out:mist={{ duration: 500, y: -18 }} onoutroend={gone}>
            <p class="ask" id="flux-address" tabindex="-1" use:focusOnMount>
                J'aimerais qu'on s'adresse à mon personnage comme à…
            </p>

            <div class="stones" role="group" aria-labelledby="flux-address">
                {#each STONES as stone, i (stone.address)}
                    <div
                        class="slot"
                        class:chosen={chosen === stone.address}
                        class:faded={chosen && chosen !== stone.address}
                        style="--i: {i};"
                    >
                        <div class="float">
                            <span class="aura" aria-hidden="true"></span>
                            <button class="stone" disabled={!!chosen} onclick={() => choose(stone.address)}>
                                <span class="emblem" aria-hidden="true"></span>
                                <span class="article">{stone.article}</span>
                                <span class="word">{stone.word}</span>
                            </button>
                        </div>
                        <span class="ground" aria-hidden="true"></span>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</section>

<style>
    /* Motif des dragons, derrière tout l'écran d'entrée ; le centre reste dégagé pour le texte. */
    .pattern {
        position: fixed;
        inset: -2rem;
        z-index: 0;
        overflow: hidden;
        pointer-events: none;
        mask: radial-gradient(ellipse 60% 55% at 50% 50%, transparent 35%, #000 85%);
    }

    .pattern span {
        position: absolute;
        width: clamp(2.2rem, 5vw, 3.4rem);
        aspect-ratio: 1;
        translate: -50% -50%;
        background-color: var(--foreground);
        mask: var(--icon) center / contain no-repeat;
        opacity: 0.1;
        animation: drift 9s ease-in-out infinite alternate;
    }

    @keyframes drift {
        from {
            translate: -50% -50%;
            opacity: 0.06;
        }
        to {
            translate: -50% calc(-50% - 0.6rem);
            opacity: 0.14;
        }
    }

    /* Le contrat : une feuille au format A4 (210 × 297), aussi grande que la hauteur de l'écran le
       permet ; son contenu se règle sur sa largeur (cqw). Sur un téléphone, la feuille garde au
       moins ce format et s'allonge si le texte, lisible, ne tient pas. */
    .contract {
        position: relative;
        box-sizing: border-box;
        container-type: inline-size;
        display: flex;
        flex-direction: column;
        width: min(100%, max(33rem, calc((100svh - var(--head, 6rem) - 3.5rem) * 210 / 297)));
        aspect-ratio: 210 / 297;
        margin: 0 auto;
        padding: 8% 8% 6%;
        border: 1px solid color-mix(in srgb, var(--aura) 55%, transparent);
        border-radius: var(--radius);
        background:
            radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--aura) 9%, transparent), transparent 60%),
            linear-gradient(180deg, rgba(24, 24, 22, 0.94), rgba(14, 14, 14, 0.94));
        box-shadow:
            0 0 30px rgba(0, 0, 0, 0.6),
            0 0 18px color-mix(in srgb, var(--aura) 14%, transparent);
    }

    .contract::before {
        content: "";
        position: absolute;
        inset: 0.45rem;
        border: 1px solid color-mix(in srgb, var(--aura) 22%, transparent);
        border-radius: 2px;
        pointer-events: none;
    }

    .contract-head {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        padding-bottom: 0.9rem;
        border-bottom: 1px solid color-mix(in srgb, var(--aura) 22%, transparent);
    }

    .seal {
        width: clamp(2rem, 9cqw, 2.8rem);
        aspect-ratio: 1;
        background-color: var(--aura);
        mask: url("/layout/Logo.svg") center / contain no-repeat;
        opacity: 0.85;
        filter: drop-shadow(0 0 6px color-mix(in srgb, var(--aura) 50%, transparent));
    }

    .title {
        font-size: clamp(1.3rem, 6cqw, 2rem);
        color: var(--foreground);
    }

    .sign {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        justify-content: space-between;
        gap: 1rem 2rem;
        /* La signature reste au pied de la feuille. */
        margin-top: auto;
        padding-top: 1rem;
        border-top: 1px solid color-mix(in srgb, var(--aura) 22%, transparent);
        text-align: left;
    }

    .place {
        font-size: clamp(0.85rem, 3.2cqw, 1.05rem);
        font-family: var(--titleFont);
        font-style: italic;
        color: var(--muted);
        line-height: 1.35;
    }

    .sign-field {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        margin-left: auto;
    }

    .sign-label {
        font-size: 0.7rem;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        color: var(--muted);
    }

    /* L'endroit où signer : une ligne, et « Signer ici » qui attend. Signé, le trait se dessine. */
    .signature {
        position: relative;
        display: grid;
        place-items: center;
        width: min(15rem, 48cqw);
        height: 3.4rem;
        padding: 0;
        color: var(--aura);
        border: none;
        border-bottom: 1px solid color-mix(in srgb, var(--aura) 70%, transparent);
        border-radius: 0;
        background: linear-gradient(to top, color-mix(in srgb, var(--aura) 8%, transparent), transparent 70%);
        animation: rise 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) 0.6s backwards;
        transition:
            background-color 0.3s ease,
            box-shadow 0.3s ease;
    }

    .signature:not(:disabled):hover,
    .signature:focus-visible {
        outline: none;
        background-color: color-mix(in srgb, var(--aura) 10%, transparent);
        box-shadow: 0 6px 14px -8px var(--aura);
    }

    .signature:disabled {
        cursor: default;
    }

    /* « Continuer », le bouton d'action, posé sur la ligne de signature. */
    .sign-here {
        font-size: 1rem;
        letter-spacing: 0.06em;
        color: var(--foreground);
        text-shadow: 0 0 10px color-mix(in srgb, var(--aura) 60%, transparent);
    }


    .signature svg {
        width: 100%;
        height: 100%;
        overflow: visible;
    }

    .signature path {
        fill: none;
        stroke: currentColor;
        stroke-width: 2.2;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-dasharray: 100;
        stroke-dashoffset: 100;
        filter: drop-shadow(0 0 4px color-mix(in srgb, var(--aura) 60%, transparent));
        animation: write 0.6s cubic-bezier(0.45, 0, 0.3, 1) forwards;
    }

    @keyframes write {
        to {
            stroke-dashoffset: 0;
        }
    }

    /* Invitation à descendre jusqu'à la signature : une flèche seule, en bas de l'écran. */
    .more {
        position: fixed;
        left: 50%;
        bottom: max(1rem, env(safe-area-inset-bottom));
        z-index: 6;
        translate: -50% 0;
    }

    .more-hint {
        display: grid;
        place-items: center;
        width: 2.8rem;
        height: 2.8rem;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: none;
        filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.9));
    }

    .chevrons {
        display: grid;
        place-items: center;
        width: 1.2rem;
        height: 1.6rem;
    }

    .chevrons i {
        grid-area: 1 / 1;
        width: 0.75rem;
        height: 0.75rem;
        border-right: 2px solid var(--Guizamark);
        border-bottom: 2px solid var(--Guizamark);
        rotate: 45deg;
        animation: drop 1.4s ease-in-out infinite;
    }

    .chevrons i:last-child {
        animation-delay: 0.7s;
    }

    @keyframes drop {
        0% {
            opacity: 0;
            translate: 0 -0.45rem;
        }
        50% {
            opacity: 1;
        }
        100% {
            opacity: 0;
            translate: 0 0.35rem;
        }
    }

    .intro {
        position: relative;
        z-index: 1;
        /* La même lueur pour les deux stèles, à la couleur de Guizamark. Elles ont l'écran pour
           elles : aussi grandes que la hauteur (titre et question compris) le permet. */
        --aura: var(--Guizamark);
        --w: clamp(5rem, min(26vw, calc((100svh - 19rem) * 0.632)), 11rem);
        --h: calc(var(--w) / 0.632);
        width: min(100%, 40rem);
        text-align: center;
    }

    .screen {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: clamp(1.2rem, 3.5svh, 2.2rem);
    }

    /* Aligné à gauche : un bord régulier se lit plus facilement (dyslexie). */
    .lore {
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
        margin-bottom: 1.2rem;
        font-size: clamp(0.95rem, 3.9cqw, 1.1rem);
        line-height: 1.5;
        text-align: left;
        color: rgba(255, 255, 255, 0.85);
    }

    .steps {
        display: grid;
        gap: 0.3rem;
        margin: 0;
        padding: 0;
        list-style: none;
        color: var(--muted);
    }

    .steps li {
        position: relative;
        padding-left: 1.6rem;
    }

    /* Le symbole du Tout devant chaque étape. */
    .steps li::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0.25em;
        width: 1.05em;
        height: 1.05em;
        background-color: var(--aura);
        mask: url("/layout/Logo.svg") center / contain no-repeat;
        opacity: 0.85;
    }

    .ask {
        font-family: var(--titleFont);
        font-size: clamp(1.3rem, 3vw, 1.7rem);
        line-height: 1.3;
        color: var(--foreground);
    }

    .ask:focus {
        outline: none;
    }

    .stones {
        display: flex;
        justify-content: center;
        gap: clamp(1.75rem, 9vw, 5rem);
        /* De quoi lever les stèles sans qu'elles touchent la phrase. */
        padding-top: 0.9rem;
    }

    .slot {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.9rem;
        animation: rise 1s cubic-bezier(0.2, 0.7, 0.2, 1) calc(0.35s + var(--i) * 0.15s) backwards;
        transition:
            opacity 0.6s ease,
            filter 0.6s ease,
            translate 0.6s ease;
    }

    /* Elles lévitent, chacune à son rythme. */
    .float {
        position: relative;
        animation: levitate 3.6s ease-in-out calc(var(--i) * -1.8s) infinite alternate;
    }

    .aura {
        position: absolute;
        inset: -18% -30%;
        border-radius: 50%;
        background: radial-gradient(closest-side, color-mix(in srgb, var(--aura) 30%, transparent), transparent);
        filter: blur(8px);
        animation: breathe 3.6s ease-in-out calc(var(--i) * -1.8s) infinite alternate;
        pointer-events: none;
    }

    .stone {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        width: var(--w);
        height: var(--h);
        padding: 0;
        color: var(--aura);
        border: 2px solid color-mix(in srgb, var(--aura) 80%, transparent);
        border-radius: calc(var(--w) / 2) calc(var(--w) / 2) var(--radius) var(--radius);
        background:
            radial-gradient(ellipse at 50% 8%, rgba(255, 255, 255, 0.07), transparent 55%),
            radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--aura) 16%, transparent), transparent 70%),
            linear-gradient(180deg, #1c1c21, #0b0b0e);
        box-shadow:
            0 0 16px color-mix(in srgb, var(--aura) 50%, transparent),
            inset 0 0 24px color-mix(in srgb, var(--aura) 16%, transparent);
        transition:
            box-shadow 0.4s ease,
            scale 0.3s ease;
    }

    /* Le liseré gravé à l'intérieur de la stèle. */
    .stone::before {
        content: "";
        position: absolute;
        inset: calc(var(--w) * 0.07);
        border: 1px solid color-mix(in srgb, var(--aura) 32%, transparent);
        border-radius: calc(var(--w) * 0.43) calc(var(--w) * 0.43) 2px 2px;
        pointer-events: none;
    }

    .stone:not(:disabled):hover,
    .stone:focus-visible {
        outline: none;
        scale: 1.04;
        box-shadow:
            0 0 30px var(--aura),
            inset 0 0 34px color-mix(in srgb, var(--aura) 28%, transparent);
    }

    .stone:disabled {
        cursor: default;
    }

    /* Le symbole du Tout, gravé au-dessus de l'inscription, le même sur les deux stèles. */
    .emblem {
        width: 46%;
        aspect-ratio: 1;
        margin-bottom: calc(var(--w) * 0.06);
        background-color: var(--aura);
        mask: url("/layout/Logo.svg") center / contain no-repeat;
        opacity: 0.7;
        filter: drop-shadow(0 0 6px color-mix(in srgb, var(--aura) 60%, transparent));
        transition: opacity 0.4s ease;
    }

    .stone:not(:disabled):hover .emblem,
    .stone:focus-visible .emblem,
    .slot.chosen .emblem {
        opacity: 1;
    }

    .article {
        font-size: 0.75rem;
        letter-spacing: 0.32em;
        text-transform: uppercase;
        color: color-mix(in srgb, var(--aura) 70%, #fff);
        opacity: 0.8;
    }

    /* L'inscription, comme taillée dans la pierre. */
    .word {
        font-family: var(--titleFont);
        font-size: calc(var(--w) * 0.165);
        letter-spacing: 0.04em;
        color: color-mix(in srgb, var(--aura) 85%, #fff);
        text-shadow:
            0 0 10px color-mix(in srgb, var(--aura) 55%, transparent),
            0 1px 0 #000;
    }

    /* Ombre au sol : elle se resserre quand la stèle monte. */
    .ground {
        width: calc(var(--w) * 0.8);
        height: 0.6rem;
        border-radius: 50%;
        background: radial-gradient(closest-side, color-mix(in srgb, var(--aura) 35%, rgba(0, 0, 0, 0.6)), transparent);
        animation: shadow 3.6s ease-in-out calc(var(--i) * -1.8s) infinite alternate;
    }

    .slot.chosen .stone {
        box-shadow:
            0 0 40px var(--aura),
            0 0 90px color-mix(in srgb, var(--aura) 55%, transparent),
            inset 0 0 50px color-mix(in srgb, var(--aura) 40%, transparent);
        scale: 1.06;
    }

    .slot.faded {
        opacity: 0;
        filter: blur(4px);
        translate: 0 1rem;
    }

    @keyframes levitate {
        from {
            translate: 0 0;
        }
        to {
            translate: 0 -0.8rem;
        }
    }

    @keyframes breathe {
        from {
            opacity: 0.55;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes shadow {
        from {
            scale: 1;
            opacity: 0.85;
        }
        to {
            scale: 0.72;
            opacity: 0.45;
        }
    }

    @keyframes rise {
        from {
            opacity: 0;
            translate: 0 0.8rem;
            filter: blur(6px);
        }
    }

    /* Téléphone : texte un peu plus serré, stèles côte à côte sur toute la largeur. */
    @media (max-width: 700px) {
        .intro {
            --w: clamp(4.6rem, min(36vw, calc((100svh - 19rem) * 0.632)), 9rem);
        }

        .lore {
            line-height: 1.45;
            gap: 0.7rem;
        }

        .steps {
            gap: 0.2rem;
        }

        .stones {
            gap: clamp(1.25rem, 7vw, 2.5rem);
        }

        .slot {
            gap: 0.7rem;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .float,
        .aura,
        .ground,
        .pattern span,
        .signature,
        .slot {
            animation: none;
        }

        .signature path {
            animation: none;
            stroke-dashoffset: 0;
        }

        .chevrons i {
            animation: none;
            opacity: 1;
        }

        .chevrons i:last-child {
            display: none;
        }
    }
</style>
