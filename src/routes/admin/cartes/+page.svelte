<script lang="ts">
    // Cartes du MJ : tous les modèles, filtrables, et la création en lot depuis les fiches.
    import { enhance } from "$app/forms";
    import Modal from "$lib/components/ui/Modal.svelte";
    import Tabs from "$lib/components/ui/Tabs.svelte";
    import CollectibleCard from "$lib/components/cards/CollectibleCard.svelte";
    import { thumbOf } from "$lib/components/cards/creator/ImageLibrary.svelte";
    import { matches } from "$lib/components/table/MediaPicker.svelte";
    import { CARD_TYPES, RARITIES, TEMPLATE_STATUSES, type TemplateStatus } from "$lib/cards/types";

    let { data, form } = $props();

    let query = $state("");
    let status = $state<"" | TemplateStatus>("");
    let setId = $state("");
    let type = $state("");

    let shown = $derived(
        data.templates.filter(
            (t) =>
                (!status || t.status === status) &&
                (!setId || String(t.set?.id ?? "aucune") === setId) &&
                (!type || t.type === type) &&
                (!query || matches(`${t.name} ${t.face.subtitle}`, query)),
        ),
    );

    const counts = $derived({
        brouillon: data.templates.filter((t) => t.status === "brouillon").length,
        publiee: data.templates.filter((t) => t.status === "publiee").length,
        retiree: data.templates.filter((t) => t.status === "retiree").length,
    });

    // ─── Création en lot ───
    let bulkOpen = $state(false);
    let bulkKind = $state<"personnage" | "monstre" | "objet">("personnage");
    let bulkQuery = $state("");
    let picked = $state<number[]>([]);
    let bulking = $state(false);
    let bulkRows = $derived(data.sources[bulkKind].filter((s) => matches(s.name, bulkQuery)));

    $effect(() => {
        bulkKind;
        picked = [];
    });

    function togglePick(id: number) {
        picked = picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id];
    }
</script>

<svelte:head>
    <title>Cartes : Espace MJ</title>
</svelte:head>

