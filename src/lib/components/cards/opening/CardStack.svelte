<script lang="ts">
    // Les cartes d'un booster, en pile, de la moins rare à la plus rare. Pas de dos factice : la
    // carte du dessus est la vraie, celles d'en dessous sont déjà là (on les aperçoit quand on
    // retourne la première). On fait tourner la carte en glissant sur le côté ; un toucher, ou un
    // glissé vers le haut, la jette et passe à la suivante. Comme dans les paquets de cartes de sport, une Unique est
    // glissée à l'envers : on lit d'abord son nom et son texte au verso, puis on la retourne.
    import { untrack } from "svelte";
    import { formatSerial, formatWear, rarityLabel, wearTier, type OwnedCard } from "$lib/cards/types";
    import CollectibleCard from "../CollectibleCard.svelte";
    import { vibrate } from "./feedback";

    let {
        cards,
        fresh = [],
        inPack = false,
        active = true,
        ondone,
    }: {
        cards: OwnedCard[];
        fresh?: number[];
        /** Encore dans le paquet : un peu plus bas, sans interaction. */
        inPack?: boolean;
        /** Révélation en cours : la carte du dessus se manipule et sa légende s'affiche. */
        active?: boolean;
        ondone: () => void;
    } = $props();

    const UNIQUE = 5;
    let index = $state(0);
    // Face visible de chaque exemplaire (vrai = verso) ; les Uniques arrivent à l'envers.
    let backs = $state<Record<number, boolean>>(
        untrack(() => Object.fromEntries(cards.map((c) => [c.copy.id, c.template.rarity === UNIQUE]))),
    );
    let seenFront = $state<Record<number, boolean>>({});
    let leaving = $state<number | null>(null);

    let visible = $derived(cards.slice(index, index + 3));
    let top = $derived(cards[index]);
    let reversed = $derived(top.template.rarity === UNIQUE && backs[top.copy.id] && !seenFront[top.copy.id]);

    $effect(() => {
        if (top && !backs[top.copy.id]) seenFront[top.copy.id] = true;
    });

    $effect(() => {
        // Une carte rare arrive sur le dessus de la pile.
        if (!active) return;
        const rarity = top.template.rarity;
        if (rarity >= 3) untrack(() => vibrate(rarity >= 4 ? [30, 40, 60] : 30));
    });

    function next() {
        leaving = null;
        if (index < cards.length - 1) index++;
        else ondone();
    }

    /** Suivante au bouton ou au clavier : la carte s'envole comme si on l'avait jetée. */
    function throwTop() {
        if (!active || leaving !== null) return;
        leaving = top.copy.id;
        setTimeout(next, 280);
    }

    /** Toucher la carte : une Unique encore à l'envers se retourne, les autres laissent place à la suivante. */
    function tapTop() {
        if (reversed) turnTop();
        else throwTop();
    }

    function turnTop() {
        if (!active) return;
        backs[top.copy.id] = !backs[top.copy.id];
    }

    function onkeydown(e: KeyboardEvent) {
        if (!active) return;
        if (e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            tapTop();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            turnTop();
        }
    }
</script>

<svelte:window {onkeydown} />

