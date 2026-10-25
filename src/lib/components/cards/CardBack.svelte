<script lang="ts">
    // Verso façon carte de sport : carton clair, bandeau à la couleur de la carte, fiche, barres
    // de stats, citation, puis la série et ce qui rend cet exemplaire unique (série, usure).
    import Icon from "$lib/components/ui/Icon.svelte";
    import { parseDragons } from "$lib/game/labels";
    import {
        CARD_TYPES,
        formatSerial,
        formatWear,
        inkOn,
        padNumber,
        rarityLabel,
        wearTier,
        type CardLook,
        type CopyView,
    } from "$lib/cards/types";
    import WearMarks from "./WearMarks.svelte";

    let {
        card,
        copy = null,
        wear = 0,
        seed = 1,
    }: { card: CardLook; copy?: CopyView | null; wear?: number; seed?: number } = $props();

    let face = $derived(card.face);
    let ink = $derived(inkOn(face.accent));
    let dragons = $derived(parseDragons(face.dragons));
    let thumb = $derived(face.art?.small ?? face.background?.small ?? null);
    let tier = $derived(wearTier(wear));
</script>

<div class="back" style="--accent: {face.accent}; --ink: {ink}">
    <header>
        {#if card.number != null}<span class="number">{padNumber(card.number)}</span>{/if}
        <span class="who">
            <strong>{card.name || "Sans nom"}</strong>
            {#if face.subtitle}<span>{face.subtitle}</span>{/if}
        </span>
        <Icon src={CARD_TYPES[card.type].icon} color={ink} size="7cqw" label={CARD_TYPES[card.type].label} />
    </header>

    <div class="sheet">
        {#if thumb}
            <img class="thumb" src={thumb} alt="" loading="lazy" decoding="async" />
        {/if}
        <dl class="facts">
            <div><dt>Type</dt><dd>{CARD_TYPES[card.type].label}</dd></div>
            {#if dragons.length}
                <div><dt>Dragon</dt><dd>{dragons.join(" · ")}</dd></div>
            {/if}
            {#each face.facts as fact, i (i)}
                <div><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
            {/each}
        </dl>
    </div>

    {#if face.bars.length}
        <div class="bars">
            {#each face.bars as bar, i (i)}
                <div class="bar" style="--c: {bar.dragon ? `var(--${bar.dragon})` : face.accent}">
                    <span class="label">{bar.label}</span>
                    <span class="track"><span class="fill" style="width: {bar.value}%"></span></span>
                    <span class="value">{bar.value}</span>
                </div>
            {/each}
        </div>
    {/if}

    {#if face.flavor}
        <p class="flavor">« {face.flavor} »</p>
    {/if}
    {#if face.text}
        <p class="text" style="--size: {(face.textSize ?? 100) / 100}">{face.text}</p>
    {/if}

    <footer>
        <span class="set">
            {#if card.set?.logo}<img src={card.set.logo} alt="" />{/if}
            {card.set ? `${card.set.code} · ${padNumber(card.number)}/${padNumber(card.set.total)}` : "Hors série"}
        </span>
        <span class="gems" title={rarityLabel(card.rarity)}>
            {#each [1, 2, 3, 4, 5] as n (n)}
                <i class:on={n <= card.rarity}></i>
            {/each}
        </span>
        <span class="copy">
            {#if copy}
                {formatSerial(copy.serial, card.maxPrints)} · {formatWear(copy.wear)} · {tier.label}
            {:else}
                Exemplaire {formatSerial(null, card.maxPrints)}
            {/if}
        </span>
    </footer>
    <span class="brand">Last Fragment</span>

    <WearMarks {wear} {seed} soft mirror />
</div>

<style>
    .back {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        gap: 2.2cqw;
        padding: 4cqw;
        box-sizing: border-box;
        overflow: hidden;
        border-radius: inherit;
        color: #2b2620;
        background:
            radial-gradient(circle at 20% 10%, rgba(255, 255, 255, 0.5), transparent 55%),
            url("/cartes/usure/carton.webp") 0 0 / 60% auto repeat,
            #e9e1cc;
        box-shadow: inset 0 0 0 1.4cqw color-mix(in srgb, var(--accent) 70%, #e9e1cc);
        font-size: 3.5cqw;
        line-height: 1.25;
    }

    header {
        display: flex;
        align-items: center;
        gap: 2.5cqw;
        margin: -1cqw -1cqw 0;
        padding: 2cqw 3cqw;
        background: color-mix(in srgb, var(--accent) 82%, #2b2620);
        color: var(--ink);
        border-radius: 1.6cqw;
        clip-path: polygon(0 0, 100% 0, 100% 78%, 96% 100%, 0 100%);
    }

    .number {
        font-family: var(--titleFont);
        font-size: 9cqw;
        font-weight: 700;
        line-height: 1;
        font-variant-numeric: tabular-nums;
    }

    .who {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
    }

    .who strong {
        font-family: var(--titleFont);
        font-size: 5.6cqw;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .who span {
        font-size: 3.2cqw;
        opacity: 0.85;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .sheet {
        display: flex;
        gap: 3cqw;
        align-items: flex-start;
    }

    .thumb {
        width: 24cqw;
        aspect-ratio: 3 / 4;
        object-fit: cover;
        object-position: top;
        border-radius: 1.4cqw;
        border: 0.6cqw solid var(--accent);
        background: color-mix(in srgb, var(--accent) 35%, #2b2620);
        filter: grayscale(0.35) sepia(0.25);
        flex-shrink: 0;
    }

    .facts {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.8cqw;
    }

    .facts div {
        display: flex;
        gap: 2cqw;
        border-bottom: 0.25cqw dotted rgba(43, 38, 32, 0.35);
        padding-bottom: 0.5cqw;
    }

    dt {
        font-weight: 700;
        text-transform: uppercase;
        font-size: 2.8cqw;
        letter-spacing: 0.05em;
        color: color-mix(in srgb, var(--accent) 45%, #2b2620);
        flex-shrink: 0;
        min-width: 15cqw;
    }

    dd {
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .bars {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.1cqw 3cqw;
    }

    .bar {
        display: grid;
        grid-template-columns: 9cqw 1fr 5.5cqw;
        align-items: center;
        gap: 1.2cqw;
        font-size: 2.9cqw;
    }

    .label {
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
    }

    .track {
        height: 1.8cqw;
        border-radius: 1cqw;
        background: rgba(43, 38, 32, 0.15);
        overflow: hidden;
        box-shadow: inset 0 0 0 0.2cqw rgba(43, 38, 32, 0.25);
    }

    .fill {
        display: block;
        height: 100%;
        background: var(--c);
        box-shadow: inset 0 0 0 0.25cqw rgba(0, 0, 0, 0.25);
    }

    .value {
        text-align: right;
        font-variant-numeric: tabular-nums;
        font-weight: 700;
    }

    .flavor {
        font-family: var(--titleFont);
        font-style: italic;
        font-size: 3.7cqw;
        text-align: center;
        white-space: pre-line;
    }

    .text {
        font-size: calc(3.1cqw * var(--size, 1));
        white-space: pre-line;
        overflow: hidden;
        flex: 1;
        min-height: 0;
        mask-image: linear-gradient(#000 80%, transparent);
    }

    footer {
        margin-top: auto;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.6cqw 2cqw;
        align-items: center;
        padding-top: 1.6cqw;
        border-top: 0.4cqw solid color-mix(in srgb, var(--accent) 60%, #2b2620);
        font-size: 2.8cqw;
    }

    .set {
        display: flex;
        align-items: center;
        gap: 1.2cqw;
        font-weight: 700;
        letter-spacing: 0.04em;
    }

    .set img {
        width: 5cqw;
        height: 5cqw;
        object-fit: contain;
    }

    .gems {
        display: flex;
        gap: 0.8cqw;
    }

    .gems i {
        width: 2.2cqw;
        height: 2.2cqw;
        transform: rotate(45deg);
        border: 0.3cqw solid #2b2620;
        opacity: 0.35;
    }

    .gems i.on {
        background: var(--rarity);
        opacity: 1;
    }

    .copy {
        grid-column: 1 / -1;
        font-variant-numeric: tabular-nums;
        opacity: 0.8;
    }

    .brand {
        position: absolute;
        right: 4cqw;
        bottom: 1.6cqw;
        font-family: var(--titleFont);
        font-size: 2.4cqw;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        opacity: 0.45;
    }
</style>