<main>
    <header class="head">
        <div>
            <h1>Cartes à collectionner</h1>
            <p class="muted">
                {data.templates.length} modèle{data.templates.length > 1 ? "s" : ""} · {data.stats.copies} exemplaire{data.stats.copies > 1 ? "s" : ""} imprimé{data.stats.copies > 1 ? "s" : ""} · {data.stats.opened} booster{data.stats.opened > 1 ? "s" : ""} ouvert{data.stats.opened > 1 ? "s" : ""}
                · un booster toutes les {Math.round((data.rules.minutes / 60) * 10) / 10} h, {data.rules.max} cumulables
            </p>
        </div>
        <div class="actions">
            <a class="btn btn-accent" href="/admin/cartes/nouvelle">Nouvelle carte</a>
            <button type="button" class="btn btn-players" onclick={() => (bulkOpen = true)}>Créer en lot</button>
            <a class="btn" href="/admin/cartes/series">Séries</a>
            <a class="btn" href="/admin/cartes/reglages">Réglages et boosters</a>
            <a class="btn" href="/cartes">Côté joueur</a>
        </div>
    </header>

    {#if form?.created !== undefined}
        <p class="message-success" role="status">
            {form.created} carte{form.created > 1 ? "s" : ""} créée{form.created > 1 ? "s" : ""} en brouillon.
            {#if form.failed?.length}<span class="message-error">Échecs : {form.failed.join(" · ")}</span>{/if}
        </p>
    {/if}
    {#if form?.error}<p class="message-error" role="alert">{form.error}</p>{/if}

    <div class="filters">
        <input type="search" placeholder="Chercher une carte…" bind:value={query} aria-label="Chercher une carte" />
        <select bind:value={setId} aria-label="Série">
            <option value="">Toutes les séries</option>
            <option value="aucune">Hors série</option>
            {#each data.sets as s (s.id)}<option value={String(s.id)}>{s.code} · {s.name}</option>{/each}
        </select>
        <select bind:value={type} aria-label="Type">
            <option value="">Tous les types</option>
            {#each Object.entries(CARD_TYPES) as [key, t] (key)}<option value={key}>{t.label}</option>{/each}
        </select>
    </div>
    <Tabs
        bind:value={status}
        label="Statut"
        options={[
            { value: "", label: "Toutes", badge: data.templates.length },
            ...Object.entries(TEMPLATE_STATUSES).map(([value, label]) => ({
                value: value as TemplateStatus,
                label,
                badge: counts[value as TemplateStatus],
            })),
        ]}
    />

    {#if data.templates.length === 0}
        <div class="empty panel">
            <p>Aucune carte pour l’instant.</p>
            <p class="muted">Commence par une carte à la main, ou crée d’un coup les cartes de tes personnages.</p>
        </div>
    {:else}
        <div class="grid">
            {#each shown as t (t.id)}
                <div class="item">
                    <a class="open" href="/admin/cartes/{t.id}">
                        <CollectibleCard card={t} lite tilt="hover" />
                    </a>
                    <span class="meta">
                        <span class="status s-{t.status}">{TEMPLATE_STATUSES[t.status]}</span>
                        <span class="muted">{t.copies}{t.maxPrints ? `/${t.maxPrints}` : ""} ex.</span>
                        {#if !t.inAll}<span class="muted" title="Ne tombe pas du booster All">hors All</span>{/if}
                        <!-- Copie en brouillon, ouverte aussitôt dans l'éditeur. -->
                        <form class="dup" method="POST" action="/admin/cartes/{t.id}?/duplicate" use:enhance>
                            <button class="btn btn-small" title="Dupliquer {t.name}" aria-label="Dupliquer {t.name}">⧉</button>
                        </form>
                    </span>
                </div>
            {:else}
                <p class="muted">Aucune carte ne correspond.</p>
            {/each}
        </div>
    {/if}
</main>

<Modal bind:open={bulkOpen} title="Créer en lot" side>
    <p class="muted small">
        Une carte en brouillon par fiche cochée, remplie depuis la fiche (portrait, dragons, stats, citation). Tu
        les retouches ensuite une par une.
    </p>
    <Tabs
        bind:value={bulkKind}
        label="Fiches"
        options={[
            { value: "personnage", label: "Personnages" },
            { value: "monstre", label: "Bestiaire" },
            { value: "objet", label: "Objets" },
        ]}
    />
    <form
        method="POST"
        action="?/bulk"
        class="bulk"
        use:enhance={() => {
            bulking = true;
            return async ({ update }) => {
                await update();
                bulking = false;
                bulkOpen = false;
                picked = [];
            };
        }}
    >
        <input type="hidden" name="kind" value={bulkKind} />
        {#each picked as id (id)}<input type="hidden" name="ids" value={id} />{/each}
        <div class="bulk-options">
            <select name="setId" aria-label="Série">
                <option value="">Hors série</option>
                {#each data.sets as s (s.id)}<option value={s.id}>{s.code} · {s.name}</option>{/each}
            </select>
            {#if bulkKind !== "objet"}
                <select name="rarity" aria-label="Rareté">
                    {#each RARITIES as label, i (label)}<option value={i + 1}>{label}</option>{/each}
                </select>
            {/if}
        </div>
        <div class="bulk-tools">
            <input type="search" placeholder="Chercher…" bind:value={bulkQuery} aria-label="Chercher une fiche" />
            <button
                type="button"
                class="btn btn-small"
                onclick={() => (picked = bulkRows.filter((r) => !r.carded).map((r) => r.id))}
            >
                Tout sans carte
            </button>
            <button type="button" class="btn btn-small" onclick={() => (picked = [])}>Aucune</button>
        </div>
        <ul>
            {#each bulkRows as row (row.id)}
                <li>
                    <label class:carded={row.carded}>
                        <input type="checkbox" checked={picked.includes(row.id)} onchange={() => togglePick(row.id)} />
                        {#if row.image}<img src={thumbOf(row.image)} alt="" loading="lazy" />{:else}<span class="blank"></span>{/if}
                        <span>{row.name}</span>
                        {#if row.carded}<small class="muted">déjà en carte</small>{/if}
                    </label>
                </li>
            {/each}
        </ul>
        <button class="btn btn-accent" disabled={picked.length === 0 || bulking}>
            {bulking ? "Création…" : `Créer ${picked.length} carte${picked.length > 1 ? "s" : ""}`}
        </button>
    </form>
</Modal>

<style>
    select {
        padding-top: 0;
        padding-bottom: 0;
    }

    main {
        width: min(1300px, 94%);
        margin: 0 auto;
        padding: 2rem 0 4rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .head {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-end;
    }

    h1 {
        font-size: 2.2rem;
    }

    .head p {
        font-size: 0.85rem;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .filters {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        gap: 0.5rem;
    }

    .filters input,
    .filters select {
        height: 42px;
        font-size: 17px;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
        gap: 1.25rem 1rem;
    }

    .item {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        color: var(--foreground);
        content-visibility: auto;
        contain-intrinsic-size: 170px 270px;
    }

    .open {
        color: inherit;
    }

    .dup {
        margin-left: auto;
    }

    .dup .btn {
        padding: 0.1rem 0.5rem;
        font-size: 0.95rem;
        line-height: 1.2;
    }

    .meta {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        font-size: 0.72rem;
    }

    .status {
        padding: 0.05rem 0.5rem;
        border-radius: 999px;
        border: 1px solid var(--border);
    }

    .s-publiee {
        border-color: var(--primary);
        color: var(--primary);
    }

    .s-retiree {
        border-color: var(--danger);
        color: #ff9c9c;
    }

    .empty {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .small {
        font-size: 0.8rem;
    }

    .bulk {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .bulk-options,
    .bulk-tools {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .bulk select,
    .bulk input[type="search"] {
        height: 40px;
        font-size: 16px;
    }

    .bulk ul {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        max-height: 50dvh;
        overflow: auto;
    }

    .bulk label {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.3rem 0.4rem;
        border-radius: var(--radius);
        font-size: 0.85rem;
        cursor: pointer;
    }

    .bulk label:hover {
        background: var(--surface-raised);
    }

    .bulk label.carded span {
        opacity: 0.6;
    }

    .bulk img,
    .blank {
        width: 36px;
        height: 36px;
        object-fit: contain;
        border-radius: 4px;
        background: #2a2a2a;
    }

    @media (max-width: 700px) {
        .filters {
            grid-template-columns: 1fr 1fr;
        }

        .filters input {
            grid-column: 1 / -1;
        }

        .grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
</style>
