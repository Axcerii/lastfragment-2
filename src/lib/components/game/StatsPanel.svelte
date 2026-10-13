<script lang="ts">
    import Gauge from "$lib/components/ui/Gauge.svelte";
    import StatBar from "$lib/components/ui/StatBar.svelte";
    import { passivePower, type Sheet } from "$lib/game/bonus";
    import {
        COMBAT_STATS,
        CONSO_STATS,
        SOCIAL_STATS,
        STAT_KEYS,
        totalPower,
        type StatBlock,
    } from "$lib/game/stats";

    // Bloc complet des stats : jauges, stats de combat et hors-combat, puissance totale.
    let { sheet, compact = false }: { sheet: Sheet; compact?: boolean } = $props();

    let base = $derived(
        Object.fromEntries(STAT_KEYS.map((k) => [k, sheet[k].base])) as StatBlock,
    );
    let bonus = $derived(passivePower(sheet));
</script>

<div class="stats" class:compact>
    <div class="conso">
        {#each CONSO_STATS as stat}
            <Gauge {stat} line={sheet[stat]} />
        {/each}
    </div>

    <div class="columns">
        <section>
            <h3>Combat</h3>
            {#each COMBAT_STATS as stat}
                <StatBar {stat} line={sheet[stat]} {compact} />
            {/each}
        </section>
        <section>
            <h3>Hors-combat</h3>
            {#each SOCIAL_STATS as stat}
                <StatBar {stat} line={sheet[stat]} {compact} />
            {/each}
        </section>
    </div>

    <p class="power">
        Puissance totale : <strong>{totalPower(base)}</strong>
        {#if bonus}
            <span class="bonus" title="Apport des passifs">
                {bonus > 0 ? "+" : ""}{bonus}
            </span>
        {/if}
    </p>
</div>

<style>
    .stats {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .stats.compact {
        gap: 0.75rem;
    }

    .conso {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
    }

    /* En vue compacte, les deux groupes s'empilent pour laisser toute la largeur aux barres. */
    .compact .columns {
        grid-template-columns: 1fr;
        gap: 0.75rem;
    }

    h3 {
        font-size: 1.2rem;
        margin-bottom: 0.5rem;
        color: var(--primary);
    }

    .power {
        text-align: center;
        font-family: var(--titleFont);
        font-size: 1.3rem;
    }

    .bonus {
        color: var(--secondary);
    }

    @media (max-width: 900px) {
        .columns {
            grid-template-columns: 1fr;
            gap: 1rem;
        }
    }
</style>
