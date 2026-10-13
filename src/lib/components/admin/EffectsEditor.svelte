<script lang="ts">
    import { parseEffects, serializeEffects, type Effect } from "$lib/game/bonus";
    import { STAT_KEYS, STATS, type StatKey } from "$lib/game/stats";

    // Éditeur d'effets sur les stats : une ligne par stat, en valeur fixe (+10) ou en multiplicateur (×1.1).
    // Le résultat part dans des champs cachés, au format des colonnes stats/valeurs de la base.
    let {
        statsName,
        valuesName,
        inactiveName,
        stats = "",
        values = "",
        inactive = "",
        bareAs,
    }: {
        statsName: string;
        valuesName: string;
        /** Si présent, chaque ligne a aussi un effet appliqué quand le passif est désactivé. */
        inactiveName?: string;
        stats?: string | null;
        values?: string | null;
        inactive?: string | null;
        bareAs: Effect["kind"];
    } = $props();

    interface Row {
        stat: StatKey;
        kind: Effect["kind"];
        value: number | null;
        inactiveKind: Effect["kind"];
        inactiveValue: number | null;
    }

    function initialRows(): Row[] {
        const active = parseEffects(stats, values, bareAs);
        // Les valeurs « inactif » suivent le même ordre de stats que les valeurs actives.
        const names = (stats ?? "").split(",");
        const raws = (inactive ?? "").split(",");
        return active.map((effect, i) => {
            const off = parseEffects(names[i], raws[i], bareAs)[0];
            return {
                stat: effect.stat,
                kind: effect.kind,
                value: effect.value,
                inactiveKind: off?.kind ?? effect.kind,
                inactiveValue: off?.value ?? null,
            };
        });
    }

    let rows = $state(initialRows());

    const complete = (row: Row): row is Row & { value: number } => row.value !== null;

    let serialized = $derived.by(() => {
        const kept = rows.filter(complete);
        const active = serializeEffects(kept);
        const off = kept.map((row) =>
            row.inactiveValue === null
                ? ""
                : serializeEffects([
                      { stat: row.stat, kind: row.inactiveKind, value: row.inactiveValue },
                  ]).values,
        );
        return { ...active, inactive: off.some(Boolean) ? off.join(",") : "" };
    });

    function add() {
        const used = rows.map((r) => r.stat);
        rows.push({
            stat: STAT_KEYS.find((k) => !used.includes(k)) ?? "strength",
            kind: bareAs,
            value: null,
            inactiveKind: bareAs,
            inactiveValue: null,
        });
    }
</script>

<input type="hidden" name={statsName} value={serialized.stats} />
<input type="hidden" name={valuesName} value={serialized.values} />
{#if inactiveName}
    <input type="hidden" name={inactiveName} value={serialized.inactive} />
{/if}

<div class="editor">
    {#each rows as row, i (i)}
        <div class="row">
            <select bind:value={row.stat} aria-label="Statistique">
                {#each STAT_KEYS as key}
                    <option value={key}>{STATS[key].label}</option>
                {/each}
            </select>

            <div class="effect">
                {#if inactiveName}<span class="muted">Actif</span>{/if}
                <select bind:value={row.kind} aria-label="Type d'effet">
                    <option value="flat">+ fixe</option>
                    <option value="mult">× multiplié</option>
                </select>
                <input
                    type="number"
                    step="any"
                    bind:value={row.value}
                    placeholder={row.kind === "mult" ? "1.1" : "10"}
                    aria-label="Valeur"
                />
            </div>

            {#if inactiveName}
                <div class="effect">
                    <span class="muted">Inactif</span>
                    <select bind:value={row.inactiveKind} aria-label="Type d'effet quand inactif">
                        <option value="flat">+ fixe</option>
                        <option value="mult">× multiplié</option>
                    </select>
                    <input
                        type="number"
                        step="any"
                        bind:value={row.inactiveValue}
                        placeholder="aucun"
                        aria-label="Valeur quand inactif"
                    />
                </div>
            {/if}

            <button
                type="button"
                class="btn btn-small btn-danger"
                onclick={() => rows.splice(i, 1)}
                aria-label="Retirer cet effet"
            >
                ✕
            </button>
        </div>
    {/each}

    <button type="button" class="btn btn-small" onclick={add}>Ajouter un effet</button>
    <p class="muted">
        Fixe : la valeur s'ajoute (−5 pour un malus). Multiplié : 1.1 donne +10 % de la stat de
        base, 0.9 donne −10 %.
    </p>
</div>

<style>
    .editor {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.6rem;
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.6rem;
        width: 100%;
    }

    .effect {
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }

    select,
    input {
        height: 40px;
        font-size: 18px;
        padding: 0 0.6rem;
    }

    .row > select {
        width: 11rem;
    }

    .effect select {
        width: 9rem;
    }

    .effect input {
        width: 6.5rem;
    }

    p {
        font-size: 0.85rem;
    }
</style>
