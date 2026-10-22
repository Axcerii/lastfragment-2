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
                bind:value={draft[key]}
            />
        </label>
    {/each}
</div>
<p class="muted">
    Puissance totale : {totalPower(draft)} · les barres sont pleines à 3 000 pour QDF et HP, 2 000
    pour END et 100 pour les autres. Une valeur peut dépasser ce seuil (boss, divinités) : la barre
    reste alors pleine.
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
