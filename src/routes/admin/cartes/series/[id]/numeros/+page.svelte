<script lang="ts">
    // Numéros des cartes d'une série : on range les cartes (glisser, flèches, tris), on numérote
    // dans l'ordre affiché ou à la main, et tout est enregistré d'un coup.
    import { enhance } from "$app/forms";
    import { duplicates, gaps, MAX_NUMBER } from "$lib/cards/numbering";
    import { padNumber, rarityLabel, TEMPLATE_STATUSES, isTemplateStatus } from "$lib/cards/types";

    let { data, form } = $props();

    type Row = (typeof data.templates)[number] & { next: number | null };

    let rows = $state<Row[]>([]);
    // Repart de ce qui est enregistré à chaque chargement (et après un enregistrement).
    $effect.pre(() => {
        rows = data.templates.map((t) => ({ ...t, next: t.number }));
    });

    let entries = $derived(rows.map((r) => ({ id: r.id, number: r.next })));
    let twice = $derived(duplicates(entries));
    let holes = $derived(gaps(entries));
    let changed = $derived(rows.filter((r) => r.next !== r.number));
    let owned = $derived(changed.filter((r) => r.copies > 0));
    let invalid = $derived(rows.some((r) => r.next !== null && !(Number.isInteger(r.next) && r.next >= 1 && r.next <= MAX_NUMBER)));

    // ─── Ordre ───
    function move(from: number, to: number) {
        if (to < 0 || to >= rows.length || from === to) return;
        const [row] = rows.splice(from, 1);
        rows.splice(to, 0, row);
    }

    const byNumber = (a: Row, b: Row) => (a.next ?? Infinity) - (b.next ?? Infinity) || a.id - b.id;
    const SORTS = {
        numero: { label: "N° actuel", compare: byNumber },
        rarete: { label: "Rareté puis nom", compare: (a: Row, b: Row) => a.rarity - b.rarity || a.name.localeCompare(b.name, "fr") },
        nom: { label: "Nom", compare: (a: Row, b: Row) => a.name.localeCompare(b.name, "fr") },
        statut: { label: "Publiées d’abord", compare: (a: Row, b: Row) => statusRank(a) - statusRank(b) || byNumber(a, b) },
    } as const;
    const statusRank = (r: Row) => (r.status === "publiee" ? 0 : r.status === "retiree" ? 1 : 2);

    function sortBy(key: keyof typeof SORTS) {
        rows = [...rows].sort(SORTS[key].compare);
    }

    /** 1, 2, 3… dans l'ordre affiché. */
    function numberInOrder() {
        rows.forEach((r, i) => (r.next = i + 1));
    }

    /** Resserre les numéros sans changer leur ordre ; les cartes sans numéro le restent. */
    function closeGaps() {
        rows = [...rows].sort(byNumber);
        let n = 1;
        for (const r of rows) if (r.next !== null) r.next = n++;
    }

    function reset() {
        rows = data.templates.map((t) => ({ ...t, next: t.number }));
    }

    function setNumber(row: Row, value: string) {
        const text = value.trim();
        row.next = text === "" ? null : Number(text);
    }

    // ─── Glisser-déposer (souris) ; au doigt, les flèches font le même travail ───
    let dragging = $state<number | null>(null);
    let over = $state<number | null>(null);

    function ondrop(index: number) {
        if (dragging !== null) move(dragging, index);
        dragging = over = null;
    }

    const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });
    function confirmSave(e: SubmitEvent) {
        if (owned.length && !confirm(`${owned.length} carte(s) déjà possédée(s) par des joueurs vont changer de numéro, sur tous leurs exemplaires. Continuer ?`)) {
            e.preventDefault();
        }
    }
</script>

<svelte:head>
    <title>Numéros · {data.set.name} : Espace MJ</title>
</svelte:head>

