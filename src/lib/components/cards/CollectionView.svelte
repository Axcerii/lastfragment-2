<script lang="ts">
    // Collection d'un joueur. On arrive sur les albums : la liste des séries avec leur remplissage
    // (le dernier album ouvert d'emblée), et l'album lui-même où les cartes manquantes restent des
    // cases numérotées. Les Unique ne comptent pas dans les 100 % : leur case n'apparaît qu'une fois
    // obtenue et fait déborder l'album. La vue « Cartes » liste les exemplaires par pages, pour ne
    // pas dessiner des centaines de cartes d'un coup sur un téléphone.
    import type { Snippet } from "svelte";
    import { fade } from "svelte/transition";
    import { matches } from "$lib/components/table/MediaPicker.svelte";
    import { CARD_TYPES, padNumber, RARITIES, UNIQUE_RARITY, type CopyView, type TemplateView } from "$lib/cards/types";
    import CardInspector from "./CardInspector.svelte";
    import CollectibleCard from "./CollectibleCard.svelte";

    interface Collection {
        templates: Record<number, TemplateView>;
        copies: (CopyView & { templateId: number })[];
        album: {
            id: number;
            name: string;
            code: string;
            color: string;
            logo: string | null;
            slots: { number: number; rarity: number; templateId: number; owned: number }[];
        }[];
    }

    let {
        collection,
        initialAlbum = null,
        actions,
    }: {
        collection: Collection;
        /** Dernier album ouvert (cookie lu par le serveur). */
        initialAlbum?: number | null;
        actions?: Snippet<[CopyView]>;
    } = $props();

    const PAGE_SIZE = 24;

    let view = $state<"album" | "cartes">("album");
    let query = $state("");
    let type = $state("");
    let rarity = $state(0);
    let setId = $state("");
    let dupes = $state(false);
    let sort = $state<"recent" | "rarete" | "numero" | "nom">("recent");
    let pageIndex = $state(0);

    // Une pile par modèle, l'exemplaire le moins usé en premier.
    let stacks = $derived.by(() => {
        const map = new Map<number, (CopyView & { templateId: number })[]>();
        for (const copy of collection.copies) {
            const list = map.get(copy.templateId) ?? [];
            list.push(copy);
            map.set(copy.templateId, list);
        }
        return [...map.entries()].map(([id, copies]) => ({
            template: collection.templates[id],
            copies: copies.sort((a, b) => a.wear - b.wear),
            latest: Math.max(...copies.map((c) => c.id)),
        }));
    });
    let stackOf = $derived(new Map(stacks.map((s) => [s.template.id, s])));

    // ─── Albums : remplissage ───
    function progress(slots: { rarity: number; owned: number }[]) {
        const base = slots.filter((s) => s.rarity < UNIQUE_RARITY);
        const owned = base.filter((s) => s.owned > 0).length;
        const uniques = slots.filter((s) => s.rarity >= UNIQUE_RARITY && s.owned > 0).length;
        const total = base.length;
        // Arrondi vers le bas : 99,6 % n'affiche pas 100 % tant qu'il manque une carte.
        const percent = total ? Math.floor(((owned + uniques) / total) * 100) : uniques ? 100 : 0;
        return { owned, total, uniques, percent, complete: total > 0 && owned === total };
    }

    let albums = $derived(collection.album.map((set) => ({ ...set, progress: progress(set.slots) })));
    let overall = $derived(progress(collection.album.flatMap((s) => s.slots)));

    let chosen = $state<number | null>(null);
    let albumId = $derived.by(() => {
        const exists = (id: number | null) => id !== null && albums.some((a) => a.id === id);
        return exists(chosen) ? chosen : exists(initialAlbum) ? initialAlbum : (albums[0]?.id ?? null);
    });
    let current = $derived(albums.find((a) => a.id === albumId) ?? null);

    function openAlbum(id: number) {
        chosen = id;
        // Retenu un an, et seulement pour les pages des cartes.
        document.cookie = `cartes_album=${id}; path=/cartes; max-age=31536000; samesite=lax`;
    }

    // ─── Cartes : filtres et pages ───
    let shown = $derived(
        stacks
            .filter(
                (s) =>
                    (!query || matches(`${s.template.name} ${s.template.face.subtitle}`, query)) &&
                    (!type || s.template.type === type) &&
                    (!rarity || s.template.rarity === rarity) &&
                    (!setId || String(s.template.set?.id ?? "aucune") === setId) &&
                    (!dupes || s.copies.length > 1),
            )
            .sort((a, b) => {
                if (sort === "rarete") return b.template.rarity - a.template.rarity || b.latest - a.latest;
                if (sort === "nom") return a.template.name.localeCompare(b.template.name);
                if (sort === "numero") {
                    const sa = a.template.set?.code ?? "~";
                    const sb = b.template.set?.code ?? "~";
                    return sa.localeCompare(sb) || (a.template.number ?? 0) - (b.template.number ?? 0);
                }
                return b.latest - a.latest;
            }),
    );
    let pages = $derived(Math.max(1, Math.ceil(shown.length / PAGE_SIZE)));
    let paged = $derived(shown.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE));

    // Un filtre qui change ramène à la première page.
    $effect.pre(() => {
        void [query, type, rarity, setId, dupes, sort];
        pageIndex = 0;
    });

    let gridTop: HTMLElement | undefined = $state();
    function goTo(index: number) {
        pageIndex = Math.min(pages - 1, Math.max(0, index));
        gridTop?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    let pinned = $derived(collection.copies.filter((c) => c.pinned));
    let sets = $derived(
        [...new Map(stacks.filter((s) => s.template.set).map((s) => [s.template.set!.id, s.template.set!])).values()],
    );

    // ─── Vue détaillée ───
    let inspected = $state<{ templateId: number; index: number } | null>(null);
    let inspectedStack = $derived(inspected ? stackOf.get(inspected.templateId) : null);

    function inspect(templateId: number, copyId?: number) {
        const stack = stackOf.get(templateId);
        if (!stack) return;
        inspected = { templateId, index: Math.max(0, stack.copies.findIndex((c) => c.id === copyId)) };
    }

    const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;
</script>

{#snippet meter(p: ReturnType<typeof progress>, active: boolean, big = false)}
    <span
        class="meter"
        class:active
        class:big
        class:over={p.percent > 100}
        class:complete={p.complete}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={p.percent}
        aria-label="{p.percent} %"
    >
        <span class="fill" style="width: {Math.min(100, p.percent)}%"></span>
    </span>
{/snippet}

<section class="overall" aria-label="Progression de la collection">
    <div class="overall-head">
        <span class="label">Collection complète</span>
        <strong class="pct" class:over={overall.percent > 100}>{overall.percent} %</strong>
    </div>
    {@render meter(overall, true, true)}
    <div class="overall-foot muted">
        <span>{overall.owned}/{overall.total} cartes jusqu’à Légendaire</span>
        {#if overall.uniques}<span class="unique-count">+{plural(overall.uniques, "Unique")}</span>{/if}
        <span class="sep">·</span>
        <span>{plural(collection.copies.length, "exemplaire")}</span>
    </div>
</section>

<div class="views" role="tablist" aria-label="Affichage">
    <span class="views-pill" class:right={view === "cartes"} aria-hidden="true"></span>
    <button type="button" role="tab" aria-selected={view === "album"} class:on={view === "album"} onclick={() => (view = "album")}>
        Albums
    </button>
    <button type="button" role="tab" aria-selected={view === "cartes"} class:on={view === "cartes"} onclick={() => (view = "cartes")}>
        Cartes <span class="tab-count">{stacks.length}</span>
    </button>
</div>

{#if view === "album"}
    {#if albums.length === 0}
        <p class="muted empty">Aucune série pour l’instant.</p>
    {:else}
        <div class="albums" role="list" aria-label="Albums">
            {#each albums as album (album.id)}
                <button
                    type="button"
                    role="listitem"
                    class="album-tile"
                    class:on={album.id === albumId}
                    style="--c: {album.color}"
                    aria-current={album.id === albumId ? "true" : undefined}
                    onclick={() => openAlbum(album.id)}
                >
                    <span class="tile-head">
                        {#if album.logo}<img src={album.logo} alt="" />{:else}<span class="tile-code">{album.code}</span>{/if}
                        <span class="tile-name">{album.name}</span>
                        <strong class="tile-pct" class:over={album.progress.percent > 100}>{album.progress.percent} %</strong>
                    </span>
                    {@render meter(album.progress, album.id === albumId)}
                    <span class="tile-foot muted">
                        {album.progress.owned}/{album.progress.total}
                        {#if album.progress.uniques}<span class="unique-count">+{album.progress.uniques} ★</span>{/if}
                        {#if album.progress.complete}<span class="done">Complet</span>{/if}
                    </span>
                </button>
            {/each}
        </div>

        {#if current}
            {#key current.id}
                <section class="album" style="--c: {current.color}" in:fade={{ duration: 220 }}>
                    <header class="album-head">
                        {#if current.logo}<img src={current.logo} alt="" />{/if}
                        <div>
                            <span class="kicker">{current.code}</span>
                            <h2>{current.name}</h2>
                        </div>
                        <strong class="pct" class:over={current.progress.percent > 100}>{current.progress.percent} %</strong>
                    </header>
                    {@render meter(current.progress, true, true)}
                    <p class="muted hint">
                        {#if current.progress.complete}
                            Album complet !
                            {#if current.progress.uniques}Et {plural(current.progress.uniques, "Unique")} en prime.{:else}Il reste peut-être des Unique à découvrir…{/if}
                        {:else}
                            Encore {plural(current.progress.total - current.progress.owned, "carte")} pour compléter l’album.
                        {/if}
                    </p>
                    <div class="grid">
                        {#each current.slots as slot (slot.templateId)}
                            {#if slot.owned > 0 && collection.templates[slot.templateId]}
                                <button
                                    type="button"
                                    class="tile"
                                    class:unique={slot.rarity >= UNIQUE_RARITY}
                                    onclick={() => inspect(slot.templateId)}
                                >
                                    <CollectibleCard
                                        card={collection.templates[slot.templateId]}
                                        copy={stackOf.get(slot.templateId)?.copies[0]}
                                        lite
                                        tilt="hover"
                                        glow={slot.rarity >= UNIQUE_RARITY}
                                    />
                                    {#if slot.rarity >= UNIQUE_RARITY}<span class="unique-tag">Unique</span>{/if}
                                    {#if slot.owned > 1}<span class="count">×{slot.owned}</span>{/if}
                                </button>
                            {:else}
                                <div class="missing" style="--r: var(--rarity-{slot.rarity})">
                                    <span class="num">{padNumber(slot.number)}</span>
                                    <span class="code">{current.code}</span>
                                </div>
                            {/if}
                        {/each}
                    </div>
                </section>
            {/key}
        {/if}
    {/if}
{:else}
    {#if pinned.length}
        <section class="showcase" aria-label="Vitrine">
            <h2>Vitrine</h2>
            <div class="row">
                {#each pinned as copy (copy.id)}
                    <button type="button" class="tile" onclick={() => inspect(copy.templateId, copy.id)}>
                        <CollectibleCard card={collection.templates[copy.templateId]} {copy} lite tilt="hover" glow />
                    </button>
                {/each}
            </div>
        </section>
    {/if}

    <div class="bar" bind:this={gridTop}>
        <input type="search" placeholder="Chercher…" bind:value={query} aria-label="Chercher une carte" />
        <select bind:value={sort} aria-label="Trier">
            <option value="recent">Récentes</option>
            <option value="rarete">Rareté</option>
            <option value="numero">Numéro</option>
            <option value="nom">Nom</option>
        </select>
    </div>
    <div class="filters">
        <select bind:value={type} aria-label="Type">
            <option value="">Tous types</option>
            {#each Object.entries(CARD_TYPES) as [key, t] (key)}<option value={key}>{t.label}</option>{/each}
        </select>
        <select bind:value={rarity} aria-label="Rareté">
            <option value={0}>Toutes raretés</option>
            {#each RARITIES as label, i (label)}<option value={i + 1}>{label}</option>{/each}
        </select>
        <select bind:value={setId} aria-label="Série">
            <option value="">Toutes séries</option>
            <option value="aucune">Hors série</option>
            {#each sets as s (s.id)}<option value={String(s.id)}>{s.code}</option>{/each}
        </select>
        <label class="check"><input type="checkbox" bind:checked={dupes} /> Doublons</label>
    </div>

    {#if collection.copies.length === 0}
        <p class="muted empty">Aucune carte pour l’instant.</p>
    {:else}
        <div class="grid">
            {#each paged as stack (stack.template.id)}
                <button type="button" class="tile" onclick={() => inspect(stack.template.id)} aria-label="{stack.template.name}, {stack.copies.length} exemplaire(s)">
                    {#if stack.copies.length > 1}<span class="stacked" aria-hidden="true"></span>{/if}
                    <CollectibleCard card={stack.template} copy={stack.copies[0]} lite tilt="hover" />
                    {#if stack.copies.length > 1}<span class="count">×{stack.copies.length}</span>{/if}
                </button>
            {:else}
                <p class="muted">Aucune carte ne correspond.</p>
            {/each}
        </div>
        {#if pages > 1}
            <nav class="pager" aria-label="Pages">
                <button type="button" class="btn btn-small" disabled={pageIndex === 0} onclick={() => goTo(pageIndex - 1)} aria-label="Page précédente">‹</button>
                <span>Page <strong>{pageIndex + 1}</strong> sur {pages}</span>
                <button type="button" class="btn btn-small" disabled={pageIndex >= pages - 1} onclick={() => goTo(pageIndex + 1)} aria-label="Page suivante">›</button>
            </nav>
        {/if}
    {/if}
{/if}

{#if inspected && inspectedStack}
    <CardInspector
        template={inspectedStack.template}
        copies={inspectedStack.copies}
        bind:selected={inspected.index}
        onclose={() => (inspected = null)}
        {actions}
    />
{/if}

<style>
    /* ─── Barres de remplissage ─── */
    .meter {
        position: relative;
        display: block;
        height: 6px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        overflow: hidden;
    }

    .meter.big {
        height: 12px;
    }

    .fill {
        position: absolute;
        inset: 0 auto 0 0;
        border-radius: inherit;
        background: rgba(255, 255, 255, 0.35);
        transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        animation: grow 1s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .meter.active .fill {
        background: linear-gradient(90deg, color-mix(in srgb, var(--Pura) 70%, #000), var(--Pura) 70%, color-mix(in srgb, var(--Pura) 60%, #fff));
        box-shadow: 0 0 10px color-mix(in srgb, var(--Pura) 60%, transparent);
    }

    /* Au-delà de 100 % : un reflet passe sans fin sur la barre pleine. */
    .meter.over .fill,
    .meter.complete.active .fill {
        background:
            linear-gradient(100deg, transparent 30%, rgba(255, 255, 255, 0.7) 50%, transparent 70%) 0 0 / 200% 100% no-repeat,
            linear-gradient(90deg, var(--Pura), color-mix(in srgb, var(--Pura) 50%, #fff), var(--Pura));
        animation:
            grow 1s cubic-bezier(0.22, 1, 0.36, 1),
            shine 2.4s 1s ease-in-out infinite;
    }

    .pct {
        flex-shrink: 0;
        font-family: var(--titleFont);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }

    .pct.over {
        color: var(--Pura);
        text-shadow: 0 0 12px color-mix(in srgb, var(--Pura) 70%, transparent);
    }

    .unique-count {
        color: var(--rarity-5);
        font-weight: 700;
    }

    /* ─── Progression globale ─── */
    .overall {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        padding: 1rem 1.1rem;
        border: 1px solid color-mix(in srgb, var(--Pura) 35%, transparent);
        border-radius: var(--radius);
        background:
            radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--Pura) 16%, transparent), transparent 55%),
            var(--surface);
    }

    .overall-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 1rem;
    }

    .overall .label {
        font-size: 0.8rem;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--muted);
    }

    .overall .pct {
        font-size: 2rem;
        line-height: 1;
    }

    .overall-foot {
        display: flex;
        flex-wrap: wrap;
        gap: 0.2rem 0.5rem;
        font-size: 0.8rem;
    }

    /* ─── Albums / Cartes ─── */
    .views {
        position: relative;
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-self: center;
        width: min(22rem, 100%);
        padding: 0.25rem;
        border: 1px solid var(--border);
        border-radius: 999px;
        background: var(--surface);
    }

    .views-pill {
        position: absolute;
        top: 0.25rem;
        bottom: 0.25rem;
        left: 0.25rem;
        width: calc(50% - 0.25rem);
        border-radius: 999px;
        background: var(--accent);
        box-shadow: 0 0 1rem color-mix(in srgb, var(--accent) 40%, transparent);
        transition: transform 0.4s cubic-bezier(0.34, 1.4, 0.5, 1);
    }

    .views-pill.right {
        transform: translateX(100%);
    }

    .views button {
        position: relative;
        z-index: 1;
        padding: 0.55rem 1rem;
        border: none;
        background: none;
        color: var(--foreground);
        font-size: 0.95rem;
        transition: color 0.3s ease;
    }

    .views button.on {
        color: var(--background);
        font-weight: 700;
    }

    .tab-count {
        font-size: 0.75rem;
        opacity: 0.7;
    }

    /* Liste des albums : défile de côté sur téléphone, en grille sur ordinateur. */
    .albums {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: minmax(11.5rem, 70%);
        gap: 0.6rem;
        overflow-x: auto;
        padding: 0.2rem 0.1rem 0.6rem;
        scroll-snap-type: x mandatory;
        scrollbar-width: thin;
    }

    .album-tile {
        scroll-snap-align: start;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        padding: 0.7rem 0.8rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--surface);
        color: var(--foreground);
        text-align: left;
        transition:
            border-color 0.3s ease,
            transform 0.25s ease,
            box-shadow 0.3s ease;
    }

    .album-tile:hover {
        transform: translateY(-2px);
        border-color: color-mix(in srgb, var(--c) 70%, transparent);
    }

    .album-tile.on {
        border-color: var(--Pura);
        background:
            linear-gradient(160deg, color-mix(in srgb, var(--Pura) 14%, transparent), transparent 60%),
            var(--surface-raised);
        box-shadow: 0 0.4rem 1.2rem color-mix(in srgb, var(--Pura) 20%, transparent);
    }

    .tile-head {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
    }

    .tile-head img {
        width: 1.6rem;
        height: 1.6rem;
        object-fit: contain;
        flex-shrink: 0;
    }

    .tile-code {
        flex-shrink: 0;
        font-size: 0.65rem;
        letter-spacing: 0.15em;
        color: var(--c);
    }

    .tile-name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: var(--titleFont);
        font-size: 1.1rem;
    }

    .tile-pct {
        font-size: 1rem;
    }

    .tile-foot {
        display: flex;
        gap: 0.4rem;
        align-items: center;
        font-size: 0.75rem;
        font-variant-numeric: tabular-nums;
    }

    .done {
        margin-left: auto;
        padding: 0 0.45rem;
        border-radius: 999px;
        background: var(--Pura);
        color: var(--background);
        font-weight: 700;
    }

    /* ─── Album ouvert ─── */
    .album {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }

    .album-head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .album-head img {
        width: 2.4rem;
        height: 2.4rem;
        object-fit: contain;
    }

    .album-head > div {
        flex: 1;
        min-width: 0;
    }

    .kicker {
        font-size: 0.7rem;
        letter-spacing: 0.25em;
        color: var(--c);
    }

    .album-head h2 {
        margin: 0;
        font-size: 1.6rem;
        line-height: 1.1;
    }

    .album-head .pct {
        font-size: 1.8rem;
    }

    .hint {
        font-size: 0.85rem;
        margin-bottom: 0.4rem;
    }

    h2 {
        font-size: 1.2rem;
        margin-bottom: 0.75rem;
    }

    .showcase .row {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(110px, 140px));
        gap: 0.75rem;
    }

    .bar {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        scroll-margin-top: 6rem;
    }

    .bar input,
    .bar select,
    .filters select {
        height: 38px;
        padding: 0 0.6rem;
        font-size: 16px;
        width: auto;
    }

    .bar input {
        flex: 1;
        min-width: 8rem;
    }

    .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        align-items: center;
    }

    .check {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.85rem;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 1rem 0.8rem;
    }

    .tile {
        position: relative;
        padding: 0;
        border: none;
        background: none;
        color: inherit;
        text-align: left;
        content-visibility: auto;
        contain-intrinsic-size: 140px 196px;
    }

    .tile:focus-visible {
        outline-offset: 4px;
    }

    /* Une Unique découverte : sa case n'existait pas avant, elle s'annonce. */
    .tile.unique {
        isolation: isolate;
        content-visibility: visible;
        animation: reveal 0.7s cubic-bezier(0.34, 1.4, 0.5, 1);
    }

    .tile.unique::before {
        content: "";
        position: absolute;
        inset: -4px;
        border-radius: 6%;
        background: conic-gradient(from var(--spin, 0deg), var(--rarity-5), var(--Pura), var(--rarity-3), var(--rarity-5));
        filter: blur(6px);
        opacity: 0.7;
        z-index: -1;
        animation: spin 4s linear infinite;
    }

    .unique-tag {
        position: absolute;
        left: 50%;
        top: -0.55rem;
        z-index: 2;
        transform: translateX(-50%);
        padding: 0.05rem 0.55rem;
        border-radius: 999px;
        background: var(--rarity-5);
        color: var(--background);
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        white-space: nowrap;
    }

    /* Une pile de doublons : une carte fantôme décalée derrière. */
    .stacked {
        position: absolute;
        inset: 0;
        transform: translate(5px, 5px) rotate(2deg);
        border-radius: 4.6%;
        background: var(--surface-raised);
        border: 1px solid var(--border);
    }

    .count {
        position: absolute;
        right: -0.3rem;
        bottom: -0.3rem;
        z-index: 2;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        background: var(--accent);
        color: var(--background);
        font-size: 0.75rem;
        font-weight: 700;
    }

    .missing {
        aspect-ratio: 63 / 88;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.2rem;
        border-radius: 4.6%;
        border: 1px dashed color-mix(in srgb, var(--r) 60%, transparent);
        background: repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.02) 0 8px, transparent 8px 16px), var(--surface);
        color: var(--muted);
    }

    .missing .num {
        font-family: var(--titleFont);
        font-size: 1.8rem;
        color: color-mix(in srgb, var(--r) 70%, var(--muted));
    }

    .missing .code {
        font-size: 0.65rem;
        letter-spacing: 0.2em;
    }

    .pager {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding-top: 0.5rem;
        font-variant-numeric: tabular-nums;
    }

    .pager .btn {
        min-width: 2.75rem;
        font-size: 1.2rem;
    }

    .empty {
        padding: 2rem 0;
    }

    @property --spin {
        syntax: "<angle>";
        inherits: false;
        initial-value: 0deg;
    }

    @keyframes grow {
        from {
            width: 0;
        }
    }

    @keyframes shine {
        from {
            background-position: 150% 0, 0 0;
        }
        to {
            background-position: -50% 0, 0 0;
        }
    }

    @keyframes spin {
        to {
            --spin: 360deg;
        }
    }

    @keyframes reveal {
        from {
            transform: scale(0.6) rotate(-6deg);
            opacity: 0;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .fill,
        .tile.unique,
        .tile.unique::before,
        .meter.over .fill,
        .meter.complete.active .fill {
            animation: none;
        }
    }

    @media (min-width: 701px) {
        .albums {
            grid-auto-flow: row;
            grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
            grid-auto-columns: auto;
            overflow: visible;
        }
    }

    @media (max-width: 600px) {
        .grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.8rem 0.5rem;
        }

        .count {
            font-size: 0.65rem;
        }

        .album-head h2 {
            font-size: 1.3rem;
        }

        .album-head .pct,
        .overall .pct {
            font-size: 1.6rem;
        }
    }

    @media (max-width: 380px) {
        .grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
</style>
