<script module lang="ts">
    import type { CardLook, PackView } from "$lib/cards/types";

    /** Ce qu'il faut pour dessiner les objets : les cartes et les séries citées par les offres. */
    export interface VisualRefs {
        templates: Record<number, CardLook>;
        sets: Record<number, { name: string; code: string; packs: PackView[] }>;
        allPack?: PackView;
    }
</script>

<script lang="ts">
    // Vignette d'un objet de la boutique : la carte elle-même, une carte mystère aux couleurs de sa
    // rareté (critères, hasard), le paquet d'une série, le booster « All » de la réserve, ou le logo
    // du Tout pour les fragments. Avec plusieurs exemplaires, une pile et une pastille « ×5 ».
    import CollectibleCard from "$lib/components/cards/CollectibleCard.svelte";
    import PackModel from "$lib/components/cards/opening/PackModel.svelte";
    import Icon from "$lib/components/ui/Icon.svelte";
    import { FRAGMENT_ICON, type ShopItem } from "$lib/cards/shop";

    let {
        item,
        refs,
        size = "md",
        badge = true,
    }: {
        item: ShopItem;
        refs: VisualRefs;
        /** lg : vignette d'une offre ; md : fenêtre du détail ; sm : petites lignes ; xs : dans le texte. */
        size?: "lg" | "md" | "sm" | "xs";
        /** Pastille du nombre (« ×5 », ou le montant des fragments). */
        badge?: boolean;
    } = $props();

    // Largeur d'une carte ; un paquet, plus élancé, est un peu plus étroit pour la même hauteur.
    const CARD_W = { lg: 5.4, md: 3.4, sm: 2.2, xs: 1.05 };
    let w = $derived(CARD_W[size]);

    let template = $derived(item.kind === "card" ? refs.templates[item.templateId] : undefined);
    let pack = $derived.by(() => {
        if (item.kind === "pack") {
            const set = refs.sets[item.setId];
            return set?.packs[0] ? { pack: set.packs[0], title: set.name, code: set.code } : null;
        }
        if (item.kind === "booster") return refs.allPack ? { pack: refs.allPack, title: "Booster All", code: "ALL" } : null;
        return null;
    });
    let rarity = $derived(item.kind === "criteria" || item.kind === "random" ? item.rarity : template?.rarity ?? null);
    let many = $derived(item.count > 1 && item.kind !== "fragments");
    let packLike = $derived(item.kind === "pack" || item.kind === "booster");
</script>

<span
    class="visual {size}"
    class:many
    style="--w: {w}rem; --r: {rarity ? `var(--rarity-${rarity})` : 'var(--border)'}"
    aria-hidden="true"
>
    {#if item.kind === "fragments"}
        <span class="coin"><Icon src={FRAGMENT_ICON} color="var(--rarity-4)" size={size === "xs" ? "1.1rem" : `${w * 0.78}rem`} /></span>
    {:else if packLike}
        {#if size === "xs" || !pack}
            <span class="mini-pack" style="--c: {pack?.pack.color ?? 'var(--accent)'}"></span>
        {:else}
            {#if many}
                <span class="pack ghost-pack"><PackModel pack={pack.pack} title={pack.title} code={pack.code} width="{w * 0.85}rem" idle={false} angle={-14} /></span>
            {/if}
            <span class="pack"><PackModel pack={pack.pack} title={pack.title} code={pack.code} width="{w * 0.85}rem" idle={false} angle={-14} /></span>
        {/if}
    {:else}
        {#if many && size !== "xs"}<span class="ghost"></span>{/if}
        {#if template}
            <span class="card"><CollectibleCard card={template} lite /></span>
        {:else}
            <span class="card mystery">{item.kind === "criteria" && item.rarityUp ? "+" : "?"}</span>
        {/if}
    {/if}

    {#if badge && size !== "xs" && (many || item.kind === "fragments")}
        <span class="badge" class:gold={item.kind === "fragments"}>
            {item.kind === "fragments" ? item.count.toLocaleString("fr-FR") : `×${item.count}`}
        </span>
    {/if}
</span>

<style>
    .visual {
        position: relative;
        flex-shrink: 0;
        display: inline-grid;
        place-items: center;
        width: calc(var(--w) * 1.12);
        height: calc(var(--w) * 1.4);
        line-height: 1;
    }

    .visual.xs {
        width: var(--w);
        height: calc(var(--w) * 1.4);
        vertical-align: middle;
    }

    .card {
        position: relative;
        z-index: 1;
        width: var(--w);
        display: block;
    }

    .mystery {
        aspect-ratio: 63 / 88;
        display: grid;
        place-items: center;
        border-radius: calc(var(--w) * 0.06);
        border: max(1px, calc(var(--w) * 0.035)) solid var(--r);
        background: radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--r) 35%, transparent), rgba(0, 0, 0, 0.45));
        color: var(--r);
        font-family: var(--titleFont);
        font-size: calc(var(--w) * 0.5);
    }

    .xs .mystery {
        font-size: 0;
        background: color-mix(in srgb, var(--r) 45%, transparent);
    }

    /* Le deuxième exemplaire, un peu de travers derrière le premier. */
    .ghost {
        position: absolute;
        width: var(--w);
        aspect-ratio: 63 / 88;
        border-radius: calc(var(--w) * 0.06);
        border: 1px solid color-mix(in srgb, var(--r) 70%, transparent);
        background: color-mix(in srgb, var(--r) 18%, var(--surface));
        transform: translate(calc(var(--w) * 0.12), calc(var(--w) * -0.06)) rotate(7deg);
    }

    .pack {
        position: relative;
        z-index: 1;
        display: grid;
        place-items: center;
    }

    .ghost-pack {
        position: absolute;
        z-index: 0;
        opacity: 0.55;
        transform: translate(calc(var(--w) * 0.16), calc(var(--w) * -0.05)) rotate(8deg);
    }

    .mini-pack {
        width: calc(var(--w) * 0.85);
        aspect-ratio: 1 / 1.62;
        clip-path: polygon(0 6%, 12% 0, 25% 6%, 37% 0, 50% 6%, 62% 0, 75% 6%, 87% 0, 100% 6%, 100% 94%, 87% 100%, 75% 94%, 62% 100%, 50% 94%, 37% 100%, 25% 94%, 12% 100%, 0 94%);
        background: linear-gradient(160deg, color-mix(in srgb, var(--c) 85%, #fff), color-mix(in srgb, var(--c) 55%, #000));
    }

    .coin {
        display: grid;
        place-items: center;
        filter: drop-shadow(0 0 calc(var(--w) * 0.12) color-mix(in srgb, var(--rarity-4) 45%, transparent));
    }

    .xs .coin {
        filter: none;
    }

    .badge {
        position: absolute;
        right: 0;
        bottom: 0;
        z-index: 2;
        padding: 0.15em 0.5em;
        border-radius: 999px;
        background: var(--accent);
        color: var(--background);
        font-family: var(--textFont);
        font-size: 0.8rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
    }

    .sm .badge {
        font-size: 0.68rem;
        right: -0.2rem;
        bottom: -0.2rem;
    }

    .lg .badge {
        font-size: 0.9rem;
    }

    .badge.gold {
        background: var(--rarity-4);
    }
</style>