<main style="--c: {data.set.color}">
    <a class="back" href="/admin/cartes/series">← Séries</a>
    <header class="head">
        <h1>Numéros de « {data.set.name} »</h1>
        <span class="muted">{data.set.code} · {rows.length} carte{rows.length > 1 ? "s" : ""}</span>
    </header>

    {#if form?.error}<p class="message-error" role="alert">{form.error}</p>{/if}
    {#if form?.message}<p class="message-success" role="status">{form.message}</p>{/if}

    <section class="panel tools">
        <div class="group">
            <span class="muted small">Ranger par</span>
            {#each Object.entries(SORTS) as [key, sort] (key)}
                <button type="button" class="btn btn-small" onclick={() => sortBy(key as keyof typeof SORTS)}>{sort.label}</button>
            {/each}
        </div>
        <div class="group">
            <button type="button" class="btn btn-small btn-accent" onclick={numberInOrder}>Numéroter dans cet ordre (1, 2, 3…)</button>
            <button type="button" class="btn btn-small" onclick={closeGaps} disabled={holes.length === 0}>Combler les trous</button>
            <button type="button" class="btn btn-small" onclick={reset} disabled={changed.length === 0}>Annuler les changements</button>
        </div>
        <p class="muted small">
            Glisse les lignes (ou utilise les flèches) puis « Numéroter dans cet ordre », ou modifie un numéro à la main.
            Une case vide retire la carte de l’album de la série. Les Unique restent cachées tant qu’elles ne sont pas obtenues.
        </p>
    </section>

    {#if rows.length === 0}
        <p class="muted">Cette série n’a pas encore de carte.</p>
    {:else}
        <ol class="rows">
            {#each rows as row, i (row.id)}
                <li
                    class="row"
                    class:changed={row.next !== row.number}
                    class:clash={row.next !== null && twice.has(row.next)}
                    class:over={over === i && dragging !== i}
                    class:dragging={dragging === i}
                    style="--r: var(--rarity-{row.rarity})"
                    draggable="true"
                    ondragstart={(e) => {
                        dragging = i;
                        e.dataTransfer?.setData("text/plain", String(row.id));
                    }}
                    ondragover={(e) => {
                        e.preventDefault();
                        over = i;
                    }}
                    ondragend={() => (dragging = over = null)}
                    ondrop={(e) => {
                        e.preventDefault();
                        ondrop(i);
                    }}
                >
                    <span class="handle" aria-hidden="true">⋮⋮</span>
                    <span class="arrows">
                        <button type="button" onclick={() => move(i, i - 1)} disabled={i === 0} aria-label="Monter {row.name}">▲</button>
                        <button type="button" onclick={() => move(i, i + 1)} disabled={i === rows.length - 1} aria-label="Descendre {row.name}">▼</button>
                    </span>
                    <input
                        class="number"
                        type="number"
                        min="1"
                        max={MAX_NUMBER}
                        value={row.next ?? ""}
                        oninput={(e) => setNumber(row, e.currentTarget.value)}
                        aria-label="Numéro de {row.name}"
                    />
                    {#if row.thumb}<img src={row.thumb} alt="" loading="lazy" />{:else}<span class="blank"></span>{/if}
                    <span class="name">
                        <strong>{row.name}</strong>
                        <span class="muted small">
                            <i class="gem"></i>{rarityLabel(row.rarity)} · {isTemplateStatus(row.status) ? TEMPLATE_STATUSES[row.status] : row.status}
                            {#if row.copies}· {row.copies} exemplaire{row.copies > 1 ? "s" : ""}{/if}
                        </span>
                    </span>
                    <span class="was small">
                        {#if row.next !== row.number}
                            {padNumber(row.number)} → <b>{padNumber(row.next)}</b>
                        {:else}
                            {padNumber(row.number)}
                        {/if}
                    </span>
                    <a class="edit small" href="/admin/cartes/{row.id}" title="Ouvrir la carte">Ouvrir</a>
                </li>
            {/each}
        </ol>

        <form method="POST" action="?/save" class="panel save" use:enhance={keep} onsubmit={confirmSave}>
            <input type="hidden" name="numbers" value={JSON.stringify(entries)} />
            <div class="summary">
                <strong>{changed.length} changement{changed.length > 1 ? "s" : ""}</strong>
                {#if owned.length}<span class="warn">{owned.length} déjà possédée{owned.length > 1 ? "s" : ""} par des joueurs</span>{/if}
                {#if twice.size}<span class="error">En double : {[...twice].sort((a, b) => a - b).join(", ")}</span>{/if}
                {#if invalid}<span class="error">Numéros de 1 à {MAX_NUMBER}</span>{/if}
                {#if holes.length}
                    <span class="muted small">Trous : {holes.slice(0, 12).join(", ")}{holes.length > 12 ? "…" : ""}</span>
                {/if}
            </div>
            <button class="btn btn-accent" disabled={changed.length === 0 || twice.size > 0 || invalid}>Enregistrer les numéros</button>
        </form>
    {/if}
</main>

<style>
    main {
        width: min(900px, 94%);
        margin: 0 auto;
        padding: 1.5rem 0 6rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .back {
        color: var(--primary);
        font-size: 0.9rem;
    }

    .head {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.5rem 1rem;
        border-left: 4px solid var(--c);
        padding-left: 0.75rem;
    }

    h1 {
        font-size: 2rem;
    }

    .small {
        font-size: 0.78rem;
    }

    .tools {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }

    .group {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.4rem;
    }

    .rows {
        list-style: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }

    .row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.4rem 0.6rem;
        border: 1px solid var(--border);
        border-left: 4px solid var(--r);
        border-radius: var(--radius);
        background: var(--surface);
        transition:
            border-color 0.2s ease,
            opacity 0.2s ease;
    }

    .row.changed {
        background: color-mix(in srgb, var(--accent) 8%, var(--surface));
    }

    .row.clash {
        border-color: var(--danger, #d24b4b);
        border-left-color: var(--danger, #d24b4b);
    }

    .row.over {
        box-shadow: 0 -3px 0 var(--primary);
    }

    .row.dragging {
        opacity: 0.4;
    }

    .handle {
        cursor: grab;
        color: var(--muted);
        letter-spacing: -0.2em;
        user-select: none;
    }

    .arrows {
        display: flex;
        flex-direction: column;
    }

    .arrows button {
        padding: 0 0.3rem;
        border: none;
        background: none;
        color: var(--muted);
        font-size: 0.65rem;
        line-height: 1.2;
        cursor: pointer;
    }

    .arrows button:disabled {
        opacity: 0.25;
        cursor: default;
    }

    .arrows button:not(:disabled):hover {
        color: var(--primary);
    }

    .number {
        width: 5rem;
        height: 36px;
        font-size: 16px;
        font-variant-numeric: tabular-nums;
    }

    img,
    .blank {
        width: 32px;
        height: 44px;
        border-radius: 3px;
        object-fit: cover;
        object-position: top;
        background: #2a2a2a;
        flex-shrink: 0;
    }

    .name {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
    }

    .name strong {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .gem {
        display: inline-block;
        width: 0.5rem;
        height: 0.5rem;
        margin-right: 0.35rem;
        transform: rotate(45deg);
        background: var(--r);
    }

    .was {
        font-variant-numeric: tabular-nums;
        color: var(--muted);
        white-space: nowrap;
    }

    .was b {
        color: var(--primary);
    }

    .edit {
        color: var(--primary);
    }

    .save {
        position: sticky;
        bottom: 0.75rem;
        z-index: 3;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.6rem;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
    }

    .summary {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.3rem 0.9rem;
    }

    .warn {
        color: var(--primary);
        font-size: 0.85rem;
    }

    .error {
        color: var(--danger, #d24b4b);
        font-size: 0.85rem;
    }

    @media (max-width: 560px) {
        .handle,
        .was {
            display: none;
        }

        .row {
            gap: 0.4rem;
        }

        .number {
            width: 4rem;
        }
    }
</style>
