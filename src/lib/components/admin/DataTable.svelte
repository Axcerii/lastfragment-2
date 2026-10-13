<script lang="ts">
    import { enhance } from "$app/forms";
    import type { Snippet } from "svelte";
    import type { FieldType } from "$lib/admin/fields";

    type Cell = string | number | boolean | null;
    interface Row {
        id: number;
        title: string;
        cells: Record<string, Cell>;
    }

    // Tableau du back-office : recherche, tri par colonne, interrupteurs modifiables sur place.
    let {
        columns,
        rows,
        href,
        actions,
    }: {
        columns: { name: string; label: string; type: FieldType }[];
        rows: Row[];
        /** Lien d'édition d'une ligne. */
        href: (row: Row) => string;
        /** Liens supplémentaires en bout de ligne. */
        actions?: Snippet<[Row]>;
    } = $props();

    let search = $state("");
    let sort = $state<{ column: string; descending: boolean } | null>(null);

    const normalize = (text: string) =>
        text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "");

    const isToggle = (type: FieldType) => type === "flag" || type === "boolean";

    let shown = $derived.by(() => {
        const words = normalize(search).split(/\s+/).filter(Boolean);
        const filtered = rows.filter((row) => {
            const text = normalize(Object.values(row.cells).join(" "));
            return words.every((word) => text.includes(word));
        });
        if (!sort) return filtered;

        const { column, descending } = sort;
        return filtered.toSorted((a, b) => {
            const [x, y] = [a.cells[column], b.cells[column]];
            const order =
                typeof x === "number" && typeof y === "number"
                    ? x - y
                    : String(x ?? "").localeCompare(String(y ?? ""), "fr", { numeric: true });
            return descending ? -order : order;
        });
    });

    function sortBy(column: string) {
        sort = sort?.column === column ? { column, descending: !sort.descending } : { column, descending: false };
    }
</script>

<div class="toolbar">
    <input type="search" placeholder="Rechercher…" aria-label="Rechercher" bind:value={search} />
    <span class="muted">{shown.length} / {rows.length}</span>
</div>

<div class="scroll">
    <table>
        <thead>
            <tr>
                {#each columns as column (column.name)}
                    <th aria-sort={sort?.column === column.name ? (sort.descending ? "descending" : "ascending") : undefined}>
                        <button type="button" onclick={() => sortBy(column.name)}>
                            {column.label}
                            {#if sort?.column === column.name}{sort.descending ? "▼" : "▲"}{/if}
                        </button>
                    </th>
                {/each}
                <th><span class="sr-only">Actions</span></th>
            </tr>
        </thead>
        <tbody>
            {#each shown as row (row.id)}
                <tr>
                    {#each columns as column (column.name)}
                        {@const value = row.cells[column.name]}
                        <td>
                            {#if isToggle(column.type)}
                                <form method="POST" action="?/toggle" use:enhance>
                                    <input type="hidden" name="id" value={row.id} />
                                    <input type="hidden" name="field" value={column.name} />
                                    <button
                                        class="toggle"
                                        class:on={value}
                                        aria-pressed={Boolean(value)}
                                        title="{column.label} : {value ? 'oui' : 'non'} (cliquer pour changer)"
                                    >
                                        {value ? "Oui" : "Non"}
                                    </button>
                                </form>
                            {:else if column.type === "image"}
                                {#if value}<img src={String(value)} alt="" loading="lazy" />{/if}
                            {:else}
                                <span class="text">{value ?? "—"}</span>
                            {/if}
                        </td>
                    {/each}
                    <td class="actions">
                        {@render actions?.(row)}
                        <a class="btn btn-small" href={href(row)} aria-label="Modifier {row.title}">
                            Modifier
                        </a>
                    </td>
                </tr>
            {:else}
                <tr>
                    <td colspan={columns.length + 1} class="muted empty">Aucun résultat.</td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<style>
    .toolbar {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .toolbar input {
        max-width: 24rem;
        height: 40px;
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
        padding: 0.5rem 0.75rem;
        text-align: left;
        vertical-align: middle;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    th {
        background-color: var(--surface-raised);
        white-space: nowrap;
    }

    th button {
        background: none;
        border: none;
        padding: 0;
        color: var(--primary);
        font-size: inherit;
    }

    tbody tr:hover {
        background-color: rgba(255, 255, 255, 0.04);
    }

    td img {
        width: 2.5rem;
        height: 2.5rem;
        object-fit: cover;
        object-position: top;
        border-radius: var(--radius);
        background-color: #101010;
        display: block;
    }

    .text {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        max-width: 22rem;
    }

    .toggle {
        min-width: 3.2rem;
        padding: 0.15rem 0.5rem;
        border: 1px solid var(--border);
        border-radius: 999px;
        background-color: transparent;
        color: var(--muted);
        font-size: 0.85rem;
        transition: var(--transition);
    }

    .toggle.on {
        background-color: var(--primary);
        border-color: var(--primary);
        color: var(--background);
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        white-space: nowrap;
    }

    .empty {
        text-align: center;
        padding: 2rem;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
    }
</style>
