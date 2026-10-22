<script lang="ts">
    import Bar from "./Bar.svelte";
    import { STATS, barPercent, type StatKey } from "$lib/game/stats";
    import type { StatLine } from "$lib/game/bonus";

    // Ligne de stat de la maquette : nom, valeur, puis barre à la couleur du dragon de la stat.
    // Au survol (ou au focus), une infobulle détaille le calcul : base, armure, passifs.
    // `editable` remplace le nombre par un champ lié à `value` (la base), sans infobulle.
    let {
        stat,
        line,
        compact = false,
        editable = false,
        value = $bindable(),
    }: {
        stat: StatKey;
        line: StatLine;
        compact?: boolean;
        editable?: boolean;
        value?: number;
    } = $props();

    let info = $derived(STATS[stat]);
    let modified = $derived(line.total !== line.base);
    let loss = $derived(line.total < line.base);

    const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

    let steps = $derived([
        ...line.armorSteps.map((s) => ({ ...s, kind: "Armure" })),
        ...line.passiveSteps.map((s) => ({ ...s, kind: "Passif" })),
    ]);

    // Version texte du calcul, pour les lecteurs d'écran.
    let detail = $derived(
        [
            `Base ${line.base}`,
            line.armor ? `armure ${signed(line.armor)}` : "",
            line.passive ? `passifs ${signed(line.passive)}` : "",
        ]
            .filter(Boolean)
            .join(" · "),
    );

    const tipId = $props.id();
</script>

<div class="row" class:compact class:editable>
    <span class="name">{compact ? info.abbr : (info.barLabel ?? info.label)}</span>
    {#if editable}
        <input
            type="number"
            class="value-input"
            name={stat}
            min="0"
            aria-label={info.label}
            bind:value
        />
    {:else}
        <button
            type="button"
            class="value"
            class:up={modified && !loss}
            class:down={loss}
            aria-label="{info.label} : {line.total}"
            aria-describedby={tipId}
        >
            {line.total}
        </button>
    {/if}
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

    {#if !editable}
        <div class="tip" id={tipId} role="tooltip">
            <p class="tip-title">{info.label}</p>
            <table>
                <tbody>
                    <tr>
                        <th scope="row">Base</th>
                        <td></td>
                        <td class="amount">{line.base}</td>
                    </tr>
                    {#each steps as step, i (i)}
                        <tr>
                            <th scope="row">
                                {step.source}
                                <span class="kind">{step.kind}</span>
                            </th>
                            <!-- Un bonus fixe se lit dans le montant ; on ne détaille que les pourcentages. -->
                            <td class="effect">
                                {#if step.effect.startsWith("×")}{step.effect}&nbsp;de {line.base}{/if}
                            </td>
                            <td class="amount" class:plus={step.amount > 0} class:minus={step.amount < 0}>
                                {signed(step.amount)}
                            </td>
                        </tr>
                    {/each}
                </tbody>
                <tfoot>
                    <tr>
                        <th scope="row">Total</th>
                        <td></td>
                        <td class="amount">{line.total}</td>
                    </tr>
                </tfoot>
            </table>
            {#if steps.some((s) => s.effect.startsWith("×"))}
                <p class="note">Les pourcentages sont arrondis à l'entier supérieur.</p>
            {/if}
            {#if info.scale > 1}
                <p class="note">Barre : {line.total} ÷ {info.scale} = {Math.round((line.total / info.scale) * 10) / 10} / 100</p>
            {/if}
        </div>
    {/if}
</div>

<style>
    .row {
        position: relative;
        display: grid;
        grid-template-columns: 111px 54px 1fr;
        align-items: center;
        gap: 12px;
        font-size: 20px;
        cursor: help;
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
        padding: 0;
        border: none;
        background: none;
        color: inherit;
        font: inherit;
        text-align: center;
        font-variant-numeric: tabular-nums;
        cursor: help;
    }

    .value:focus-visible {
        outline: 1px dashed var(--primary);
        outline-offset: 3px;
        border-radius: var(--radius);
    }

    /* Champ discret : on lit la valeur comme à l'affichage, le cadre signale qu'on peut la changer. */
    .row.editable {
        grid-template-columns: 111px 72px 1fr;
        cursor: auto;
    }

    /* El Messiri réserve une grande descente : sans le décalage du haut, les chiffres montent. */
    .value-input {
        height: 34px;
        line-height: 1;
        padding: 4px 0.25rem 0;
        background-color: transparent;
        color: inherit;
        border: 1px solid var(--border);
        font-size: inherit;
        text-align: center;
        font-variant-numeric: tabular-nums;
        appearance: textfield;
        -moz-appearance: textfield;
        transition: var(--transition);
    }

    .value-input::-webkit-inner-spin-button,
    .value-input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .value-input:hover,
    .value-input:focus {
        border-color: var(--accent);
        outline: none;
    }

    .value.up {
        color: var(--primary);
    }

    .value.down {
        color: #ff9c9c;
    }

    /* Infobulle : sous la ligne, alignée sur la valeur. */
    .tip {
        position: absolute;
        z-index: 20;
        top: calc(100% + 6px);
        left: 111px;
        min-width: 15rem;
        max-width: min(24rem, calc(100vw - 2rem));
        padding: 0.6rem 0.8rem;
        box-sizing: border-box;
        background-color: var(--surface-raised);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
        font-size: 15px;
        line-height: 1.3;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-4px);
        transition:
            opacity 150ms ease-out,
            transform 150ms ease-out,
            visibility 150ms;
        pointer-events: none;
    }

    .row:hover .tip,
    .row:focus-within .tip {
        opacity: 1;
        visibility: visible;
        transform: none;
    }

    .compact .tip {
        left: 0;
    }

    .tip-title {
        margin-bottom: 0.3rem;
        font-family: var(--titleFont);
        font-size: 17px;
        color: var(--primary);
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    th {
        text-align: left;
        font-weight: normal;
        padding: 0.1rem 0.5rem 0.1rem 0;
    }

    td {
        padding: 0.1rem 0 0.1rem 0.5rem;
        white-space: nowrap;
    }

    .kind {
        margin-left: 0.25rem;
        font-size: 12px;
        color: var(--muted);
    }

    .effect {
        color: var(--muted);
        text-align: right;
    }

    .amount {
        text-align: right;
        font-variant-numeric: tabular-nums;
    }

    .amount.plus {
        color: var(--primary);
    }

    .amount.minus {
        color: #ff9c9c;
    }

    tfoot th,
    tfoot td {
        padding-top: 0.3rem;
        border-top: 1px solid var(--border);
    }

    .note {
        margin-top: 0.35rem;
        font-size: 12px;
        color: var(--muted);
    }

    @media (max-width: 600px) {
        .row:not(.compact) {
            grid-template-columns: 100px 48px 1fr;
            gap: 0.6rem;
            font-size: 18px;
        }

        .row.editable {
            grid-template-columns: 100px 64px 1fr;
        }

        .tip {
            left: 0;
        }
    }
</style>
