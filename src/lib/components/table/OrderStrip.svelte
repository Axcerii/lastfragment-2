<script lang="ts">
    // Ordre de passage affiché sur le plateau, pour tout le monde.
    import type { TokenView } from "$lib/table/types";

    let {
        order,
        tokens,
        turn,
        combat,
    }: { order: number[]; tokens: TokenView[]; turn: number | null; combat: boolean } = $props();

    let byId = $derived(new Map(tokens.map((t) => [t.id, t])));
    let list = $derived(order.map((id) => byId.get(id)).filter((t) => t !== undefined));
</script>

{#if combat || list.length}
    <div class="strip" aria-label="Ordre de passage">
        {#if combat}<span class="combat">Combat</span>{/if}
        {#each list as token, index (token.id)}
            <div class="slot side-{token.side}" class:turn={turn === token.id} title={token.name}>
                <span class="rank">{index + 1}</span>
                {#if token.image}
                    <img src={token.image} alt="" />
                {/if}
                <span class="name">{token.name}</span>
            </div>
        {/each}
    </div>
{/if}

<style>
    .strip {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        max-width: 100%;
        overflow-x: auto;
        padding: 0.35rem;
        background-color: rgba(20, 20, 20, 0.85);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        pointer-events: auto;
    }

    .combat {
        padding: 0 0.5rem;
        font-family: var(--titleFont);
        color: var(--danger);
        font-size: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .slot {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.15rem 0.45rem 0.15rem 0.2rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        font-size: 0.75rem;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .slot.turn {
        border-color: var(--accent);
        background-color: rgba(229, 184, 204, 0.25);
    }

    .rank {
        color: var(--muted);
        padding-left: 0.25rem;
    }

    img {
        width: 1.4rem;
        height: 1.4rem;
        border-radius: 50%;
        object-fit: cover;
    }

    .side-enemy img {
        outline: 2px solid var(--danger);
    }

    .side-ally img {
        outline: 2px solid var(--primary);
    }
</style>
