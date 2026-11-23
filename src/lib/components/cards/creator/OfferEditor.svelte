<script lang="ts">
    // Éditeur d'une offre de la boutique : ce que le joueur cède (fragments, cartes précises ou
    // cartes selon des critères) et ce qu'il reçoit (fragments, boosters, cartes). Le prix et la
    // récompense partent en JSON, revérifiés par le serveur (cards/shop.ts).
    import { untrack } from "svelte";
    import { enhance } from "$app/forms";
    import DateTimeInput from "./DateTimeInput.svelte";
    import {
        emptyCriteria,
        emptyPrice,
        emptyReward,
        fragmentsLabel,
        priceLineLabel,
        rewardCardLabel,
        SHOP_LIMITS,
        WEAR_KEYS,
        type ShopNames,
        type ShopPrice,
        type ShopReward,
    } from "$lib/cards/shop";
    import { padNumber, RARITIES, WEAR_TIERS } from "$lib/cards/types";

    type TemplateOption = { id: number; name: string; number: number | null; rarity: number; status: string; setId: number | null };
    type SetOption = { id: number; name: string; code: string; special: boolean };
    type Offer = {
        id: number;
        name: string;
        description: string;
        price: ShopPrice;
        reward: ShopReward;
        active: boolean;
        startsAt: string | null;
        endsAt: string | null;
        perPlayer: number | null;
        stock: number | null;
        sortOrder: number;
    };

    let {
        offer = null,
        templates,
        sets,
        onsaved,
        oncancel,
    }: {
        offer?: Offer | null;
        templates: TemplateOption[];
        sets: SetOption[];
        onsaved?: () => void;
        oncancel?: () => void;
    } = $props();

    const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

    let name = $state(untrack(() => offer?.name ?? ""));
    let description = $state(untrack(() => offer?.description ?? ""));
    let active = $state(untrack(() => offer?.active ?? false));
    let perPlayer = $state<number | null>(untrack(() => offer?.perPlayer ?? null));
    let stock = $state<number | null>(untrack(() => offer?.stock ?? null));
    let sortOrder = $state(untrack(() => offer?.sortOrder ?? 0));
    let price = $state<ShopPrice>(untrack(() => clone(offer?.price ?? emptyPrice())));
    let reward = $state<ShopReward>(untrack(() => clone(offer?.reward ?? emptyReward())));
    // Ligne de prix : carte précise ou critères (l'interrupteur vide l'autre mode).
    let precise = $state<boolean[]>(untrack(() => price.cards.map((l) => l.templateId !== null)));
    let randomCard = $state<boolean[]>(untrack(() => reward.cards.map((c) => c.templateId === null)));

    let error = $state("");
    let saving = $state(false);

    let setName = $derived(new Map(sets.map((s) => [s.id, s])));
    let names = $derived<ShopNames>({
        template: (id) => templates.find((t) => t.id === id)?.name,
        set: (id) => setName.get(id)?.name,
    });

    // Cartes groupées par série dans les listes de choix.
    let groups = $derived.by(() => {
        const bySet = new Map<number | null, TemplateOption[]>();
        for (const t of templates) bySet.set(t.setId, [...(bySet.get(t.setId) ?? []), t]);
        return [...bySet.entries()].map(([setId, list]) => ({
            label: setId === null ? "Hors série" : (setName.get(setId)?.name ?? "Série supprimée"),
            list,
        }));
    });

    const templateText = (t: TemplateOption) =>
        `${t.number ? `${padNumber(t.number)} · ` : ""}${t.name} (${RARITIES[t.rarity - 1]})${t.status === "brouillon" ? " — brouillon" : t.status === "retiree" ? " — retirée" : ""}`;

    const num = (v: unknown) => (v === "" || v === null || v === undefined ? null : Number(v));

    function addPriceLine() {
        price.cards.push({ count: 1, ...emptyCriteria() });
        precise.push(false);
    }

    function removePriceLine(i: number) {
        price.cards.splice(i, 1);
        precise.splice(i, 1);
    }

    function setPrecise(i: number, value: boolean) {
        precise[i] = value;
        const line = price.cards[i];
        if (value) {
            line.setId = null;
            line.rarity = null;
            line.rarityUp = false;
            line.templateId = templates[0]?.id ?? null;
        } else {
            line.templateId = null;
        }
    }

    function addRewardCard() {
        reward.cards.push({ count: 1, templateId: null, setId: null, rarity: null, wear: null });
        randomCard.push(true);
    }

    function removeRewardCard(i: number) {
        reward.cards.splice(i, 1);
        randomCard.splice(i, 1);
    }

    function setRandom(i: number, value: boolean) {
        randomCard[i] = value;
        const card = reward.cards[i];
        if (value) card.templateId = null;
        else {
            card.setId = null;
            card.rarity = null;
            card.templateId = templates.find((t) => t.status !== "brouillon")?.id ?? templates[0]?.id ?? null;
        }
    }

    function addHeld() {
        const first = sets.find((s) => !reward.held.some((h) => h.setId === s.id));
        if (first) reward.held.push({ setId: first.id, count: 1 });
    }

    let free = $derived(price.points === 0 && price.cards.length === 0);
    let summary = $derived.by(() => {
        const give = [
            ...price.cards.map((l) => priceLineLabel(l, names)),
            ...(price.points ? [fragmentsLabel(price.points)] : []),
        ];
        const get = [
            ...reward.cards.map((c) => rewardCardLabel(c, names)),
            ...reward.held.map((h) => `${h.count} booster${h.count > 1 ? "s" : ""} « ${names.set(h.setId) ?? "?"} »`),
            ...(reward.boosters ? [`${reward.boosters} booster${reward.boosters > 1 ? "s" : ""} de réserve`] : []),
            ...(reward.points ? [fragmentsLabel(reward.points)] : []),
        ];
        return { give: give.join(" + ") || "rien", get: get.join(" + ") || "rien" };
    });
