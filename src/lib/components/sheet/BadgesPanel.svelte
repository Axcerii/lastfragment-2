<script lang="ts">
    import { pairKey, parsePair } from "$lib/game/badges";
    import { DRAGONS, dragonText, dragonVars } from "$lib/game/labels";
    import type { SheetData } from "$lib/server/sheet";

    // Badges distribués par le MJ, et compétences obtenues en fusionnant deux badges.
    // Chaque badge prend la couleur de son dragon, comme les barres de stats.
    let {
        badges,
        fusions,
        badgeSkills,
    }: Pick<SheetData, "badges" | "fusions" | "badgeSkills"> = $props();

    let counts = $derived(
        DRAGONS.map((dragon) => {
            const own = badges.filter((b) => b.badge === dragon);
            return { dragon, free: own.filter((b) => !b.used).length, used: own.filter((b) => b.used).length };
        }).filter((c) => c.free + c.used > 0),
    );

    let skillByPair = $derived(
        new Map(
            badgeSkills.flatMap((skill) => {
                const pair = parsePair(skill.badges);
                return pair ? [[pairKey(...pair), skill] as const] : [];
            }),
        ),
    );
</script>

{#snippet stamp(dragon: string, labelled = false)}
    <span
        class="stamp"
        style="{dragonVars(dragon)}; --icon: url('/dragons/tampons/{dragon}.svg')"
        role={labelled ? "img" : undefined}
        aria-label={labelled ? dragon : undefined}
        title={labelled ? dragon : undefined}
    ></span>
{/snippet}

<div class="badges">
    {#if counts.length === 0}
        <p class="muted">Aucun badge pour l'instant. C'est le MJ qui les distribue.</p>
    {:else}
        <ul class="tokens">
            {#each counts as { dragon, free, used } (dragon)}
                <li
                    class:spent={free === 0}
                    style={dragonVars(dragon)}
                    title="{dragon} : {free} disponible(s), {used} utilisé(s)"
                >
                    {@render stamp(dragon)}
                    <span class="dragon">{dragon}</span>
                    <span class="count">
                        {free} disponible{free > 1 ? "s" : ""}
                        {#if used}<span class="muted">· {used} utilisé{used > 1 ? "s" : ""}</span>{/if}
                    </span>
                </li>
            {/each}
        </ul>
    {/if}

    {#if fusions.length > 0}
        <h3>Compétences de badges</h3>
        <ul class="fusions">
            {#each fusions as fusion (fusion.id)}
                {@const skill = skillByPair.get(pairKey(fusion.badge1, fusion.badge2))}
                <li>
                    <div class="pair">
                        {@render stamp(fusion.badge1, true)}
                        {@render stamp(fusion.badge2, true)}
                    </div>
                    <div>
                        <p
                            class="name"
                            style="--from: {dragonText(fusion.badge1)}; --to: {dragonText(fusion.badge2)}"
                        >{skill?.name ?? `${fusion.badge1} + ${fusion.badge2}`}</p>
                        <p class:muted={!skill}>
                            {skill?.description ?? "Cette fusion n'a pas encore de compétence définie."}
                        </p>
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .badges {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .tokens {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .tokens li {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.2rem;
        width: 8rem;
        padding: 0.5rem;
        border: 1px solid var(--c-text);
        border-radius: var(--radius);
        background-color: color-mix(in srgb, var(--c) 12%, transparent);
        font-size: 0.85rem;
        text-align: center;
        transition: var(--transition);
    }

    .tokens li.spent {
        border-color: var(--border);
        background-color: transparent;
        opacity: 0.55;
    }

    .dragon {
        color: var(--c-text);
        font-family: var(--titleFont);
        font-size: 1.05rem;
    }

    .count {
        font-variant-numeric: tabular-nums;
    }

    /* Tampon du dragon : pastille à sa couleur, logo à l'encre lisible dessus. */
    .stamp {
        position: relative;
        display: block;
        flex-shrink: 0;
        width: 3.5rem;
        height: 3.5rem;
        border: 1px solid var(--foreground);
        border-radius: 50%;
        background-color: var(--c);
    }

    .stamp::after {
        content: "";
        position: absolute;
        inset: 6%;
        background-color: var(--ink);
        mask: var(--icon) center / contain no-repeat;
        -webkit-mask: var(--icon) center / contain no-repeat;
    }

    h3 {
        font-size: 1.2rem;
        color: var(--primary);
    }

    .fusions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .fusions li {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .pair {
        display: flex;
        flex-shrink: 0;
    }

    .pair .stamp {
        width: 3rem;
        height: 3rem;
    }

    .pair .stamp + .stamp {
        margin-left: -0.75rem;
    }

    .name {
        font-family: var(--titleFont);
        font-size: 1.15rem;
        width: fit-content;
        background-image: linear-gradient(90deg, var(--from), var(--to));
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
    }
</style>
