<script lang="ts">
    import { enhance } from "$app/forms";
    import Toggle from "$lib/components/ui/Toggle.svelte";
    import { describeEffect, passiveEffects } from "$lib/game/bonus";
    import type { SheetData } from "$lib/server/sheet";

    let {
        passives,
        canEdit,
        compact = false,
    }: { passives: SheetData["passives"]; canEdit: boolean; compact?: boolean } = $props();
</script>

{#if passives.length === 0}
    <p class="muted">Aucun passif.</p>
{:else}
    <ul class:compact>
        {#each passives as passive (passive.id)}
            <li class:inactive={!passive.active}>
                <div class="text">
                    <p class="name">
                        {passive.name || "Passif sans nom"}
                        {#each passiveEffects(passive) as effect}
                            <span class="effect">{describeEffect(effect)}</span>
                        {/each}
                    </p>
                    {#if passive.description && !compact}
                        <p class="description">{passive.description}</p>
                    {/if}
                </div>
                {#if canEdit}
                    <form method="POST" action="?/passive" use:enhance>
                        <input type="hidden" name="id" value={passive.id} />
                        <Toggle
                            name="active"
                            label={passive.active ? "Actif" : "Inactif"}
                            checked={passive.active}
                            autosubmit
                        />
                    </form>
                {:else}
                    <span class="muted">{passive.active ? "Actif" : "Inactif"}</span>
                {/if}
            </li>
        {/each}
    </ul>
{/if}

<style>
    ul {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    ul.compact {
        gap: 0.4rem;
        font-size: 0.9rem;
    }

    ul.compact li {
        padding-bottom: 0.4rem;
    }

    li.inactive .text {
        opacity: 0.55;
    }

    .name {
        font-family: var(--titleFont);
        font-size: 1.15em;
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.5rem;
    }

    .effect {
        font-family: var(--textFont);
        font-size: 0.75em;
        color: var(--secondary);
    }

    .description {
        white-space: pre-line;
        margin-top: 0.25rem;
    }

    form {
        flex-shrink: 0;
    }
</style>
