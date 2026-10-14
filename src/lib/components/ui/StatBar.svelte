<script lang="ts">
    import Bar from "./Bar.svelte";
    import { STATS, barPercent, type StatKey } from "$lib/game/stats";
    import type { StatLine } from "$lib/game/bonus";

    // Ligne de stat de la maquette : nom, valeur, puis barre à la couleur du dragon de la stat.
    let {
        stat,
        line,
        compact = false,
    }: { stat: StatKey; line: StatLine; compact?: boolean } = $props();

    let info = $derived(STATS[stat]);
    let modified = $derived(line.total !== line.base);
    let loss = $derived(line.total < line.base);

    const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

    // Détail affiché au survol quand l'armure ou les passifs changent la valeur.
    let detail = $derived(
        [
            `Base ${line.base}`,
            line.armor ? `armure ${signed(line.armor)}` : "",
            line.passive ? `passifs ${signed(line.passive)}` : "",
        ]
            .filter(Boolean)
            .join(" · "),
    );
</script>

<div class="row" class:compact>
    <span class="name" title={info.label}>{compact ? info.abbr : (info.barLabel ?? info.label)}</span>
    <span class="value" class:up={modified && !loss} class:down={loss} title={modified ? detail : undefined}>
        {line.total}
    </span>
    <Bar
        label={info.label}
        valueText="{line.total}{modified ? ` (${detail})` : ''}"
        value={barPercent(stat, Math.min(line.base, line.total))}
        extra={barPercent(stat, Math.max(line.base, line.total)) - barPercent(stat, Math.min(line.base, line.total))}
        {loss}
        color="var(--{info.dragon})"
        icon={info.icon ?? `/dragons/normal/${info.dragon}.svg`}
        height={compact ? "16px" : "24px"}
    />
</div>

<style>
    .row {
        display: grid;
        grid-template-columns: 111px 54px 1fr;
        align-items: center;
        gap: 12px;
        font-size: 20px;
    }

    .row.compact {
        grid-template-columns: 2.75rem 3.5rem 1fr;
        gap: 0.5rem;
        font-size: 0.9rem;
    }

    .name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .value {
        text-align: center;
        font-variant-numeric: tabular-nums;
    }

    .value.up {
        color: var(--primary);
    }

    .value.down {
        color: #ff9c9c;
    }

    .value[title] {
        text-decoration: underline dotted;
        text-underline-offset: 4px;
        cursor: help;
    }

    @media (max-width: 600px) {
        .row:not(.compact) {
            grid-template-columns: 100px 48px 1fr;
            gap: 0.6rem;
            font-size: 18px;
        }
    }
</style>
