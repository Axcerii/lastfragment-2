<script lang="ts">
    import Tabs from "$lib/components/ui/Tabs.svelte";
    import { STAT_KEYS, STATS, toScale, type StatBlock, type StatKey } from "$lib/game/stats";
    import type { SheetData } from "$lib/server/sheet";

    // Compétences par stat : une barre découpée en paliers, débloqués quand la stat de base les atteint.
    let { skills, stats }: { skills: SheetData["skills"]; stats: StatBlock } = $props();

    // Seules les stats qui ont des compétences ont un onglet.
    let available = $derived(
        STAT_KEYS.filter((k) => skills.some((s) => s.stat === STATS[k].skill)),
    );
    let chosen = $state<StatKey | null>(null);
    let stat = $derived(chosen && available.includes(chosen) ? chosen : available[0]);

    let tiers = $derived.by(() => {
        if (!stat) return [];
        const own = skills.filter((s) => s.stat === STATS[stat].skill);
        return own.map((skill, i) => {
            const start = Math.min(100, toScale(stat, skill.level));
            const end = i + 1 < own.length ? Math.min(100, toScale(stat, own[i + 1].level)) : 100;
            return { ...skill, start, span: Math.max(end - start, 0), locked: stats[stat] < skill.level };
        });
    });

    let focusedId = $state<number | null>(null);
    // Par défaut, on montre la dernière compétence débloquée.
    let focused = $derived(
        tiers.find((t) => t.id === focusedId) ??
            tiers.findLast((t) => !t.locked) ??
            tiers[0],
    );
</script>

{#if !stat}
    <p class="muted">Aucune compétence n'a encore été définie.</p>
{:else}
    <div class="skills">
        <Tabs
            label="Statistique"
            options={available.map((k) => ({ value: k, label: STATS[k].label }))}
            bind:value={() => stat, (v) => ((chosen = v), (focusedId = null))}
        />

        <div class="bar" role="group" aria-label="Paliers de {STATS[stat].label}">
            {#if tiers[0]?.start > 0}
                <span class="lead" style="flex-grow: {tiers[0].start}"></span>
            {/if}
            {#each tiers as tier (tier.id)}
                <button
                    type="button"
                    class="tier"
                    class:locked={tier.locked}
                    class:focused={focused?.id === tier.id}
                    style="flex-grow: {tier.span}"
                    aria-label="{tier.locked ? 'Verrouillé' : tier.name}, palier {tier.level}"
                    onmouseenter={() => (focusedId = tier.id)}
                    onfocus={() => (focusedId = tier.id)}
                    onclick={() => (focusedId = tier.id)}
                >
                    {tier.level}
                </button>
            {/each}
        </div>
        <p class="muted current">{STATS[stat].label} : {stats[stat]}</p>

        {#if focused}
            <div class="description" class:locked={focused.locked}>
                {#if focused.locked}
                    <h4>Verrouillé</h4>
                    <p>
                        Atteins {focused.level} en {STATS[stat].label.toLowerCase()} pour débloquer
                        cette compétence.
                    </p>
                {:else}
                    <h4>{focused.name}</h4>
                    <p>{focused.description}</p>
                {/if}
            </div>
        {/if}
    </div>
{/if}

<style>
    .skills {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .bar {
        display: flex;
        gap: 4px;
        height: 2.5rem;
    }

    .lead {
        flex-basis: 0;
    }

    .tier {
        flex-basis: 2.5rem;
        min-width: 2.5rem;
        border: 1px solid var(--primary);
        background-color: var(--primary);
        color: var(--background);
        font-size: 0.85rem;
        transform: skewX(-18deg);
        transition: var(--transition);
    }

    .tier.locked {
        background-color: transparent;
        border-color: var(--border);
        color: var(--muted);
    }

    .tier.focused {
        background-color: var(--accent);
        border-color: var(--accent);
        color: var(--background);
    }

    .current {
        font-size: 0.9rem;
    }

    .description {
        padding: 1rem;
        border-left: 3px solid var(--primary);
        background-color: rgba(255, 255, 255, 0.04);
        min-height: 5rem;
    }

    .description.locked {
        border-color: var(--border);
        color: var(--muted);
    }

    h4 {
        font-size: 1.2rem;
        margin-bottom: 0.25rem;
    }

    .description p {
        white-space: pre-line;
    }
</style>
