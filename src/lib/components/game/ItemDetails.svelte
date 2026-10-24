<script lang="ts">
    import Icon from "$lib/components/ui/Icon.svelte";
    import { parseEffects } from "$lib/game/bonus";
    import {
        CATEGORY_LABELS,
        CONTAINERS,
        itemIcon,
        rarityLabel,
        stackWeight,
    } from "$lib/game/inventory";
    import { FOOD_TYPE_LABELS } from "$lib/game/labels";
    import { STATS } from "$lib/game/stats";
    import { HAND_LABELS, describeWeaponBonus } from "$lib/game/weapons";
    import type { InventoryEntry } from "$lib/server/sheet";

    // Fiche détaillée d'un objet : description, bonus d'armure ou d'arme, contenu d'un sac de nourriture.
    let { entry }: { entry: InventoryEntry } = $props();

    let rarity = $derived(`var(--rarity-${Math.min(5, Math.max(1, entry.item.rarity))})`);
    let effects = $derived(
        entry.bonus ? parseEffects(entry.bonus.statistics, entry.bonus.values, "flat") : [],
    );
    let foodCount = $derived(entry.foods.reduce((sum, f) => sum + f.quantity, 0));
</script>

<div class="details">
    <div class="head">
        <Icon src={itemIcon(entry.item)} color={rarity} size="4rem" />
        <div>
            <p class="rarity" style="color: {rarity}">{rarityLabel(entry.item.rarity)}</p>
            <p class="muted">
                {CATEGORY_LABELS[entry.item.category] ?? entry.item.category}
                · {CONTAINERS[entry.container].label}
                {#if entry.quantity > 1}· ×{entry.quantity}{/if}
            </p>
            <p>
                Poids : {stackWeight(entry)}
                {#if entry.equipped}<span class="muted">(équipé, ne pèse rien)</span>{/if}
            </p>
            {#if entry.hand}<p>Tenue : {HAND_LABELS[entry.hand].toLowerCase()}</p>{/if}
        </div>
    </div>

    {#if entry.item.description}
        <p class="description">{entry.item.description}</p>
    {/if}
    {#if entry.note}
        <p class="description note">{entry.note}</p>
    {/if}

    {#if effects.length > 0}
        <ul class="effects">
            {#each effects as effect}
                <li class:malus={effect.value < 0}>
                    {STATS[effect.stat].label}
                    {effect.value > 0 ? "+" : ""}{effect.value}
                </li>
            {/each}
        </ul>
    {/if}

    {#if entry.weaponBonuses.length > 0}
        <ul class="effects">
            {#each entry.weaponBonuses as bonus (bonus.code)}
                <li class="weapon">{describeWeaponBonus(bonus)}</li>
            {/each}
        </ul>
    {/if}

    {#if entry.item.category === "Sac"}
        <div>
            <h3>Contenu ({foodCount})</h3>
            {#if entry.foods.length === 0}
                <p class="muted">Ce sac est vide.</p>
            {:else}
                <ul class="foods">
                    {#each entry.foods as food}
                        <li>
                            {food.name} ×{food.quantity}
                            <span class="muted">{FOOD_TYPE_LABELS[food.type] ?? food.type}</span>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    {/if}
</div>

<style>
    .details {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .head {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .rarity {
        font-family: var(--titleFont);
        font-size: 1.2rem;
    }

    .description {
        white-space: pre-line;
    }

    .note {
        font-style: italic;
    }

    .effects {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .effects li {
        padding: 0.15rem 0.6rem;
        border: 1px solid var(--primary);
        border-radius: 999px;
        color: var(--primary);
        font-size: 0.9rem;
    }

    .effects li.weapon {
        border-color: var(--chance);
        color: var(--foreground);
    }

    .effects li.malus {
        border-color: #ff9c9c;
        color: #ff9c9c;
    }

    h3 {
        font-size: 1.1rem;
        color: var(--primary);
        margin-bottom: 0.25rem;
    }

    .foods li {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.2rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
</style>
