<script lang="ts">
    import Icon from "$lib/components/ui/Icon.svelte";
    import { itemIcon, rarityLabel, stackWeight } from "$lib/game/inventory";
    import type { InventoryEntry } from "$lib/server/sheet";

    // Vignette d'un objet : icône à la couleur de sa rareté, nom, quantité et pastilles de poids.
    let {
        entry,
        selected = false,
        onclick,
    }: { entry: InventoryEntry; selected?: boolean; onclick?: () => void } = $props();

    const MAX_PIPS = 8;

    let weight = $derived(stackWeight(entry));
    let rarity = $derived(`var(--rarity-${Math.min(5, Math.max(1, entry.item.rarity))})`);
</script>

<button
    type="button"
    class="item"
    class:selected
    class:equipped={entry.equipped}
    style="--rarity: {rarity}"
    title="{entry.item.name} · {rarityLabel(entry.item.rarity)}"
    aria-pressed={onclick ? selected : undefined}
    {onclick}
>
    {#if entry.quantity > 1}
        <span class="quantity">×{entry.quantity}</span>
    {/if}
    {#if entry.equipped}
        <span class="tag">Équipé</span>
    {/if}
    <Icon src={itemIcon(entry.item)} color={rarity} size="3rem" />
    <span class="name">{entry.item.name}</span>
    <span class="pips" aria-label="Poids : {weight}">
        {#each { length: Math.min(weight, MAX_PIPS) } as _}
            <span class="pip"></span>
        {/each}
        {#if weight > MAX_PIPS}
            <span class="more">+{weight - MAX_PIPS}</span>
        {/if}
    </span>
</button>

<style>
    .item {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4rem;
        width: 7.5rem;
        min-height: 8.5rem;
        padding: 0.75rem 0.5rem 0.5rem;
        background-color: var(--surface);
        border: 1px solid var(--rarity);
        border-radius: var(--radius);
        color: var(--foreground);
        font-size: 0.85rem;
        transition: var(--transition);
    }

    .item:hover {
        background-color: var(--surface-raised);
        transform: translateY(-2px);
    }

    .item.selected {
        background-color: var(--surface-raised);
        box-shadow: 0 0 0 2px var(--accent);
    }

    .item.equipped {
        border-style: double;
        border-width: 3px;
    }

    .name {
        text-align: center;
        line-height: 1.15;
        overflow-wrap: anywhere;
    }

    .quantity,
    .tag {
        position: absolute;
        top: 0.25rem;
        font-size: 0.7rem;
    }

    .quantity {
        right: 0.35rem;
        font-variant-numeric: tabular-nums;
    }

    .tag {
        left: 0.35rem;
        color: var(--primary);
    }

    .pips {
        display: flex;
        align-items: center;
        gap: 3px;
        margin-top: auto;
        min-height: 8px;
    }

    .pip {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background-color: var(--rarity);
    }

    .more {
        font-size: 0.7rem;
    }
</style>
