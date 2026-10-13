<script lang="ts">
    import { pairKey, parsePair } from "$lib/game/badges";
    import { DRAGONS } from "$lib/game/labels";
    import type { SheetData } from "$lib/server/sheet";

    // Badges distribués par le MJ, et compétences obtenues en fusionnant deux badges.
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

<div class="badges">
    {#if counts.length === 0}
        <p class="muted">Aucun badge pour l'instant. C'est le MJ qui les distribue.</p>
    {:else}
        <ul class="tokens">
            {#each counts as { dragon, free, used } (dragon)}
                <li class:spent={free === 0} title="{dragon} : {free} disponible(s), {used} utilisé(s)">
                    <img src="/dragons/tampons/{dragon}.svg" alt="" />
                    <span>{dragon}</span>
                    <span class="count">{free}{#if used}<span class="muted"> +{used} utilisé{used > 1 ? "s" : ""}</span>{/if}</span>
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
                        <img src="/dragons/tampons/{fusion.badge1}.svg" alt={fusion.badge1} title={fusion.badge1} />
                        <img src="/dragons/tampons/{fusion.badge2}.svg" alt={fusion.badge2} title={fusion.badge2} />
                    </div>
                    <div>
                        <p class="name">{skill?.name ?? `${fusion.badge1} + ${fusion.badge2}`}</p>
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
        width: 6.5rem;
        padding: 0.5rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        font-size: 0.85rem;
        text-align: center;
    }

    .tokens li.spent img {
        opacity: 0.3;
    }

    .tokens img {
        width: 3.5rem;
        height: 3.5rem;
        filter: invert(90%) sepia(13%) saturate(311%) hue-rotate(52deg) brightness(101%)
            contrast(81%);
    }

    .count {
        font-variant-numeric: tabular-nums;
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

    .pair img {
        width: 3rem;
        height: 3rem;
        filter: invert(78%) sepia(52%) saturate(214%) hue-rotate(293deg) brightness(95%)
            contrast(88%);
    }

    .pair img + img {
        margin-left: -0.75rem;
    }

    .name {
        font-family: var(--titleFont);
        font-size: 1.15rem;
    }
</style>
