<script lang="ts">
    import Tabs from "$lib/components/ui/Tabs.svelte";
    import { dragonVars } from "$lib/game/labels";
    import { STAT_KEYS, STATS, type StatBlock, type StatKey } from "$lib/game/stats";
    import type { SheetData } from "$lib/server/sheet";

    // Compétences par stat : une barre de paliers posée à gauche, débloqués quand la stat de base les
    // atteint. Les paliers sont des parallélogrammes de même largeur emboîtés les uns dans les autres ;
    // les deux bouts de la barre restent droits. Tout prend la couleur du dragon de la stat.
    let { skills, stats }: { skills: SheetData["skills"]; stats: StatBlock } = $props();

    // Seules les stats qui ont des compétences ont un onglet.
    let available = $derived(
        STAT_KEYS.filter((k) => skills.some((s) => s.stat === STATS[k].skill)),
    );
    let chosen = $state<StatKey | null>(null);
    let stat = $derived(chosen && available.includes(chosen) ? chosen : available[0]);

    let tiers = $derived(
        stat
            ? skills
                  .filter((s) => s.stat === STATS[stat].skill)
                  .map((skill) => ({ ...skill, locked: stats[stat] < skill.level }))
            : [],
    );

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
    <div class="skills" style={dragonVars(STATS[stat].dragon)}>
        <Tabs
            label="Statistique"
            options={available.map((k) => ({ value: k, label: STATS[k].label }))}
            bind:value={() => stat, (v) => ((chosen = v), (focusedId = null))}
        />

        <div class="bar" role="group" aria-label="Paliers de {STATS[stat].label}">
            {#each tiers as tier (tier.id)}
                <button
                    type="button"
                    class="tier"
                    class:locked={tier.locked}
                    class:focused={focused?.id === tier.id}
                    aria-label="{tier.locked ? 'Verrouillé' : tier.name}, palier {tier.level}"
                    aria-pressed={focused?.id === tier.id}
                    onmouseenter={() => (focusedId = tier.id)}
                    onfocus={() => (focusedId = tier.id)}
                    onclick={() => (focusedId = tier.id)}
                >
                    <span>{tier.level}</span>
                </button>
            {/each}
        </div>
        <p class="muted current">{STATS[stat].label} : <strong>{stats[stat]}</strong></p>

        {#if focused}
            <div class="description" class:locked={focused.locked}>
                {#if focused.locked}
                    <h4>Verrouillé</h4>
                    <p>
                        Atteins {focused.level} en {STATS[stat].label.toLowerCase()} pour débloquer
                        cette compétence.
                    </p>
                {:else}
                    <h4>{focused.name} <span class="level">palier {focused.level}</span></h4>
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

    /* L'onglet actif prend la couleur de la stat. */
    .skills :global([role="tab"].active) {
        background-color: var(--c);
        border-color: var(--foreground);
        color: var(--ink);
    }

    .skills :global([role="tab"]:hover) {
        border-color: var(--c-text);
    }

    /* Le contour blanc des barres de stats, tracé autour des formes découpées. */
    .bar {
        --slant: 0.6rem;
        --gap: 3px;
        display: flex;
        height: 2rem;
        filter: drop-shadow(1px 0 0 var(--foreground)) drop-shadow(-1px 0 0 var(--foreground))
            drop-shadow(0 1px 0 var(--foreground)) drop-shadow(0 -1px 0 var(--foreground));
    }

    /* Chaque palier recouvre le précédent d'une pente, moins l'écart : les bords obliques restent
       parallèles. Le texte est centré sur la partie visible (le milieu de la forme, à mi-hauteur). */
    .tier {
        flex: 1 1 0;
        max-width: 9rem;
        min-width: 0;
        margin-left: calc(var(--gap) - var(--slant));
        padding: 0 calc(var(--slant) / 2);
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 0;
        background-color: var(--c);
        color: var(--ink);
        font-size: 0.85rem;
        font-variant-numeric: tabular-nums;
        clip-path: polygon(var(--slant) 0, 100% 0, calc(100% - var(--slant)) 100%, 0 100%);
        filter: brightness(0.8);
        cursor: pointer;
        transition: var(--transition);
    }

    /* Bouts droits : la forme perd une demi-pente, le texte se décale d'autant. */
    .tier:first-child {
        margin-left: 0;
        padding: 0 calc(var(--slant) / 2) 0 0;
        border-radius: var(--radius) 0 0 var(--radius);
        clip-path: polygon(0 0, 100% 0, calc(100% - var(--slant)) 100%, 0 100%);
    }

    .tier:last-child {
        padding: 0 0 0 calc(var(--slant) / 2);
        border-radius: 0 var(--radius) var(--radius) 0;
        clip-path: polygon(var(--slant) 0, 100% 0, 100% 100%, 0 100%);
    }

    .tier:only-child {
        padding: 0;
        border-radius: var(--radius);
        clip-path: none;
    }

    .tier span {
        overflow: hidden;
        white-space: nowrap;
    }

    .tier:hover,
    .tier.focused {
        filter: none;
    }

    .tier.focused span {
        font-weight: 700;
        text-decoration: underline;
        text-underline-offset: 3px;
    }

    /* Verrouillé : la couleur reste reconnaissable, en hachures sombres. */
    .tier.locked {
        background-color: color-mix(in srgb, var(--c) 22%, #131313);
        background-image: repeating-linear-gradient(
            -45deg,
            rgba(0, 0, 0, 0.35) 0 4px,
            transparent 4px 8px
        );
        color: var(--muted);
        filter: none;
    }

    .tier.locked.focused {
        background-color: color-mix(in srgb, var(--c) 40%, #131313);
        color: var(--foreground);
    }

    .tier:focus-visible {
        outline: none;
        filter: brightness(1.2);
    }

    .current {
        font-size: 0.9rem;
    }

    .current strong {
        color: var(--c-text);
        font-weight: normal;
    }

    .description {
        padding: 1rem;
        border-left: 3px solid var(--c);
        background-color: color-mix(in srgb, var(--c) 8%, transparent);
        min-height: 5rem;
    }

    .description.locked {
        border-color: var(--border);
        background-color: rgba(255, 255, 255, 0.04);
        color: var(--muted);
    }

    h4 {
        font-size: 1.2rem;
        margin-bottom: 0.25rem;
        color: var(--c-text);
    }

    .locked h4 {
        color: var(--muted);
    }

    .level {
        margin-left: 0.4rem;
        font-family: var(--textFont);
        font-size: 0.8rem;
        color: var(--muted);
    }

    .description p {
        white-space: pre-line;
    }
</style>
