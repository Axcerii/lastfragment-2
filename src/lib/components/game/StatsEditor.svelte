<script lang="ts">
    import { STAT_KEYS, STATS, totalPower, type StatBlock } from "$lib/game/stats";

    // Les 13 champs de stats, à placer dans un formulaire. La puissance se recalcule à la saisie.
    let { stats }: { stats: StatBlock } = $props();

    let draft = $state({ ...stats });
</script>

<div class="grid">
    {#each STAT_KEYS as key}
        <label>
            <span title={STATS[key].label}>{STATS[key].abbr}</span>
            <input
                type="number"
                name={key}
                min="0"
                max={STATS[key].scale * 200}
                bind:value={draft[key]}
            />
        </label>
    {/each}
</div>
<p class="muted">
    Puissance totale : {totalPower(draft)} · QDF et HP vont jusqu'à 3 000, END jusqu'à 2 000, les
    autres jusqu'à 100.
</p>

<style>
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
        gap: 0.75rem;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.9rem;
    }

    input {
        height: 40px;
        padding: 0 0.6rem;
    }

    p {
        margin-top: 0.75rem;
        font-size: 0.9rem;
    }
</style>
