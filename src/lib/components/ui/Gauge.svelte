<script lang="ts">
    import { STATS, barPercent, type StatKey } from "$lib/game/stats";
    import type { StatLine } from "$lib/game/bonus";

    // Jauge d'un consommable (QDF, HP, END) avec sa valeur sur le maximum de l'échelle.
    let { stat, line }: { stat: StatKey; line: StatLine } = $props();

    const COLORS: Partial<Record<StatKey, string>> = {
        qdf: "var(--Guizamark)",
        pv: "var(--Chronos)",
        endurance: "var(--Lada)",
    };

    let info = $derived(STATS[stat]);
    let bonus = $derived(line.total - line.base);
</script>

<div class="gauge">
    <span class="name" title={info.label}>{info.abbr}</span>
    <span
        class="track"
        role="meter"
        aria-label={info.label}
        aria-valuenow={Math.min(line.total, 100 * info.scale)}
        aria-valuetext={String(line.total)}
        aria-valuemin={0}
        aria-valuemax={100 * info.scale}
    >
        <span
            class="fill"
            style="width: {barPercent(stat, line.total)}%; background-color: {COLORS[stat] ?? 'var(--accent)'}"
        ></span>
    </span>
    <span class="value">
        {line.total}{#if bonus}<span class="bonus" title="Dont armure et passifs">
                ({bonus > 0 ? "+" : ""}{bonus})</span
            >{/if} / {100 * info.scale}
    </span>
</div>

<style>
    .gauge {
        display: grid;
        grid-template-columns: 3rem 1fr auto;
        align-items: center;
        gap: 0.75rem;
    }

    .track {
        display: block;
        height: 1rem;
        background-color: rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        overflow: hidden;
    }

    .fill {
        display: block;
        height: 100%;
        border-radius: 999px;
        transition: width 600ms ease-out;
    }

    .value {
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }

    .bonus {
        color: var(--muted);
    }
</style>
