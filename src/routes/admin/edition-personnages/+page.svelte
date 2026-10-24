<script lang="ts">
    import { onMount } from "svelte";
    import { SvelteSet } from "svelte/reactivity";
    import { enhance } from "$app/forms";
    import { beforeNavigate } from "$app/navigation";
    import Modal from "$lib/components/ui/Modal.svelte";
    import {
        BULK_FIELDS,
        isEmptyValue,
        parseEditable,
        type BulkChange,
        type BulkField,
        type BulkValue,
    } from "$lib/admin/bulk";
    import { normalizeDescent, portrait } from "$lib/game/labels";

    let { data, form } = $props();

    type Row = (typeof data.rows)[number];

    // --- Modifications en attente : rien n'est écrit avant « Enregistrer » ---
    let edits = $state<Record<number, Record<string, BulkValue>>>({});

    const value = (row: Row, field: BulkField) => edits[row.id]?.[field.name] ?? row.values[field.name];
    const isDirty = (row: Row, field: BulkField) => edits[row.id]?.[field.name] !== undefined;

    function setValue(row: Row, field: BulkField, next: BulkValue) {
        const own = { ...edits[row.id] };
        if (next === row.values[field.name]) delete own[field.name];
        else own[field.name] = next;
        if (Object.keys(own).length) edits[row.id] = own;
        else delete edits[row.id];
    }

    let changes = $derived<BulkChange[]>(
        data.rows.flatMap((row) =>
            Object.entries(edits[row.id] ?? {}).map(([field, after]) => ({
                id: row.id,
                field,
                before: row.values[field],
                after,
            })),
        ),
    );

    // Erreurs de saisie, signalées dans la case et bloquant l'enregistrement.
    let invalid = $derived(
        new Map(
            changes.flatMap((c) => {
                const result = parseEditable(BULK_FIELDS.find((f) => f.name === c.field)!, c.after);
                return result.ok ? [] : [[`${c.id}:${c.field}`, result.error] as const];
            }),
        ),
    );

    // --- Colonnes affichées, retenues dans ce navigateur ---
    const COLUMNS_KEY = "edition-personnages:colonnes";
    let shownNames = $state(BULK_FIELDS.filter((f) => f.shown).map((f) => f.name));
    let shown = $derived(BULK_FIELDS.filter((f) => shownNames.includes(f.name)));

    onMount(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(COLUMNS_KEY) ?? "null");
            if (Array.isArray(saved)) shownNames = saved.filter((n) => BULK_FIELDS.some((f) => f.name === n));
        } catch {
            // Préférence illisible ou stockage indisponible : colonnes par défaut.
        }
    });

    function toggleColumn(name: string) {
        shownNames = shownNames.includes(name) ? shownNames.filter((n) => n !== name) : [...shownNames, name];
        try {
            localStorage.setItem(COLUMNS_KEY, JSON.stringify(shownNames));
        } catch {
            // Sans stockage, le choix vaut pour cette visite.
        }
    }

    // --- Filtres ---
    let search = $state("");
    let emptyField = $state("");
    let visibility = $state<"all" | "visible" | "hidden">("all");
    let onlyChanged = $state(false);

    const fold = (text: string) =>
        text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "");

    const labelOf = (field: BulkField, v: BulkValue) => {
        if (typeof v === "boolean") return v ? "Oui" : "Non";
        if (field.type === "select") return field.options.find((o) => o.value === v)?.label ?? v;
        return v.trim() || "(vide)";
    };

    let rows = $derived.by(() => {
        const words = fold(search).split(/\s+/).filter(Boolean);
        const empty = BULK_FIELDS.find((f) => f.name === emptyField);
        return data.rows.filter((row) => {
            // Les filtres portent sur les valeurs d'origine : une ligne ne disparaît pas pendant qu'on la remplit.
            if (empty && !isEmptyValue(empty, row.values[empty.name])) return false;
            if (visibility === "visible" && !row.values.visibility) return false;
            if (visibility === "hidden" && row.values.visibility) return false;
            if (onlyChanged && !edits[row.id]) return false;
            if (!words.length) return true;
            const text = fold(BULK_FIELDS.map((f) => labelOf(f, row.values[f.name])).join(" "));
            return words.every((w) => text.includes(w));
        });
    });

    // --- Sélection et application en masse ---
    const selected = new SvelteSet<number>();
    let allSelected = $derived(rows.length > 0 && rows.every((r) => selected.has(r.id)));

    function toggleAll() {
        if (allSelected) for (const r of rows) selected.delete(r.id);
        else for (const r of rows) selected.add(r.id);
    }

    let bulkFieldName = $state("job");
    let bulkField = $derived(BULK_FIELDS.find((f) => f.name === bulkFieldName)!);
    let bulkValue = $state<BulkValue>("");

    $effect(() => {
        // Valeur de départ adaptée au type de la colonne choisie.
        const f = bulkField;
        bulkValue = f.type === "flag" || f.type === "boolean" ? true : f.type === "select" ? String(f.options[0].value) : "";
    });

    let targets = $derived(data.rows.filter((r) => selected.has(r.id)));

    function applyBulk() {
        const next = bulkField.type === "dragons" ? normalizeDescent(String(bulkValue)) : bulkValue;
        for (const row of targets) setValue(row, bulkField, next);
    }

    // --- Navigation au clavier : Entrée descend d'une ligne, Maj+Entrée remonte ---
    function onKeydown(event: KeyboardEvent, index: number, field: BulkField) {
        if (event.key !== "Enter") return;
        event.preventDefault();
        const target = document.querySelector<HTMLElement>(
            `[data-cell="${field.name}-${index + (event.shiftKey ? -1 : 1)}"]`,
        );
        target?.focus();
        if (target instanceof HTMLInputElement) target.select();
    }

    // --- Enregistrement ---
    let reviewing = $state(false);
    let saving = $state(false);
    let undo = $state<BulkChange[] | null>(null);
    let undoing = $state(false);

    const rowById = (id: number) => data.rows.find((r) => r.id === id);
    const fieldByName = (name: string) => BULK_FIELDS.find((f) => f.name === name)!;

    const submit = (isUndo: boolean) => () => {
        saving = true;
        return async ({ result, update }: { result: { type: string; data?: any }; update: (o?: { reset?: boolean }) => Promise<void> }) => {
            saving = false;
            reviewing = false;
            if (result.type === "success") {
                edits = {};
                selected.clear();
                // Un lot annulé ne s'annule pas à son tour.
                undo = isUndo ? null : (result.data?.undo ?? null);
            }
            await update({ reset: false });
            undoing = false;
        };
    };

    // Rien ne se perd par mégarde : on prévient avant de quitter avec des modifications en attente.
    beforeNavigate((navigation) => {
        if (changes.length && !saving && !confirm("Des modifications ne sont pas enregistrées. Quitter quand même ?")) {
            navigation.cancel();
        }
    });

    onMount(() => {
        const warn = (event: BeforeUnloadEvent) => {
            if (changes.length) event.preventDefault();
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    });
</script>

<svelte:head>
    <title>Édition rapide des personnages : Espace MJ</title>
</svelte:head>

<main>
    <header>
        <div>
            <a class="muted back" href="/admin/personnages">← Personnages</a>
            <h1>Édition rapide</h1>
            <p class="muted">
                Modifie plusieurs personnages à la fois, case par case ou sur une sélection. Rien n'est
                écrit avant « Enregistrer », et le dernier lot enregistré peut être annulé.
            </p>
        </div>
    </header>

    <section class="panel tools">
        <div class="filters">
            <input type="search" placeholder="Rechercher…" aria-label="Rechercher" bind:value={search} />
            <label>
                Vides seulement
                <select bind:value={emptyField}>
                    <option value="">—</option>
                    {#each BULK_FIELDS.filter((f) => f.type === "text" || f.type === "dragons") as field (field.name)}
                        <option value={field.name}>{field.label}{field.type === "dragons" ? " inconnue" : " vide"}</option>
                    {/each}
                </select>
            </label>
            <label>
                Visibilité
                <select bind:value={visibility}>
                    <option value="all">Tous</option>
                    <option value="visible">Visibles</option>
                    <option value="hidden">Cachés</option>
                </select>
            </label>
            <label class="check">
                <input type="checkbox" bind:checked={onlyChanged} />
                Modifiés seulement
            </label>
        </div>

        <details>
            <summary>Colonnes affichées</summary>
            <div class="columns">
                {#each BULK_FIELDS as field (field.name)}
                    <label class="check">
                        <input
                            type="checkbox"
                            checked={shownNames.includes(field.name)}
                            onchange={() => toggleColumn(field.name)}
                        />
                        {field.label}
                    </label>
                {/each}
            </div>
        </details>

        <div class="bulk" class:inactive={targets.length === 0}>
            <strong>{targets.length} sélectionné{targets.length > 1 ? "s" : ""}</strong>
            <span class="muted">Mettre</span>
            <select bind:value={bulkFieldName} aria-label="Colonne à remplir">
                {#each BULK_FIELDS as field (field.name)}
                    <option value={field.name}>{field.label}</option>
                {/each}
            </select>
            <span class="muted">à</span>
            {#if bulkField.type === "select"}
                <select bind:value={bulkValue} aria-label="Valeur">
                    {#each bulkField.options as option (option.value)}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            {:else if bulkField.type === "flag" || bulkField.type === "boolean"}
                <select
                    value={bulkValue ? "1" : "0"}
                    onchange={(e) => (bulkValue = e.currentTarget.value === "1")}
                    aria-label="Valeur"
                >
                    <option value="1">Oui</option>
                    <option value="0">Non</option>
                </select>
            {:else}
                <input
                    class="bulk-text"
                    bind:value={bulkValue}
                    placeholder={bulkField.type === "dragons" ? "Goliath-Pura, Aucun, Inconnu" : "(vide)"}
                    aria-label="Valeur"
                />
            {/if}
            <button class="btn btn-small" disabled={targets.length === 0} onclick={applyBulk}>Appliquer</button>
            {#if selected.size}
                <button class="btn btn-small" onclick={() => selected.clear()}>Désélectionner</button>
            {/if}
        </div>
    </section>

    <div class="savebar" class:pending={changes.length > 0}>
        <span>
            {#if changes.length}
                <strong>{changes.length}</strong> modification{changes.length > 1 ? "s" : ""} en attente
                sur {Object.keys(edits).length} personnage{Object.keys(edits).length > 1 ? "s" : ""}
                {#if invalid.size}<span class="message-error"> · {invalid.size} à corriger</span>{/if}
            {:else}
                <span class="muted">Aucune modification en attente.</span>
            {/if}
        </span>
        {#if form?.message}<span class="message-success" role="status">{form.message}</span>{/if}
        {#if form?.error}<span class="message-error" role="alert">{form.error}</span>{/if}
        <span class="spacer"></span>
        {#if undo && !changes.length}
            <form method="POST" action="?/save" use:enhance={submit(true)}>
                <input type="hidden" name="changes" value={JSON.stringify(undo)} />
                <button
                    class="btn btn-small"
                    disabled={saving}
                    onclick={(e) => {
                        if (!confirm(`Remettre les ${undo?.length} cases du dernier lot comme avant ?`)) e.preventDefault();
                        else undoing = true;
                    }}
                >
                    {undoing ? "Annulation…" : "Annuler le dernier lot"}
                </button>
            </form>
        {/if}
        <button class="btn btn-small" disabled={!changes.length} onclick={() => (edits = {})}>Tout abandonner</button>
        <button
            class="btn btn-accent"
            disabled={!changes.length || invalid.size > 0}
            onclick={() => (reviewing = true)}
        >
            Enregistrer…
        </button>
    </div>

    <div class="scroll">
        <table>
            <thead>
                <tr>
                    <th class="sel">
                        <input type="checkbox" checked={allSelected} onchange={toggleAll} aria-label="Tout sélectionner" />
                    </th>
                    <th><span class="sr-only">Portrait</span></th>
                    {#each shown as field (field.name)}
                        <th>{field.label}</th>
                    {/each}
                </tr>
            </thead>
            <tbody>
                {#each rows as row, index (row.id)}
                    <tr class:changed={edits[row.id]} class:picked={selected.has(row.id)}>
                        <td class="sel">
                            <input
                                type="checkbox"
                                checked={selected.has(row.id)}
                                onchange={() => (selected.has(row.id) ? selected.delete(row.id) : selected.add(row.id))}
                                aria-label="Sélectionner {row.values.name}"
                            />
                        </td>
                        <td>
                            <a href="/admin/personnages/{row.id}" title="Ouvrir la fiche complète">
                                <img src={portrait(row.image)} alt="" loading="lazy" />
                            </a>
                        </td>
                        {#each shown as field (field.name)}
                            {@const v = value(row, field)}
                            {@const error = invalid.get(`${row.id}:${field.name}`)}
                            <td class:dirty={isDirty(row, field)} class:error title={error ?? (isDirty(row, field) ? `Avant : ${labelOf(field, row.values[field.name])}` : undefined)}>
                                {#if field.type === "flag" || field.type === "boolean"}
                                    <input
                                        type="checkbox"
                                        checked={Boolean(v)}
                                        onchange={(e) => setValue(row, field, e.currentTarget.checked)}
                                        aria-label="{field.label} : {row.values.name}"
                                    />
                                {:else if field.type === "select"}
                                    <select
                                        data-cell="{field.name}-{index}"
                                        value={v}
                                        onchange={(e) => setValue(row, field, e.currentTarget.value)}
                                        onkeydown={(e) => onKeydown(e, index, field)}
                                        aria-label="{field.label} : {row.values.name}"
                                    >
                                        {#each field.options as option (option.value)}
                                            <option value={option.value}>{option.label}</option>
                                        {/each}
                                    </select>
                                {:else}
                                    <input
                                        data-cell="{field.name}-{index}"
                                        value={v}
                                        placeholder={field.type === "dragons" ? "Aucun / Inconnu" : "—"}
                                        oninput={(e) => setValue(row, field, e.currentTarget.value)}
                                        onchange={(e) => {
                                            if (field.type === "dragons") setValue(row, field, normalizeDescent(e.currentTarget.value));
                                        }}
                                        onkeydown={(e) => onKeydown(e, index, field)}
                                        aria-label="{field.label} : {row.values.name}"
                                    />
                                {/if}
                            </td>
                        {/each}
                    </tr>
                {:else}
                    <tr>
                        <td colspan={shown.length + 2} class="muted empty">Aucun personnage ne correspond.</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
    <p class="muted small">{rows.length} / {data.rows.length} personnages affichés · Entrée passe à la ligne suivante, Maj+Entrée à la précédente.</p>
</main>

<Modal bind:open={reviewing} title="Enregistrer {changes.length} modification{changes.length > 1 ? 's' : ''} ?">
    <ul class="recap">
        {#each changes as change (`${change.id}:${change.field}`)}
            {@const field = fieldByName(change.field)}
            <li>
                <strong>{rowById(change.id)?.values.name}</strong>
                <span class="muted">{field.label} :</span>
                <s>{labelOf(field, change.before)}</s>
                → {labelOf(field, change.after)}
            </li>
        {/each}
    </ul>
    <form method="POST" action="?/save" class="confirm" use:enhance={submit(false)}>
        <input type="hidden" name="changes" value={JSON.stringify(changes)} />
        <button type="button" class="btn" onclick={() => (reviewing = false)}>Revenir</button>
        <button class="btn btn-accent" disabled={saving}>{saving ? "Enregistrement…" : "Confirmer"}</button>
    </form>
</Modal>

<style>
    main {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: min(110rem, 96%);
        margin: 0 auto;
        padding: 2rem 0 4rem;
    }

    .back {
        font-size: 0.9rem;
    }

    .back:hover {
        color: var(--accent);
    }

    h1 {
        font-size: 2.2rem;
    }

    .small {
        font-size: 0.85rem;
    }

    .tools {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .filters,
    .bulk,
    .columns {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem 1rem;
    }

    .filters label,
    .bulk {
        font-size: 0.9rem;
    }

    .filters label:not(.check) {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    /* Champs compacts : les styles globaux (48 px, 20 px) sont faits pour les formulaires. */
    .tools input:not([type="checkbox"]),
    .tools select,
    td input:not([type="checkbox"]),
    td select {
        height: 34px;
        font-size: 16px;
        padding: 0 0.5rem;
    }

    .filters input[type="search"] {
        max-width: 20rem;
    }

    .tools select {
        width: auto;
    }

    .check {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        cursor: pointer;
    }

    summary {
        cursor: pointer;
        color: var(--primary);
        font-size: 0.9rem;
    }

    .columns {
        margin-top: 0.5rem;
        font-size: 0.9rem;
    }

    .bulk {
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .bulk.inactive strong {
        color: var(--muted);
    }

    .bulk-text {
        width: 16rem;
    }

    /* Barre d'enregistrement collée en haut pendant qu'on fait défiler le tableau. */
    .savebar {
        position: sticky;
        top: 0;
        z-index: 3;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem 1rem;
        padding: 0.6rem 1rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background-color: var(--surface-raised);
        font-size: 0.9rem;
    }

    .savebar.pending {
        border-color: var(--accent);
    }

    .spacer {
        flex: 1;
    }

    .scroll {
        overflow-x: auto;
        border: 1px solid var(--border);
        border-radius: var(--radius);
    }

    table {
        width: 100%;
        background-color: var(--surface);
        font-size: 0.9rem;
    }

    th,
    td {
        padding: 0.3rem 0.4rem;
        text-align: left;
        vertical-align: middle;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    th {
        background-color: var(--surface-raised);
        color: var(--primary);
        white-space: nowrap;
    }

    td {
        min-width: 7rem;
    }

    td.sel,
    th.sel,
    td:nth-child(2) {
        min-width: 0;
        width: 1px;
    }

    tr.picked {
        background-color: rgba(229, 184, 204, 0.06);
    }

    td.dirty input:not([type="checkbox"]),
    td.dirty select {
        background-color: var(--secondary);
    }

    td.dirty input[type="checkbox"] {
        outline: 2px solid var(--secondary);
    }

    td.error input,
    td.error select {
        outline: 2px solid var(--danger);
    }

    td img {
        display: block;
        width: 2.2rem;
        height: 2.2rem;
        object-fit: cover;
        object-position: top;
        border-radius: var(--radius);
        background-color: #101010;
    }

    .empty {
        text-align: center;
        padding: 2rem;
    }

    .recap {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        max-height: 50dvh;
        overflow-y: auto;
        padding: 0 1.25rem;
        font-size: 0.9rem;
    }

    .recap s {
        color: var(--muted);
    }

    .confirm {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        padding: 1rem 1.25rem 1.25rem;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
    }
</style>