</script>

<form
    class="editor"
    method="POST"
    action="?/save"
    use:enhance={() => {
        saving = true;
        error = "";
        return async ({ result, update }) => {
            saving = false;
            if (result.type === "failure") {
                error = String(result.data?.error ?? "Enregistrement impossible.");
                return;
            }
            await update({ reset: false });
            if (result.type === "success") onsaved?.();
        };
    }}
>
    <input type="hidden" name="id" value={offer?.id ?? ""} />
    <input type="hidden" name="price" value={JSON.stringify(price)} />
    <input type="hidden" name="reward" value={JSON.stringify(reward)} />

    <div class="fields">
        <label class="wide">Nom <input name="name" bind:value={name} maxlength={SHOP_LIMITS.name} required placeholder="Trois Communes contre une Rare" /></label>
        <label>Ordre <input type="number" name="sortOrder" bind:value={sortOrder} min="0" max="9999" /></label>
        <label class="wide">
            Description
            <input name="description" bind:value={description} maxlength={SHOP_LIMITS.description} placeholder="Facultatif" />
        </label>
        <label>Début <DateTimeInput name="startsAt" value={offer?.startsAt ?? null} /></label>
        <label>Fin <DateTimeInput name="endsAt" value={offer?.endsAt ?? null} /></label>
        <label>
            Par joueur
            <input type="number" name="perPlayer" min="1" max={SHOP_LIMITS.perPlayer} bind:value={perPlayer} placeholder="Sans limite" />
        </label>
        <label>
            En tout
            <input type="number" name="stock" min="1" max={SHOP_LIMITS.stock} bind:value={stock} placeholder="Sans limite" />
        </label>
    </div>

    <div class="sides">
        <fieldset>
            <legend>Le joueur cède</legend>
            <label class="inline">
                Fragments
                <input type="number" min="0" max={SHOP_LIMITS.points} bind:value={price.points} />
            </label>

            {#each price.cards as line, i (i)}
                <div class="line">
                    <div class="line-head">
                        <label class="inline">
                            <input type="number" min="1" max={SHOP_LIMITS.lineCount} bind:value={line.count} aria-label="Nombre de cartes" />
                            carte{line.count > 1 ? "s" : ""}
                        </label>
                        <div class="toggle" role="group" aria-label="Sorte de carte">
                            <button type="button" aria-pressed={!precise[i]} class:on={!precise[i]} onclick={() => setPrecise(i, false)}>Critères</button>
                            <button type="button" aria-pressed={precise[i]} class:on={precise[i]} onclick={() => setPrecise(i, true)}>Carte précise</button>
                        </div>
                        <button type="button" class="btn btn-small btn-danger" onclick={() => removePriceLine(i)} aria-label="Retirer la ligne">✕</button>
                    </div>
                    {#if precise[i]}
                        <select bind:value={line.templateId} aria-label="Carte">
                            {#each groups as g (g.label)}
                                <optgroup label={g.label}>
                                    {#each g.list as t (t.id)}<option value={t.id}>{templateText(t)}</option>{/each}
                                </optgroup>
                            {/each}
                        </select>
                    {:else}
                        <div class="criteria">
                            <select value={line.rarity ?? ""} onchange={(e) => { line.rarity = num(e.currentTarget.value); if (!line.rarity) line.rarityUp = false; }} aria-label="Rareté">
                                <option value="">Toute rareté</option>
                                {#each RARITIES as r, ri (r)}<option value={ri + 1}>{r}</option>{/each}
                            </select>
                            {#if line.rarity && line.rarity < RARITIES.length}
                                <label class="check"><input type="checkbox" bind:checked={line.rarityUp} /> ou plus</label>
                            {/if}
                            <select value={line.setId ?? ""} onchange={(e) => (line.setId = num(e.currentTarget.value))} aria-label="Série">
                                <option value="">Toute série</option>
                                {#each sets as s (s.id)}<option value={s.id}>{s.name}</option>{/each}
                            </select>
                        </div>
                    {/if}
                    <div class="criteria">
                        <select
                            value={line.wear ?? ""}
                            onchange={(e) => {
                                const v = e.currentTarget.value;
                                line.wear = (WEAR_KEYS as string[]).includes(v) ? (v as typeof line.wear) : null;
                                if (!line.wear) line.wearUp = false;
                            }}
                            aria-label="État d’usure"
                        >
                            <option value="">Tout état</option>
                            {#each WEAR_TIERS as w (w.key)}<option value={w.key}>{w.label}</option>{/each}
                        </select>
                        {#if line.wear && line.wear !== "neuve"}
                            <label class="check"><input type="checkbox" bind:checked={line.wearUp} /> ou mieux</label>
                        {/if}
                    </div>
                </div>
            {/each}
            {#if price.cards.length < SHOP_LIMITS.priceLines}
                <button type="button" class="btn btn-small" onclick={addPriceLine}>+ Des cartes</button>
            {/if}
        </fieldset>

        <fieldset>
            <legend>Le joueur reçoit</legend>
            <div class="row">
                <label class="inline">
                    Fragments
                    <input type="number" min="0" max={SHOP_LIMITS.points} bind:value={reward.points} />
                </label>
                <label class="inline">
                    Boosters de réserve
                    <input type="number" min="0" max={SHOP_LIMITS.boosters} bind:value={reward.boosters} />
                </label>
            </div>

            {#each reward.held as held, i (i)}
                <div class="line line-row">
                    <input type="number" min="1" max={SHOP_LIMITS.heldCount} bind:value={held.count} aria-label="Nombre de boosters" />
                    <span>booster{held.count > 1 ? "s" : ""}</span>
                    <select bind:value={held.setId} aria-label="Série du booster">
                        {#each sets as s (s.id)}<option value={s.id}>{s.name}{s.special ? " (spécial)" : ""}</option>{/each}
                    </select>
                    <button type="button" class="btn btn-small btn-danger" onclick={() => reward.held.splice(i, 1)} aria-label="Retirer">✕</button>
                </div>
            {/each}
            {#if reward.held.length < SHOP_LIMITS.held && sets.length}
                <button type="button" class="btn btn-small" onclick={addHeld}>+ Des boosters d’une série</button>
            {/if}

            {#each reward.cards as card, i (i)}
                <div class="line">
                    <div class="line-head">
                        <label class="inline">
                            <input type="number" min="1" max={SHOP_LIMITS.rewardCount} bind:value={card.count} aria-label="Nombre de cartes" />
                            carte{card.count > 1 ? "s" : ""}
                        </label>
                        <div class="toggle" role="group" aria-label="Sorte de carte">
                            <button type="button" aria-pressed={randomCard[i]} class:on={randomCard[i]} onclick={() => setRandom(i, true)}>Au hasard</button>
                            <button type="button" aria-pressed={!randomCard[i]} class:on={!randomCard[i]} onclick={() => setRandom(i, false)}>Carte précise</button>
                        </div>
                        <button type="button" class="btn btn-small btn-danger" onclick={() => removeRewardCard(i)} aria-label="Retirer la ligne">✕</button>
                    </div>
                    {#if randomCard[i]}
                        <div class="criteria">
                            <select value={card.rarity ?? ""} onchange={(e) => (card.rarity = num(e.currentTarget.value))} aria-label="Rareté">
                                <option value="">Rareté selon les taux des boosters</option>
                                {#each RARITIES as r, ri (r)}<option value={ri + 1}>{r}</option>{/each}
                            </select>
                            <select value={card.setId ?? ""} onchange={(e) => (card.setId = num(e.currentTarget.value))} aria-label="Série">
                                <option value="">Toute série</option>
                                {#each sets as s (s.id)}<option value={s.id}>{s.name}</option>{/each}
                            </select>
                        </div>
                    {:else}
                        <select bind:value={card.templateId} aria-label="Carte">
                            {#each groups as g (g.label)}
                                <optgroup label={g.label}>
                                    {#each g.list as t (t.id)}<option value={t.id}>{templateText(t)}</option>{/each}
                                </optgroup>
                            {/each}
                        </select>
                    {/if}
                    <select
                        value={card.wear ?? ""}
                        onchange={(e) => {
                            const v = e.currentTarget.value;
                            card.wear = (WEAR_KEYS as string[]).includes(v) ? (v as typeof card.wear) : null;
                        }}
                        aria-label="État de l’exemplaire"
                    >
                        <option value="">État tiré comme dans un booster</option>
                        {#each WEAR_TIERS as w (w.key)}<option value={w.key}>Toujours {w.label}</option>{/each}
                    </select>
                </div>
            {/each}
            {#if reward.cards.length < SHOP_LIMITS.rewardLines}
                <button type="button" class="btn btn-small" onclick={addRewardCard}>+ Des cartes</button>
            {/if}
        </fieldset>
    </div>

    <p class="summary">
        <strong>Le joueur cède</strong> {summary.give} · <strong>il reçoit</strong> {summary.get}
        {#if free && !perPlayer}<br /><span class="warn">Offre gratuite : fixe une limite par joueur.</span>{/if}
    </p>
    <p class="muted small">
        Les cartes cédées vont dans ta réserve. Une carte précise peut aussi demander un état (« Lyra, Neuve »). Une
        carte reçue au hasard est tirée parmi les cartes publiées qui conviennent, comme dans un booster.
    </p>

    {#if error}<p class="message-error" role="alert">{error}</p>{/if}
    <div class="foot">
        <label class="check"><input type="checkbox" name="active" bind:checked={active} /> Offre proposée aux joueurs</label>
        <span class="row">
            {#if oncancel}<button type="button" class="btn" onclick={oncancel}>Annuler</button>{/if}
            <button class="btn btn-accent" disabled={saving}>{saving ? "Enregistrement…" : offer ? "Enregistrer" : "Créer l’offre"}</button>
        </span>
    </div>
</form>

<style>
    .editor {
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
    }

    .fields {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.6rem;
    }

    .fields label {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        font-size: 0.8rem;
    }

    .fields .wide {
        grid-column: span 3;
    }

    .fields :global(input) {
        height: 38px;
        font-size: 15px;
    }

    .sides {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
    }

    fieldset {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
        min-width: 0;
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
    }

    legend {
        padding: 0 0.4rem;
        font-family: var(--titleFont);
        font-size: 1.1rem;
        color: var(--accent);
    }

    .line {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        padding: 0.5rem;
        border-radius: var(--radius);
        background: rgba(255, 255, 255, 0.04);
    }

    .line-head,
    .line-row,
    .criteria,
    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.4rem;
    }

    .line-head .btn-danger,
    .line-row .btn-danger {
        margin-left: auto;
    }

    .line-row select {
        flex: 1;
        min-width: 8rem;
    }

    .criteria select {
        flex: 1;
        min-width: 8rem;
    }

    select,
    input[type="number"] {
        height: 34px;
        font-size: 15px;
        padding: 0 0.4rem;
    }

    input[type="number"] {
        width: 5rem;
    }

    .line-head input[type="number"],
    .line-row input[type="number"] {
        width: 3.6rem;
    }

    .inline {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.85rem;
    }

    .check {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.85rem;
        white-space: nowrap;
    }

    .toggle {
        display: inline-flex;
        border: 1px solid var(--border);
        border-radius: 999px;
        overflow: hidden;
    }

    .toggle button {
        padding: 0.2rem 0.55rem;
        border: none;
        background: none;
        color: var(--muted);
        font-size: 0.8rem;
    }

    .toggle button.on {
        background: var(--primary);
        color: var(--background);
    }

    .summary {
        font-size: 0.9rem;
        padding: 0.6rem 0.75rem;
        border-left: 3px solid var(--accent);
        background: rgba(255, 255, 255, 0.03);
    }

    .warn {
        color: var(--secondary);
    }

    .small {
        font-size: 0.75rem;
    }

    .foot {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    @media (max-width: 800px) {
        .sides {
            grid-template-columns: 1fr;
        }

        .fields {
            grid-template-columns: 1fr 1fr;
        }

        .fields .wide {
            grid-column: span 2;
        }
    }
</style>
