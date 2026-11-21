<script lang="ts">
    import { cubicOut } from "svelte/easing";
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

    // La question prend le focus à l'arrivée du second écran (et non une des stèles : aucune n'est
    // proposée avant l'autre).
    const focusOnMount = (el: HTMLElement) => el.focus({ preventScroll: true });
</script>

<section class="intro">
    {#if step === "lore"}
        <div class="screen" in:mist={{ duration: 800 }} out:mist={{ duration: 450, y: -18 }} onoutroend={gone}>
            <div class="lore">
                <p>
                    Sur Arthera, le flux est un pouvoir légué dès la naissance par deux des dragons qui ont façonné le
                    monde. Ce voyage va révéler le tien.
                </p>
                <ol class="steps">
                    <li>Relie les onze dragons de la constellation.</li>
                    <li>Retrouve le nom des terres de la carte.</li>
                    <li>Franchis le portail de ton peuple.</li>
                    <li>Réponds aux {QUESTIONS.length} questions qui t'attendent de l'autre côté.</li>
                </ol>
                <p>
                    Il n'y a pas de mauvaise réponse. Au bout du chemin : ton flux, tes statistiques et de quoi créer
                    ton personnage.
                </p>
            </div>
            <button class="btn next" onclick={() => leave("address")}>Continuer</button>
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
    .intro {
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
        line-height: 1.5;
        text-align: left;
        color: rgba(255, 255, 255, 0.85);
    }

    .next {
        border-color: var(--aura);
        box-shadow: 0 0 14px color-mix(in srgb, var(--aura) 45%, transparent);
        animation: rise 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) 0.6s backwards;
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
            font-size: 0.9rem;
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
        .next,
        .slot {
            animation: none;
        }
    }
</style>
