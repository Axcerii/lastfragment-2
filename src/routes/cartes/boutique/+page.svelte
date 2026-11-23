<script lang="ts">
    // Boutique : les offres du MJ. Chacune montre ce que le joueur reçoit et ce qu'il cède (points,
    // cartes précises ou cartes qui répondent à des critères). « Échanger » ouvre le choix des
    // cartes à céder, déjà rempli avec les doubles et les plus usées ; le joueur peut changer.
    import { enhance } from "$app/forms";
    import { invalidateAll } from "$app/navigation";
    import Modal from "$lib/components/ui/Modal.svelte";
    import CollectibleCard from "$lib/components/cards/CollectibleCard.svelte";
    import Countdown from "$lib/components/cards/Countdown.svelte";
    import PackModel from "$lib/components/cards/opening/PackModel.svelte";
    import {
        matchesCriteria,
        pointsLabel,
        priceLineLabel,
        rewardCardLabel,
        suggestCards,
        type CopyFacts,
        type PriceLine,
        type ShopNames,
    } from "$lib/cards/shop";
    import { formatSerial, formatWear, rarityLabel, type OwnedCard } from "$lib/cards/types";

    let { data } = $props();

    type Offer = (typeof data.offers)[number];
    type Result = {
        offer: string;
        cards: OwnedCard[];
        pointsEarned: number;
        pointsSpent: number;
        boosters: number;
        held: { setId: number; count: number; name: string }[];
        points: number;
    };

    const names: ShopNames = {
        template: (id) => data.refs.templates[id]?.name,
        set: (id) => data.refs.sets[id]?.name,
    };

    // Exemplaires du joueur, avec ce qu'il faut pour les comparer aux critères des offres.
    let copies = $derived<CopyFacts[]>(
        data.mine.copies.map((c) => {
            const t = data.mine.templates[c.templateId];
            return { id: c.id, templateId: c.templateId, setId: t?.set?.id ?? null, rarity: t?.rarity ?? 1, wear: c.wear, pinned: c.pinned };
        }),
    );
    let copyById = $derived(new Map(data.mine.copies.map((c) => [c.id, c])));

    /** Ce qu'il manque au joueur pour cette offre, ou null s'il peut payer. */
    function missing(offer: Offer): string | null {
        if (offer.price.points > data.points) return `Il te manque ${pointsLabel(offer.price.points - data.points)}`;
        const picks = suggestCards(offer.price.cards, copies);
        const short = offer.price.cards.findIndex((line, i) => picks[i].length < line.count);
        return short >= 0 ? "Il te manque des cartes" : null;
    }

    const matching = (line: PriceLine) => copies.filter((c) => matchesCriteria(line, c)).length;

    // ─── Échange en cours ───
    let current = $state<Offer | null>(null);
    let picks = $state<number[][]>([]);
    let result = $state<Result | null>(null);
    let error = $state("");
    let sending = $state(false);
    let dialogOpen = $state(false);

    function start(offer: Offer) {
        current = offer;
        picks = suggestCards(offer.price.cards, copies);
        result = null;
        error = "";
        dialogOpen = true;
    }

    function toggle(lineIndex: number, id: number) {
        const line = current!.price.cards[lineIndex];
        const list = picks[lineIndex];
        if (list.includes(id)) picks[lineIndex] = list.filter((x) => x !== id);
        else if (list.length < line.count) picks[lineIndex] = [...list, id];
        else picks[lineIndex] = [...list.slice(1), id];
    }

    let complete = $derived(!!current && current.price.cards.every((line, i) => picks[i]?.length === line.count));
    let usedElsewhere = (lineIndex: number, id: number) => picks.some((list, i) => i !== lineIndex && list.includes(id));

    /** Exemplaires qui conviennent à une ligne : ceux déjà choisis d'abord, puis les plus usés. */
    function candidates(line: PriceLine) {
        return copies.filter((c) => matchesCriteria(line, c)).sort((a, b) => Number(a.pinned) - Number(b.pinned) || b.wear - a.wear);
    }

    $effect(() => {
        if (!dialogOpen && result) {
            result = null;
            current = null;
        }
    });
</script>

<svelte:head>
    <title>Boutique : Last Fragment</title>
</svelte:head>