<div class="zone">
    <div class="stack" class:in-pack={inPack}>
        {#each visible as card, k (card.copy.id)}
            <div
                class="layer"
                class:top={k === 0 && active}
                class:leave={leaving === card.copy.id}
                style="--k: {k}; z-index: {10 - k}"
            >
                <CollectibleCard
                    card={card.template}
                    copy={card.copy}
                    bind:flipped={backs[card.copy.id]}
                    tilt={k === 0 && active ? "full" : "none"}
                    lite={k >= 2}
                    glow={k === 0 && active && card.template.rarity >= 3}
                    onswipeup={k === 0 && active ? next : undefined}
                    ontap={k === 0 && active ? tapTop : undefined}
                    label={card.template.name}
                />
                {#if k === 0 && active && card.template.rarity >= 3}
                    <div class="ring r{card.template.rarity}"></div>
                {/if}
            </div>
        {/each}
    </div>

    <div class="caption" class:shown={active} aria-live="polite">
        <span class="counter">{index + 1} / {cards.length}</span>
        {#if reversed}
            <strong>Une carte à l’envers…</strong>
            <span class="rarity" style="color: var(--rarity-{UNIQUE})">Touche-la pour la retourner</span>
        {:else}
            {#if fresh.includes(top.template.id)}<span class="new">Nouvelle !</span>{/if}
            <strong>{top.template.name}</strong>
            <span class="rarity" style="color: var(--rarity-{top.template.rarity})">{rarityLabel(top.template.rarity)}</span>
            <span class="muted details">
                {formatSerial(top.copy.serial, top.template.maxPrints)} · {wearTier(top.copy.wear).label} · {formatWear(top.copy.wear)}
            </span>
        {/if}
        {#if !reversed}
            <span class="hint muted">Touche la carte pour la suivante · glisse sur le côté pour la retourner</span>
        {/if}
        <span class="buttons">
            <button type="button" class="btn btn-small" onclick={turnTop}>Retourner</button>
            <button type="button" class="btn btn-small btn-accent" onclick={throwTop}>
                {index < cards.length - 1 ? "Suivante" : "Voir le booster"}
            </button>
        </span>
    </div>
</div>

<style>
    .zone {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.9rem;
    }

    .stack {
        position: relative;
        width: var(--card-w);
        aspect-ratio: 63 / 88;
        transition:
            transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1),
            opacity 0.35s ease;
    }

    /* Dans le paquet : cachées (le paquet pivote et laisserait dépasser un coin), un peu plus bas
       pour qu'elles montent en sortant. */
    .stack.in-pack {
        transform: translateY(12%) scale(0.94);
        opacity: 0;
    }

    /* Les cartes d'en dessous dépassent à peine, comme un paquet tenu en main. */
    .layer {
        position: absolute;
        inset: 0;
        transform: translateY(calc(var(--k) * 7px)) scale(calc(1 - var(--k) * 0.035));
        transition: transform 0.35s ease;
    }

    .layer:not(.top) {
        pointer-events: none;
    }

    .layer.top :global(.scene) {
        animation: sweep 1.8s ease-out 0.15s;
    }

    .layer.leave {
        animation: leave 0.3s ease-in forwards;
    }

    .ring {
        position: absolute;
        inset: -30%;
        border-radius: 50%;
        border: 3px solid var(--rarity-3);
        animation: ring 0.9s ease-out forwards;
        pointer-events: none;
    }

    .ring.r4 {
        border-color: var(--rarity-4);
    }

    .ring.r5 {
        border-color: var(--rarity-5);
        border-width: 6px;
    }

    .caption {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.15rem;
        text-align: center;
        opacity: 0;
        transition: opacity 0.4s ease;
    }

    .caption.shown {
        opacity: 1;
    }

    .counter {
        font-size: 0.72rem;
        letter-spacing: 0.2em;
        color: var(--muted);
    }

    .caption strong {
        font-family: var(--titleFont);
        font-size: 1.45rem;
        line-height: 1.15;
    }

    .rarity {
        font-size: 0.8rem;
        letter-spacing: 0.15em;
        text-transform: uppercase;
    }

    .details {
        font-size: 0.72rem;
        font-variant-numeric: tabular-nums;
    }

    .new {
        padding: 0.1rem 0.6rem;
        border-radius: 999px;
        background: var(--accent);
        color: var(--background);
        font-size: 0.7rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .hint {
        margin-top: 0.3rem;
        font-size: 0.72rem;
    }

    .buttons {
        display: flex;
        gap: 0.4rem;
        margin-top: 0.3rem;
    }

    @keyframes sweep {
        0% {
            --mx: 0;
            --my: 20;
            --active: 1;
        }
        70% {
            --mx: 100;
            --my: 70;
            --active: 0.9;
        }
        100% {
            --mx: 32;
            --my: 26;
            --active: 0;
        }
    }

    @keyframes leave {
        to {
            transform: translateY(-110vh) rotate(-8deg);
        }
    }

    @keyframes ring {
        from {
            transform: scale(0.4);
            opacity: 1;
        }
        to {
            transform: scale(1.3);
            opacity: 0;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .layer.top :global(.scene),
        .stack {
            animation: none;
            transition: none;
        }
    }
</style>
