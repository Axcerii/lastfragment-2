<script lang="ts">
    import { STATS, barPercent, type StatKey } from "$lib/game/stats";
    import type { StatLine } from "$lib/game/bonus";

    // Barre d'une stat : base, puis bonus de passifs et d'armure empilés par-dessus.
    let {
        stat,
        line,
        compact = false,
    }: { stat: StatKey; line: StatLine; compact?: boolean } = $props();

    let info = $derived(STATS[stat]);
    let pct = $derived((v: number) => barPercent(stat, v));

    // Un gain prolonge la barre (passifs puis armure) ; une perte la rogne et laisse la partie perdue en rouge.
    let loss = $derived(line.total < line.base);
    let segments = $derived({
        base: pct(Math.min(line.base, line.total)),
        passive: loss ? 0 : pct(Math.min(line.total, line.base + Math.max(line.passive, 0))),
        top: pct(Math.max(line.base, line.total)),
    });

    const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
</script>

<div class="row" class:compact>
    <span class="name" title={info.label}>{compact ? info.abbr : info.label}</span>
    <span class="value">
        <span title={line.total !== line.base ? `Total : ${line.total}` : undefined}>
            {line.base}
        </span>
        {#if line.armor}
            <span class="armor" class:malus={line.armor < 0} title="Armure">
                {signed(line.armor)}
            </span>
        {/if}
        {#if line.passive}
            <span class="passive" class:malus={line.passive < 0} title="Passifs">
                {signed(line.passive)}
            </span>
        {/if}
    </span>
    <span
        class="track"
        role="meter"
        aria-label={info.label}
        aria-valuenow={line.total}
        aria-valuemin={0}
        aria-valuemax={100 * info.scale}
    >
        <span class="fill top-fill" class:loss style="width: {segments.top}%"></span>
        <span class="fill passive-fill" style="width: {segments.passive}%"></span>
        <span class="fill base-fill" style="width: {segments.base}%"></span>
    </span>
</div>

<style>
    .row {
        display: grid;
        grid-template-columns: 7rem 6.5rem 1fr;
        align-items: center;
        gap: 0.75rem;
        min-height: 2rem;
    }

    .row.compact {
        grid-template-columns: 2.75rem 5.5rem 1fr;
        gap: 0.5rem;
        min-height: 1.6rem;
        font-size: 0.9rem;
    }

    .name {
        white-space: nowrap;
    }

    .value {
        display: flex;
        gap: 0.35rem;
        justify-content: flex-end;
        font-variant-numeric: tabular-nums;
    }

    .armor {
        color: var(--primary);
    }

    .passive {
        color: var(--secondary);
    }

    .malus {
        color: #ff9c9c;
    }

    .track {
        position: relative;
        display: block;
        height: 0.6rem;
        background-color: rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        overflow: hidden;
    }

    .fill {
        position: absolute;
        inset: 0 auto 0 0;
        border-radius: 999px;
        transition: width 600ms ease-out;
    }

    .base-fill {
        background-color: var(--accent);
    }

    .passive-fill {
        background-color: var(--secondary);
    }

    .top-fill {
        background-color: var(--primary);
    }

    .top-fill.loss {
        background-color: rgba(202, 68, 68, 0.6);
    }

    @media (max-width: 600px) {
        .row {
            grid-template-columns: 5.5rem 5rem 1fr;
            gap: 0.5rem;
            font-size: 0.9rem;
        }
    }
</style>
