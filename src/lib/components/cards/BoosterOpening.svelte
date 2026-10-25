<script lang="ts">
    // Ouverture d'un booster, en plein écran :
    //   0. le choix du paquet, quand la série en a plusieurs (le contenu ne change pas) ;
    //   1. l'introduction : le paquet qu'on découpe (par défaut), ou le cristal qu'on brise ;
    //   2. la pile des cartes, de la moins rare à la plus rare, qu'on retourne et qu'on jette ;
    //   3. le récapitulatif du booster.
    //
    // Le tirage est fait par le serveur dès le choix du paquet (`onstart`) : l'animation ne décide
    // de rien. On peut fermer à tout moment, les cartes sont déjà dans la collection ; le booster
    // reste alors « pas vu » et sera reproposé (`onseen` n'est appelé qu'au récapitulatif).
    import { onDestroy, onMount } from "svelte";
    import { isGodPack } from "$lib/cards/booster";
    import type { OwnedCard, PackView } from "$lib/cards/types";
    import CollectibleCard from "./CollectibleCard.svelte";
    import CardStack from "./opening/CardStack.svelte";
    import CrystalIntro from "./opening/CrystalIntro.svelte";
    import PackIntro from "./opening/PackIntro.svelte";
    import PackModel from "./opening/PackModel.svelte";

    let {
        title,
        code,
        packs,
        cards,
        fresh = [],
        error = null,
        remaining = 0,
        count = 5,
        intro = "booster",
        onstart,
        onseen,
        onclose,
        onagain,
    }: {
        /** Série (ou « Booster All »), en grand sur le paquet. */
        title: string;
        code: string;
        /** Paquets au choix ; un seul : pas d'écran de choix. */
        packs: PackView[];
        /** null tant que le serveur n'a pas répondu. */
        cards: OwnedCard[] | null;
        fresh?: number[];
        error?: string | null;
        /** Boosters encore en réserve après celui-ci. */
        remaining?: number;
        /** Cartes par booster, imprimé sur le paquet. */
        count?: number;
        /** Animation d'ouverture : le paquet à découper, ou le cristal (gardé de côté). */
        intro?: "booster" | "cristal";
        /** Le joueur a choisi son paquet : le tirage peut partir. */
        onstart?: (pack: PackView) => void;
        /** Le joueur a vu tout le booster. */
        onseen?: () => void;
        onclose: () => void;
        onagain?: () => void;
    } = $props();

    type Phase = "choose" | "intro" | "emerge" | "reveal" | "summary";
    let phase = $state<Phase>("intro");
    let pack = $state<PackView | null>(null);
    let opened = $state(false);

    // God Pack : reconnu à ses raretés (Légendaires et au moins une Unique), annoncé à la révélation.
    let god = $derived(!!cards && isGodPack(cards.map((c) => c.template.rarity)));
    let best = $derived(cards ? Math.max(1, ...cards.map((c) => c.template.rarity)) : 1);

    function choose(chosen: PackView) {
        pack = chosen;
        phase = "intro";
        if (!cards) onstart?.(chosen);
    }

    onMount(() => {
        if (packs.length > 1 && !cards) phase = "choose";
        else choose(packs[0]);
    });

    $effect(() => {
        // L'introduction est jouée et les cartes sont là : elles sortent du paquet.
        if (phase !== "intro" || !opened || !cards) return;
        if (cards.length === 0) {
            phase = "summary";
        } else if (intro === "booster") {
            phase = "emerge";
            setTimeout(() => (phase = "reveal"), 900);
        } else {
            phase = "reveal";
        }
    });

    let seen = false;
    $effect(() => {
        if (phase === "summary" && !seen) {
            seen = true;
            onseen?.();
        }
    });

    function onkeydown(e: KeyboardEvent) {
        if (e.key === "Escape") onclose();
    }

    // La page derrière ne défile pas pendant l'ouverture.
    let overflow = "";
    onMount(() => {
        overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
    });
    onDestroy(() => {
        if (typeof document !== "undefined") document.body.style.overflow = overflow;
    });
</script>

