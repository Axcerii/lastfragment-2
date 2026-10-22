<script lang="ts">
    import SectionTitle from "$lib/components/ui/SectionTitle.svelte";
    import StatBar from "$lib/components/ui/StatBar.svelte";
    import { passivePower, type Sheet } from "$lib/game/bonus";
    import {
        COMBAT_STATS,
        CONSO_STATS,
        SOCIAL_STATS,
        STAT_KEYS,
        totalPower,
        type StatBlock,
        type StatKey,
    } from "$lib/game/stats";

    // Bloc complet des stats, d'après la maquette du profil : consommables sur toute la largeur,
    // puis combat et hors-combat côte à côte. `compact` sert à la vue de combat.
    // Avec `values` (les stats de base), chaque nombre devient un champ qui les modifie.
    let {
        sheet,
        compact = false,
        values = $bindable(),
    }: { sheet: Sheet; compact?: boolean; values?: StatBlock } = $props();

    let base = $derived(
        Object.fromEntries(STAT_KEYS.map((k) => [k, sheet[k].base])) as StatBlock,
    );
    let bonus = $derived(passivePower(sheet));

    const GROUPS: { title: string; short: string; stats: StatKey[] }[] = [
        { title: "Statistiques Consommables", short: "Consommables", stats: CONSO_STATS },
        { title: "Statistiques de Combat", short: "Combat", stats: COMBAT_STATS },
        { title: "Statistiques de Hors-Combat", short: "Hors-combat", stats: SOCIAL_STATS },
    ];
</script>

{#snippet group({ title, short, stats }: (typeof GROUPS)[number])}
    <section class="group">
        {#if compact}
            <h3>{short}</h3>
        {:else}
            <SectionTitle level={3}>{title}</SectionTitle>
        {/if}
        {#each stats as stat (stat)}
            {#if values}
                <StatBar {stat} line={sheet[stat]} {compact} editable bind:value={values[stat]} />
            {:else}
                <StatBar {stat} line={sheet[stat]} {compact} />
            {/if}
        {/each}
    </section>
{/snippet}

<div class="stats" class:compact>
    {@render group(GROUPS[0])}
    <div class="columns">
        {@render group(GROUPS[1])}
        {@render group(GROUPS[2])}
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
        gap: 35px;
    }

    .group {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 0;
    }

    .columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 35px;
    }

    /* Vue de combat : tout s'empile, plus serré. */
    .compact {
        gap: 0.75rem;
    }

    .compact .group {
        gap: 0.3rem;
    }

    .compact .columns {
        grid-template-columns: 1fr;
        gap: 0.75rem;
    }

    h3 {
        font-size: 1.1rem;
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

    @media (max-width: 800px) {
        .columns {
            grid-template-columns: 1fr;
        }
    }
</style>
