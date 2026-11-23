<script lang="ts">
    // Boutique : une grille de vignettes, une par offre du MJ. Chacune montre ce qu'on reçoit (la
    // carte, le paquet ou les fragments, « ×5 » s'il y en a plusieurs) et, dessous, son prix. Un clic
    // ouvre le détail : ce qu'on cède à gauche, ce qu'on reçoit à droite, avec les cartes proposées
    // d'office pour payer (les doubles et les plus usées) ; le joueur peut en choisir d'autres.
    import { enhance } from "$app/forms";
    import { invalidateAll } from "$app/navigation";
    import Modal from "$lib/components/ui/Modal.svelte";
    import CollectibleCard from "$lib/components/cards/CollectibleCard.svelte";
    import Countdown from "$lib/components/cards/Countdown.svelte";
    import ShopVisual from "$lib/components/cards/ShopVisual.svelte";
    import Icon from "$lib/components/ui/Icon.svelte";
    import {
        matchesCriteria,
        FRAGMENT_ICON,
        fragmentsLabel,
        priceItems,
        priceLineLabel,
        rewardItems,
        suggestCards,
        type CopyFacts,
        type PriceLine,
        type ShopItem,
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

    /** Chaque offre avec ce qu'elle donne, ce qu'elle demande et ce qu'il manque au joueur. */
    let offers = $derived(
        data.offers
            .map((offer) => {
                const reward = rewardItems(offer.reward, names);
                const price = priceItems(offer.price, names);
                const picks = suggestCards(offer.price.cards, copies);
                const short = offer.price.cards.some((line, i) => picks[i].length < line.count);
                const lack = offer.blocked
                    ? null
                    : offer.price.points > data.points
                      ? `Il te manque ${fragmentsLabel(offer.price.points - data.points)}`
                      : short
                        ? "Il te manque des cartes"
                        : null;
                return { offer, reward, price, picks, lack };
            })
            // Les offres encore possibles d'abord, chacune dans l'ordre choisi par le MJ.
            .sort((a, b) => Number(!!a.offer.blocked) - Number(!!b.offer.blocked)),
    );
    type Entry = (typeof offers)[number];

    /** Le joueur a-t-il de quoi payer cet objet du prix ? */
    function affords(item: ShopItem, picks: number[][]) {
        if (item.kind === "fragments") return data.points >= item.count;
        return "line" in item && item.line !== undefined ? picks[item.line].length >= item.count : true;
    }

    const matching = (line: PriceLine) => copies.filter((c) => matchesCriteria(line, c)).length;
    const amount = (item: ShopItem) => (item.kind === "fragments" ? item.count.toLocaleString("fr-FR") : `×${item.count}`);

    function summary({ offer, reward, price, lack }: Entry) {
        const get = reward.map((i) => i.label).join(", ");
        const give = price.length ? price.map((i) => i.label).join(", ") : "rien, c’est offert";
        return `${offer.name}. Tu reçois ${get}. Tu cèdes ${give}.${offer.blocked ? ` ${offer.blocked}.` : lack ? ` ${lack}.` : ""}`;
    }

    // ─── Détail et échange ───
    // L'offre ouverte est relue après chaque rechargement (stock, fragments, cartes encore à soi).
    let currentId = $state<number | null>(null);
    let current = $derived(offers.find((e) => e.offer.id === currentId) ?? null);
    let view = $state<"detail" | "pick">("detail");
    let picks = $state<number[][]>([]);
    let result = $state<Result | null>(null);
    let error = $state("");
    let sending = $state(false);
    let dialogOpen = $state(false);

    function show(entry: Entry) {
        currentId = entry.offer.id;
        picks = entry.picks.map((list) => [...list]);
        view = "detail";
        result = null;
        error = "";
        dialogOpen = true;
    }

    function toggle(lineIndex: number, id: number) {
        const line = current!.offer.price.cards[lineIndex];
        const list = picks[lineIndex];
        if (list.includes(id)) picks[lineIndex] = list.filter((x) => x !== id);
        else if (list.length < line.count) picks[lineIndex] = [...list, id];
        else picks[lineIndex] = [...list.slice(1), id];
    }

    let complete = $derived(!!current && current.offer.price.cards.every((line, i) => picks[i]?.length === line.count));
    let usedElsewhere = (lineIndex: number, id: number) => picks.some((list, i) => i !== lineIndex && list.includes(id));

    /** Ce que dit le bouton de l'échange : ce qui l'empêche, ou « Confirmer ». */
    let action = $derived.by(() => {
        if (!current) return "";
        if (current.offer.blocked) return current.offer.blocked;
        if (current.lack) return current.lack;
        if (!complete) return "Choisis les cartes à céder";
        return "Confirmer l’échange";
    });
    let canConfirm = $derived(!!current && !current.offer.blocked && !current.lack && complete && !sending);

    /** Exemplaires qui conviennent à une ligne : hors vitrine d'abord, puis les plus usés. */
    function candidates(line: PriceLine) {
        return copies.filter((c) => matchesCriteria(line, c)).sort((a, b) => Number(a.pinned) - Number(b.pinned) || b.wear - a.wear);
    }

    $effect(() => {
        if (!dialogOpen && result) {
            result = null;
            currentId = null;
        }
    });
</script>

<svelte:head>
    <title>Boutique : Last Fragment</title>
</svelte:head>

<main>
    <header class="head">
        <div>
            <h1>Boutique</h1>
            <p class="muted">
                Cède des cartes ou des fragments contre d’autres cartes, des boosters ou des fragments. Touche une offre
                pour voir l’échange en détail.
            </p>
        </div>
        <div class="purse panel">
            <span class="muted small">Tes fragments</span>
            <strong>
                {data.points.toLocaleString("fr-FR")}
                <Icon src={FRAGMENT_ICON} color="var(--rarity-4)" size="1.4rem" label="fragments" />
            </strong>
        </div>
    </header>

    {#if offers.length === 0}
        <p class="muted empty">Rien en boutique pour l’instant : le MJ prépare ses offres.</p>
    {:else}
        <div class="grid">
            {#each offers as entry (entry.offer.id)}
                {@const { offer, reward, price, picks: suggested } = entry}
                {@const main = reward[0]}
                <button
                    type="button"
                    class="tile"
                    class:off={!!offer.blocked}
                    aria-label={summary(entry)}
                    onclick={() => show(entry)}
                >
                    <span class="stage">
                        {#if offer.endsAt || (offer.left !== null && !offer.blocked)}
                            <span class="tags">
                                {#if offer.endsAt}<span class="tag">⏳ <Countdown until={offer.endsAt} ondone={invalidateAll} /></span>{/if}
                                {#if offer.left !== null && !offer.blocked}<span class="tag">Plus que {offer.left}</span>{/if}
                            </span>
                        {/if}
                        {#if main}<ShopVisual item={main} refs={data.refs} size="lg" />{/if}
                        {#if reward.length > 1}
                            <span class="extras">
                                {#each reward.slice(1) as extra, i (i)}
                                    <span class="extra">+{amount(extra).replace("×", "")}<ShopVisual item={extra} refs={data.refs} size="xs" /></span>
                                {/each}
                            </span>
                        {/if}
                        {#if offer.blocked}<span class="ribbon">{offer.blocked}</span>{/if}
                    </span>
                    <span class="name">{offer.name}</span>
                    <span class="price">
                        {#each price as item, i (i)}
                            <span class="chip" class:lack={!offer.blocked && !affords(item, suggested)}>
                                <ShopVisual {item} refs={data.refs} size="xs" />
                                {amount(item)}
                            </span>
                        {:else}
                            <span class="chip free">Offert</span>
                        {/each}
                    </span>
                </button>
            {/each}
        </div>
        <p class="muted small note">
            Les cartes cédées rejoignent la réserve du MJ. Chaque doublon tiré d’un booster rapporte aussi des fragments :
            1 par Commune, 3 par Singulière, 8 par Rare, 50 par Légendaire (rien pour une Unique ou un tirage limité).
        </p>
    {/if}
</main>

<Modal bind:open={dialogOpen} wide title={result ? "Échange conclu" : (current?.offer.name ?? "Boutique")}>
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
                {#if result.pointsEarned}<li>+{fragmentsLabel(result.pointsEarned)}</li>{/if}
                <li class="muted">Il te reste {fragmentsLabel(result.points)}.</li>
            </ul>
            <div class="row">
                {#if result.held.length || result.boosters}<a class="btn btn-accent" href="/cartes">Ouvrir mes boosters</a>{/if}
                <button type="button" class="btn" onclick={() => (dialogOpen = false)}>Fermer</button>
            </div>
        </div>
    {:else if current}
        {@const { offer, reward, price } = current}
        {#if view === "pick"}
            <div class="picker">
                <p class="muted">Choisis les cartes que tu cèdes. Celles en vitrine passent en dernier.</p>
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
                <div class="row">
                    <button type="button" class="btn btn-accent" onclick={() => (view = "detail")}>Valider</button>
                </div>
            </div>
        {:else}
            <div class="detail">
                {#if offer.description}<p class="desc">{offer.description}</p>{/if}
                {#if offer.endsAt || offer.left !== null || offer.perPlayer !== null}
                    <p class="meta">
                        {#if offer.endsAt}<span>⏳ Encore <Countdown until={offer.endsAt} ondone={invalidateAll} /></span>{/if}
                        {#if offer.left !== null && !offer.blocked}<span>Plus que {offer.left} en stock</span>{/if}
                        {#if offer.perPlayer !== null && !offer.blocked}
                            <span>{offer.perPlayer - offer.mine === 1 ? "Une seule fois" : `Encore ${offer.perPlayer - offer.mine} fois`} pour toi</span>
                        {/if}
                    </p>
                {/if}

                <div class="trade">
                    <section class="side give" aria-label="Tu cèdes">
                        <h3>Tu cèdes</h3>
                        <ul>
                            {#each price as item, i (i)}
                                <li class:lack={!offer.blocked && !affords(item, current.picks)}>
                                    <ShopVisual {item} refs={data.refs} />
                                    <div class="what">
                                        <strong>{item.label}</strong>
                                        {#if item.kind === "fragments"}
                                            <small class="have">
                                                {data.points >= item.count
                                                    ? `Il t’en restera ${fragmentsLabel(data.points - item.count)}`
                                                    : `Tu n’en as que ${data.points.toLocaleString("fr-FR")}`}
                                            </small>
                                        {:else if "line" in item && item.line !== undefined}
                                            {@const line = offer.price.cards[item.line]}
                                            {@const chosen = picks[item.line] ?? []}
                                            <small class="have">Tu en as {matching(line)} qui conviennent</small>
                                            {#if chosen.length}
                                                <span class="chosen" aria-label="Cartes cédées">
                                                    {#each chosen as id (id)}
                                                        {@const copy = copyById.get(id)}
                                                        {@const t = copy ? data.mine.templates[copy.templateId] : undefined}
                                                        {#if copy && t}
                                                            <span class="mini" title="{t.name} · {formatSerial(copy.serial, t.maxPrints)} · {formatWear(copy.wear)}">
                                                                <CollectibleCard card={t} {copy} lite label={t.name} />
                                                            </span>
                                                        {/if}
                                                    {/each}
                                                </span>
                                            {/if}
                                        {/if}
                                    </div>
                                </li>
                            {:else}
                                <li class="free"><strong>Rien : c’est offert</strong></li>
                            {/each}
                        </ul>
                        {#if offer.price.cards.length && !offer.blocked && offer.price.cards.some((line) => matching(line) > 0)}
                            <button type="button" class="btn btn-small change" onclick={() => (view = "pick")}>Choisir d’autres cartes</button>
                        {/if}
                    </section>

                    <span class="arrow" aria-hidden="true">➜</span>

                    <section class="side get" aria-label="Tu reçois">
                        <h3>Tu reçois</h3>
                        <ul>
                            {#each reward as item, i (i)}
                                <li>
                                    <ShopVisual {item} refs={data.refs} />
                                    <div class="what">
                                        <strong>{item.label}</strong>
                                        {#if item.kind === "pack" && data.refs.sets[item.setId]?.special}<em class="special">Booster spécial</em>{/if}
                                        {#if item.kind === "pack" || item.kind === "booster"}<small class="muted">À ouvrir dans l’onglet Boosters</small>{/if}
                                        {#if item.kind === "random"}<small class="muted">Tirées au hasard parmi les cartes publiées</small>{/if}
                                    </div>
                                </li>
                            {/each}
                        </ul>
                    </section>
                </div>

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
                                // Une carte a pu changer de mains entre-temps : nouvelle proposition.
                                if (current) picks = current.picks.map((list) => [...list]);
                            } else {
                                error = "Échange impossible, réessaie dans un instant.";
                            }
                        };
                    }}
                >
                    <input type="hidden" name="offerId" value={offer.id} />
                    <input type="hidden" name="picks" value={JSON.stringify(picks)} />
                    {#if offer.price.cards.length && !offer.blocked && !current.lack}
                        <p class="recap">Les cartes cédées partent dans la réserve du MJ : c’est définitif.</p>
                    {/if}
                    {#if error}<p class="message-error" role="alert">{error}</p>{/if}
                    <div class="row">
                        <button class="btn btn-accent" disabled={!canConfirm}>{sending ? "Échange…" : action}</button>
                        <button type="button" class="btn" onclick={() => (dialogOpen = false)}>Fermer</button>
                    </div>
                </form>
            </div>
        {/if}
    {/if}
</Modal>

<style>
    main {
        width: min(1100px, 94%);
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
        max-width: 36rem;
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
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
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

    .note {
        max-width: 44rem;
    }

    /* ─── Grille des offres ─── */

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(9.5rem, 45%), 1fr));
        gap: 0.9rem;
    }

    .tile {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        padding: 0 0 0.7rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--surface);
        color: var(--foreground);
        text-align: center;
        overflow: hidden;
        cursor: pointer;
        transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;
    }

    .tile:hover,
    .tile:focus-visible {
        transform: translateY(-3px);
        border-color: var(--accent);
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);
    }

    .tile.off {
        opacity: 0.55;
    }

    .stage {
        position: relative;
        display: grid;
        place-items: center;
        min-height: 10rem;
        padding: 1.4rem 0.5rem 0.6rem;
        background:
            radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%),
            rgba(255, 255, 255, 0.025);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .tags {
        position: absolute;
        top: 0.35rem;
        left: 0.35rem;
        right: 0.35rem;
        display: flex;
        justify-content: space-between;
        gap: 0.25rem;
        flex-wrap: wrap;
        pointer-events: none;
    }

    .tag {
        padding: 0.05rem 0.4rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.6);
        font-size: 0.68rem;
        white-space: nowrap;
    }

    .extras {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 0.3rem;
        margin-top: 0.35rem;
    }

    .extra {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        padding: 0.05rem 0.45rem 0.05rem 0.5rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.45);
        font-size: 0.75rem;
        font-weight: 700;
    }

    .ribbon {
        position: absolute;
        top: 50%;
        left: -10%;
        right: -10%;
        z-index: 3;
        padding: 0.2rem 0;
        transform: translateY(-50%) rotate(-12deg);
        background: rgba(0, 0, 0, 0.8);
        border-block: 1px solid var(--border);
        font-family: var(--titleFont);
        font-size: 1rem;
        letter-spacing: 0.06em;
    }

    .name {
        padding: 0 0.6rem;
        font-family: var(--titleFont);
        font-size: 1.05rem;
        line-height: 1.2;
    }

    .price {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 0.3rem;
        padding: 0 0.5rem;
        margin-top: auto;
    }

    .chip {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.1rem 0.55rem 0.1rem 0.35rem;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.05);
        font-size: 0.85rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
    }

    .chip.lack {
        color: var(--danger);
        border-color: color-mix(in srgb, var(--danger) 55%, transparent);
    }

    .chip.free {
        padding: 0.1rem 0.6rem;
        color: var(--primary);
    }

    /* ─── Détail ─── */

    .detail,
    .picker,
    .result {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .desc {
        color: var(--muted);
    }

    .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem 1rem;
        font-size: 0.85rem;
        color: var(--muted);
    }

    .trade {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: stretch;
        gap: 0.75rem;
    }

    .arrow {
        align-self: center;
        font-size: 1.6rem;
        color: var(--accent);
    }

    .side {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        padding: 0.8rem;
        border-radius: var(--radius);
        background: rgba(255, 255, 255, 0.03);
    }

    .side.give {
        border: 1px dashed var(--border);
    }

    .side.get {
        border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
        background: color-mix(in srgb, var(--accent) 5%, transparent);
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
        gap: 0.7rem;
    }

    .side li {
        display: flex;
        align-items: center;
        gap: 0.7rem;
    }

    .what {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        min-width: 0;
        font-size: 0.9rem;
        line-height: 1.25;
    }

    .what small {
        font-size: 0.78rem;
    }

    .have {
        color: var(--primary);
    }

    li.lack .have,
    li.lack strong {
        color: var(--danger);
    }

    .free strong {
        color: var(--primary);
    }

    .chosen {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        margin-top: 0.2rem;
    }

    .mini {
        width: 1.9rem;
    }

    .change {
        align-self: flex-start;
    }

    .special {
        align-self: flex-start;
        padding: 0 0.45rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--rarity-5) 25%, transparent);
        color: var(--rarity-5);
        font-size: 0.72rem;
        font-style: normal;
    }

    .recap {
        font-size: 0.85rem;
        color: var(--muted);
    }

    /* ─── Choix des cartes ─── */

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
        color: var(--danger);
        font-variant-numeric: tabular-nums;
    }

    .count.done {
        color: var(--primary);
    }

    .pick-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(5.2rem, 1fr));
        gap: 0.5rem;
        max-height: 45dvh;
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

    .row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    /* ─── Échange conclu ─── */

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

    /* Sur téléphone, les deux côtés s'empilent : ce qu'on cède, puis ce qu'on reçoit. */
    @media (max-width: 640px) {
        .trade {
            grid-template-columns: 1fr;
        }

        .arrow {
            justify-self: center;
            transform: rotate(90deg);
        }
    }
</style>