{#snippet thumb(templateId: number)}
    {@const t = data.refs.templates[templateId]}
    {#if t}
        <span class="thumb"><CollectibleCard card={t} lite label={t.name} /></span>
    {/if}
{/snippet}

<main>
    <header class="head">
        <div>
            <h1>Boutique</h1>
            <p class="muted">
                Cède des cartes contre des points, des boosters ou d’autres cartes. Les cartes cédées rejoignent la
                réserve du MJ.
            </p>
        </div>
        <div class="purse panel" aria-label="Tes points">
            <span class="muted small">Tes points</span>
            <strong>{data.points.toLocaleString("fr-FR")}</strong>
        </div>
    </header>

    {#if data.offers.length === 0}
        <p class="muted empty">Rien en boutique pour l’instant : le MJ prépare ses offres.</p>
    {:else}
        <div class="offers">
            {#each data.offers as offer (offer.id)}
                {@const lack = offer.blocked ? null : missing(offer)}
                <article class="offer panel" class:off={offer.blocked}>
                    <header>
                        <h2>{offer.name}</h2>
                        {#if offer.endsAt}
                            <span class="muted small">Encore <Countdown until={offer.endsAt} ondone={invalidateAll} /></span>
                        {/if}
                    </header>
                    {#if offer.description}<p class="desc">{offer.description}</p>{/if}

                    <div class="sides">
                        <section class="side get" aria-label="Tu reçois">
                            <h3>Tu reçois</h3>
                            <ul>
                                {#each offer.reward.cards as card, i (i)}
                                    <li>
                                        {#if card.templateId}
                                            {@render thumb(card.templateId)}
                                        {:else}
                                            <span class="mystery" style="--r: var(--rarity-{card.rarity ?? 3})" aria-hidden="true">?</span>
                                        {/if}
                                        <span>{rewardCardLabel(card, names)}</span>
                                    </li>
                                {/each}
                                {#each offer.reward.held as held (held.setId)}
                                    {@const set = data.refs.sets[held.setId]}
                                    <li>
                                        {#if set}
                                            <span class="pack"><PackModel pack={set.packs[0]} title={set.name} code={set.code} width="2.6rem" idle={false} /></span>
                                        {/if}
                                        <span>
                                            {held.count} booster{held.count > 1 ? "s" : ""} « {set?.name} »
                                            {#if set?.special}<em class="special">spécial</em>{/if}
                                        </span>
                                    </li>
                                {/each}
                                {#if offer.reward.boosters}
                                    <li><span class="gem" aria-hidden="true"></span><span>{offer.reward.boosters} booster{offer.reward.boosters > 1 ? "s" : ""} dans ta réserve</span></li>
                                {/if}
                                {#if offer.reward.points}
                                    <li><span class="coin" aria-hidden="true">✦</span><span>{pointsLabel(offer.reward.points)}</span></li>
                                {/if}
                            </ul>
                        </section>

                        <section class="side give" aria-label="Tu cèdes">
                            <h3>Tu cèdes</h3>
                            <ul>
                                {#each offer.price.cards as line, i (i)}
                                    {@const have = matching(line)}
                                    <li class:ok={have >= line.count}>
                                        {#if line.templateId}{@render thumb(line.templateId)}{/if}
                                        <span>
                                            {priceLineLabel(line, names)}
                                            <small class="have">{have >= line.count ? "✓" : "✗"} tu en as {have}</small>
                                        </span>
                                    </li>
                                {/each}
                                {#if offer.price.points}
                                    <li class:ok={data.points >= offer.price.points}>
                                        <span class="coin" aria-hidden="true">✦</span>
                                        <span>{pointsLabel(offer.price.points)}</span>
                                    </li>
                                {/if}
                                {#if !offer.price.cards.length && !offer.price.points}
                                    <li class="ok"><span>Rien : c’est offert</span></li>
                                {/if}
                            </ul>
                        </section>
                    </div>

                    <footer>
                        <span class="muted small">
                            {#if offer.perPlayer !== null && !offer.blocked}
                                {offer.perPlayer - offer.mine === 1 ? "Une fois" : `Encore ${offer.perPlayer - offer.mine} fois`} pour toi
                            {/if}
                            {#if offer.left !== null && !offer.blocked}{offer.perPlayer !== null ? " · " : ""}Plus que {offer.left}{/if}
                        </span>
                        <button type="button" class="btn btn-accent" disabled={!!offer.blocked || !!lack} onclick={() => start(offer)}>
                            {offer.blocked ?? lack ?? "Échanger"}
                        </button>
                    </footer>
                </article>
            {/each}
        </div>
    {/if}
</main>

<Modal bind:open={dialogOpen} title={result ? "Échange conclu" : (current?.name ?? "Échange")}>
    {#if result}
        <div class="result">
            {#if result.cards.length}
                <div class="received">
                    {#each result.cards as card (card.copy.id)}
                        <a class="got" href="/cartes/carte/{card.copy.id}">
                            <CollectibleCard card={card.template} copy={card.copy} tilt="hover" glow={card.template.rarity >= 3} label={card.template.name} />
                            <small>{card.template.name} · {rarityLabel(card.template.rarity)}</small>
                        </a>
                    {/each}
                </div>
            {/if}
            <ul class="gains">
                {#each result.held as h (h.setId)}
                    <li>+{h.count} booster{h.count > 1 ? "s" : ""} « {h.name} », à ouvrir dans l’onglet Boosters</li>
                {/each}
                {#if result.boosters}<li>+{result.boosters} booster{result.boosters > 1 ? "s" : ""} dans ta réserve</li>{/if}
                {#if result.pointsEarned}<li>+{pointsLabel(result.pointsEarned)}</li>{/if}
                <li class="muted">Il te reste {pointsLabel(result.points)}.</li>
            </ul>
            <div class="row">
                {#if result.held.length || result.boosters}<a class="btn btn-accent" href="/cartes">Ouvrir mes boosters</a>{/if}
                <button type="button" class="btn" onclick={() => (dialogOpen = false)}>Fermer</button>
            </div>
        </div>
    {:else if current}
        {@const offer = current}
        <form
            class="confirm"
            method="POST"
            action="?/redeem"
            use:enhance={() => {
                sending = true;
                error = "";
                return async ({ result: res }) => {
                    sending = false;
                    if (res.type === "success" && res.data?.redeemed) {
                        result = res.data.redeemed as Result;
                        await invalidateAll();
                    } else if (res.type === "failure") {
                        error = String(res.data?.error ?? "Échange impossible.");
                        await invalidateAll();
                    } else {
                        error = "Échange impossible, réessaie dans un instant.";
                    }
                };
            }}
        >
            <input type="hidden" name="offerId" value={offer.id} />
            <input type="hidden" name="picks" value={JSON.stringify(picks)} />

            {#each offer.price.cards as line, i (i)}
                <section class="line">
                    <h3>
                        {priceLineLabel(line, names)}
                        <span class="count" class:done={picks[i]?.length === line.count}>{picks[i]?.length ?? 0}/{line.count}</span>
                    </h3>
                    <div class="pick-grid">
                        {#each candidates(line) as c (c.id)}
                            {@const copy = copyById.get(c.id)}
                            {@const t = data.mine.templates[c.templateId]}
                            {@const on = picks[i]?.includes(c.id)}
                            {#if copy && t}
                                <button
                                    type="button"
                                    class="pick"
                                    class:on
                                    aria-pressed={on}
                                    disabled={!on && usedElsewhere(i, c.id)}
                                    onclick={() => toggle(i, c.id)}
                                >
                                    <CollectibleCard card={t} {copy} lite label={t.name} />
                                    <small>{formatSerial(copy.serial, t.maxPrints)} · {formatWear(copy.wear).slice(0, 5)}</small>
                                    {#if copy.pinned}<span class="pin">Vitrine</span>{/if}
                                    {#if on}<span class="check" aria-hidden="true">✓</span>{/if}
                                </button>
                            {/if}
                        {/each}
                    </div>
                </section>
            {/each}

            <p class="recap">
                {#if offer.price.points}Tu paies <strong>{pointsLabel(offer.price.points)}</strong> (il t’en restera {pointsLabel(data.points - offer.price.points)}).{/if}
                {#if offer.price.cards.length}Les cartes cochées partent dans la réserve du MJ : c’est définitif.{/if}
                {#if !offer.price.points && !offer.price.cards.length}Cette offre est gratuite.{/if}
            </p>
            {#if error}<p class="message-error" role="alert">{error}</p>{/if}
            <div class="row">
                <button class="btn btn-accent" disabled={sending || !complete}>{sending ? "Échange…" : "Confirmer l’échange"}</button>
                <button type="button" class="btn" onclick={() => (dialogOpen = false)}>Annuler</button>
            </div>
        </form>
    {/if}
</Modal>

<style>
    main {
        width: min(1000px, 94%);
        margin: 0 auto;
        padding: 1.5rem 0 3rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .head {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 1rem;
        flex-wrap: wrap;
    }

    h1 {
        font-size: 2.4rem;
    }

    .head p {
        max-width: 38rem;
    }

    .purse {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 8rem;
        padding: 0.6rem 1.2rem;
        border-color: color-mix(in srgb, var(--rarity-4) 50%, var(--border));
    }

    .purse strong {
        font-family: var(--titleFont);
        font-size: 1.8rem;
        line-height: 1.1;
        color: var(--rarity-4);
    }

    .small {
        font-size: 0.8rem;
    }

    .empty {
        text-align: center;
        padding: 3rem 0;
    }

    .offers {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 28rem), 1fr));
        gap: 1rem;
    }

    .offer {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .offer.off {
        opacity: 0.6;
    }

    .offer header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    h2 {
        font-size: 1.35rem;
    }

    .desc {
        font-size: 0.9rem;
        color: var(--muted);
    }

    .sides {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
    }

    .side {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        padding: 0.6rem;
        border-radius: var(--radius);
        background: rgba(255, 255, 255, 0.03);
    }

    .side.get {
        border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
    }

    .side.give {
        border: 1px dashed var(--border);
    }

    h3 {
        font-size: 0.75rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--muted);
    }

    .side ul {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
    }

    .side li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        line-height: 1.25;
    }

    .give li:not(.ok) {
        color: var(--muted);
    }

    .have {
        display: block;
        font-size: 0.75rem;
        color: var(--chance, #ca4444);
    }

    .give li.ok .have {
        color: var(--primary);
    }

    .thumb {
        flex-shrink: 0;
        width: 2.6rem;
    }

    .pack {
        flex-shrink: 0;
        width: 2.6rem;
        display: grid;
        place-items: center;
    }

    .mystery {
        flex-shrink: 0;
        width: 2.6rem;
        aspect-ratio: 63 / 88;
        display: grid;
        place-items: center;
        border-radius: 0.3rem;
        border: 2px solid var(--r);
        background: radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--r) 35%, transparent), rgba(0, 0, 0, 0.4));
        color: var(--r);
        font-family: var(--titleFont);
        font-size: 1.3rem;
    }

    .gem {
        flex-shrink: 0;
        width: 1.1rem;
        height: 1.4rem;
        margin: 0 0.75rem;
        clip-path: polygon(50% 0, 100% 35%, 50% 100%, 0 35%);
        background: linear-gradient(160deg, #fff, var(--accent));
    }

    .coin {
        flex-shrink: 0;
        width: 2.6rem;
        text-align: center;
        color: var(--rarity-4);
        font-size: 1.3rem;
    }

    .special {
        margin-left: 0.25rem;
        padding: 0 0.4rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--rarity-5) 25%, transparent);
        color: var(--rarity-5);
        font-size: 0.7rem;
        font-style: normal;
    }

    .offer footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-top: auto;
    }

    /* ─── Fenêtre d'échange ─── */

    .confirm,
    .result {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 0 1rem 1rem;
    }

    .line h3 {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
        font-size: 0.85rem;
        letter-spacing: 0;
        text-transform: none;
        color: var(--foreground);
        margin-bottom: 0.5rem;
    }

    .count {
        color: var(--chance, #ca4444);
        font-variant-numeric: tabular-nums;
    }

    .count.done {
        color: var(--primary);
    }

    .pick-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(5.2rem, 1fr));
        gap: 0.5rem;
        max-height: 40dvh;
        overflow-y: auto;
        padding: 0.2rem;
    }

    .pick {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.2rem;
        padding: 0.25rem;
        border: 2px solid transparent;
        border-radius: var(--radius);
        background: none;
        color: var(--foreground);
    }

    .pick.on {
        border-color: var(--accent);
        background: color-mix(in srgb, var(--accent) 12%, transparent);
    }

    .pick:disabled {
        opacity: 0.35;
    }

    .pick small {
        font-size: 0.65rem;
        font-variant-numeric: tabular-nums;
        color: var(--muted);
    }

    .pin {
        position: absolute;
        top: 0.3rem;
        left: 0.3rem;
        padding: 0 0.3rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.75);
        font-size: 0.6rem;
    }

    .check {
        position: absolute;
        top: 0.2rem;
        right: 0.2rem;
        width: 1.3rem;
        height: 1.3rem;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: var(--accent);
        color: var(--background);
        font-size: 0.8rem;
        font-weight: 700;
    }

    .recap {
        font-size: 0.85rem;
        color: var(--muted);
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .received {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.75rem;
    }

    .got {
        width: min(9rem, 40vw);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.3rem;
        color: var(--foreground);
        text-align: center;
    }

    .got small {
        font-size: 0.75rem;
    }

    .gains {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        font-size: 0.9rem;
    }

    @media (max-width: 520px) {
        .sides {
            grid-template-columns: 1fr;
        }
    }
</style>