<svelte:window {onkeydown} />

<div
    class="opening"
    style="--pack: {pack?.color ?? packs[0]?.color ?? '#cfdfc4'}; --best: var(--rarity-{best})"
    role="dialog"
    aria-modal="true"
    aria-label="Ouverture d’un booster {title}"
>
    <button
        type="button"
        class="close btn btn-small"
        onclick={onclose}
        title={cards && phase !== "summary" ? "Tes cartes sont déjà dans ta collection ; tu pourras revoir ce booster plus tard." : undefined}
    >
        {cards && phase !== "summary" && phase !== "choose" ? "Plus tard" : "Fermer"}
    </button>

    {#if phase === "choose"}
        <div class="choose">
            <h2>{title}</h2>
            <p class="muted">
                Choisis ton paquet : ils contiennent tous les mêmes cartes, seule l’illustration change.
            </p>
            <div class="packs">
                {#each packs as p, i (p.id ?? i)}
                    <button type="button" class="pick" onclick={() => choose(p)}>
                        <PackModel pack={p} {title} {code} {count} width="var(--pick-w)" follow delay={i * 1.7} />
                        <span>{p.name}</span>
                    </button>
                {/each}
            </div>
        </div>
    {:else if phase !== "summary" && pack}
        <div class="stage" class:with-crystal={intro === "cristal"}>
            {#if cards?.length && (intro === "booster" || phase === "reveal")}
                <div class="slot stack-slot" class:appear={intro === "cristal"}>
                    <CardStack
                        {cards}
                        {fresh}
                        inPack={phase === "intro"}
                        active={phase === "reveal"}
                        ondone={() => (phase = "summary")}
                    />
                </div>
            {/if}
            {#if phase === "intro" || phase === "emerge"}
                <div class="slot intro-slot">
                    {#if intro === "booster"}
                        <PackIntro
                            {pack}
                            {title}
                            {code}
                            {count}
                            {error}
                            waiting={opened && !cards}
                            leaving={phase === "emerge"}
                            oncut={() => (opened = true)}
                        />
                    {:else}
                        <CrystalIntro
                            pack={{ name: title, code, color: pack.color, banner: pack.image ?? pack.banner ?? null }}
                            {best}
                            {error}
                            ready={!!cards}
                            onopened={() => (opened = true)}
                        />
                    {/if}
                </div>
            {/if}
        </div>
        {#if god && phase === "reveal"}
            <span class="god" role="status">God Pack</span>
        {/if}
        {#if phase === "reveal"}
            <button type="button" class="skip btn btn-small" onclick={() => (phase = "summary")}>Tout voir</button>
        {/if}
    {:else if phase === "summary" && cards}
        <div class="summary">
            {#if god}<span class="god static">God Pack</span>{/if}
            <h2>{title}</h2>
            <div class="grid">
                {#each cards as card (card.copy.id)}
                    <a class="pulled" href="/cartes/carte/{card.copy.id}">
                        <CollectibleCard card={card.template} copy={card.copy} lite tilt="hover" glow={card.template.rarity >= 4} />
                        {#if fresh.includes(card.template.id)}<span class="new">Nouvelle</span>{/if}
                    </a>
                {/each}
            </div>
            <div class="actions">
                {#if onagain && remaining > 0}
                    <button type="button" class="btn btn-accent" onclick={onagain}>
                        Ouvrir un autre ({remaining} en réserve)
                    </button>
                {/if}
                <a class="btn" href="/cartes/collection">Ma collection</a>
                <button type="button" class="btn" onclick={onclose}>Fermer</button>
            </div>
        </div>
    {/if}
</div>

<style>
    .opening {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 1rem;
        background:
            radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--pack) 35%, transparent) 0%, transparent 60%),
            rgba(8, 8, 10, 0.97);
        overflow-x: hidden;
        overflow-y: auto;
        user-select: none;
        -webkit-user-select: none;
        animation: fade-in 0.3s ease-out;
    }

    .close {
        position: fixed;
        top: 1rem;
        left: 1rem;
        z-index: 2;
    }

    /* ─── Choix du paquet ─────────────────────────────────────── */

    .choose {
        --pick-w: min(38vw, 190px, calc((100dvh - 14rem) / 1.62));
        width: min(960px, 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        text-align: center;
        animation: fade-in 0.4s ease-out;
    }

    .choose h2 {
        font-size: 1.8rem;
    }

    .choose p {
        max-width: 32rem;
        font-size: 0.9rem;
    }

    .packs {
        width: 100%;
        display: flex;
        justify-content: safe center;
        gap: 1.5rem;
        overflow-x: auto;
        padding: 2rem 1rem 2.5rem;
        scroll-snap-type: x mandatory;
        scrollbar-width: none;
    }

    .pick {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.4rem;
        padding: 0;
        border: none;
        background: none;
        color: var(--foreground);
        font-family: var(--titleFont);
        font-size: 1.05rem;
        scroll-snap-align: center;
        transition: transform 0.25s ease;
    }

    .pick:hover,
    .pick:focus-visible {
        transform: translateY(-6px) scale(1.03);
    }

    /* ─── Ouverture ───────────────────────────────────────────── */

    /* Le paquet et la pile occupent la même case : les cartes attendent derrière le paquet,
       juste sous la découpe, et la hauteur ne bouge pas d'une étape à l'autre. */
    .stage {
        --card-w: min(72vw, 300px, calc((100dvh - 9rem) / 2.05));
        position: relative;
        display: grid;
        justify-items: center;
        align-items: start;
        height: calc(var(--card-w) * 2.05);
    }

    .slot {
        grid-area: 1 / 1;
    }

    .stack-slot {
        margin-top: calc(var(--card-w) * 0.22);
    }

    .stage.with-crystal .intro-slot {
        align-self: center;
    }

    .stack-slot.appear {
        animation: appear 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.1);
    }

    .skip {
        position: fixed;
        top: 1rem;
        right: 1rem;
    }

    /* ─── Récapitulatif ───────────────────────────────────────── */

    .summary {
        width: min(900px, 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.25rem;
        animation: fade-in 0.4s ease-out;
    }

    .summary h2 {
        font-size: 1.6rem;
    }

    /* God Pack : un bandeau doré et irisé, qui tombe d'en haut à la révélation. */
    .god {
        position: absolute;
        z-index: 5;
        top: max(1rem, env(safe-area-inset-top));
        left: 50%;
        translate: -50% 0;
        padding: 0.35rem 1.4rem;
        border-radius: 999px;
        background: linear-gradient(100deg, var(--Pura), #fff 30%, var(--rarity-5) 55%, var(--Pura) 80%) 0 0 / 250% 100%;
        color: #1b1b1b;
        font-family: var(--titleFont);
        font-size: 1.3rem;
        font-weight: 700;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        white-space: nowrap;
        box-shadow: 0 0 2rem color-mix(in srgb, var(--Pura) 70%, transparent);
        animation:
            god-drop 0.7s cubic-bezier(0.34, 1.5, 0.5, 1),
            god-shine 3s linear infinite;
    }

    .god.static {
        position: static;
        translate: none;
        align-self: center;
    }

    @keyframes god-drop {
        from {
            transform: translateY(-200%) scale(0.6);
        }
    }

    @keyframes god-shine {
        to {
            background-position: -250% 0;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .god {
            animation: none;
        }
    }

    .grid {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 170px));
        justify-content: center;
        gap: 1rem;
    }

    .pulled {
        position: relative;
        display: block;
    }

    .new {
        position: absolute;
        top: -0.5rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2;
        padding: 0.1rem 0.6rem;
        border-radius: 999px;
        background: var(--accent);
        color: var(--background);
        font-size: 0.7rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.5rem;
    }

    @keyframes fade-in {
        from {
            opacity: 0;
        }
    }

    @keyframes appear {
        from {
            transform: scale(0.6);
            opacity: 0;
        }
    }

    @media (max-width: 600px) {
        .grid {
            grid-template-columns: repeat(3, 1fr);
        }

        .packs {
            justify-content: flex-start;
        }
    }
</style>
