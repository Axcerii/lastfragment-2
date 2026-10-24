<script lang="ts">
    import { enhance } from "$app/forms";
    import { ARMOR_SLOTS, CATEGORY_LABELS } from "$lib/game/inventory";
    import { HANDS, HAND_LABELS, type Hand } from "$lib/game/weapons";
    import type { InventoryEntry } from "$lib/server/sheet";

    // Les 4 emplacements d'armure et les mains. Chaque liste propose ce que le personnage a en main.
    let { inventory, canEdit }: { inventory: InventoryEntry[]; canEdit: boolean } = $props();

    let slots = $derived(
        ARMOR_SLOTS.map((slot) => {
            const pieces = inventory.filter((e) => e.slot === slot && e.container !== "commun");
            return {
                key: slot as string,
                label: CATEGORY_LABELS[slot],
                hand: null as Hand | null,
                equipped: pieces.find((e) => e.equipped),
                // Seule une pièce en main peut être équipée.
                options: pieces.filter((e) => e.equipped || e.container === "main"),
            };
        }),
    );

    // Une arme se tient d'une main ou des deux ; chaque main propose toutes les armes en main.
    let weapons = $derived(inventory.filter((e) => e.weapon && e.container === "main"));
    let hands = $derived(
        HANDS.map((hand) => ({
            key: hand as string,
            label: HAND_LABELS[hand],
            hand: hand as Hand | null,
            equipped: weapons.find((e) => e.hand === hand),
            options: weapons,
        })),
    );
    let twoHanded = $derived(weapons.some((e) => e.hand === "deux"));

    // Choisir un objet l'équipe ; choisir « Rien » retire celui qui était porté.
    function choose(select: HTMLSelectElement, equippedId: number | undefined) {
        const form = select.form!;
        const field = (name: string) => form.querySelector<HTMLInputElement>(`input[name=${name}]`)!;
        field("id").value = select.value || String(equippedId ?? "");
        field("equip").value = select.value ? "on" : "";
        form.requestSubmit();
    }
</script>

{#snippet slotForm(slot: (typeof slots)[number], dimmed = false)}
    <form method="POST" action="?/equip" use:enhance class="slot" class:dimmed>
        <label for="slot-{slot.key}">{slot.label}</label>
        {#if canEdit}
            <select
                id="slot-{slot.key}"
                disabled={slot.options.length === 0}
                onchange={(e) => choose(e.currentTarget, slot.equipped?.id)}
            >
                <option value="" selected={!slot.equipped}>Rien</option>
                {#each slot.options as piece (piece.id)}
                    <option value={piece.id} selected={piece.id === slot.equipped?.id}>
                        {piece.item.name}{piece.hand && piece.hand !== slot.hand
                            ? ` (${HAND_LABELS[piece.hand].toLowerCase()})`
                            : ""}
                    </option>
                {/each}
            </select>
            <input type="hidden" name="id" />
            <input type="hidden" name="equip" />
            {#if slot.hand}<input type="hidden" name="hand" value={slot.hand} />{/if}
        {:else}
            <p>{slot.equipped?.item.name ?? "Rien"}</p>
        {/if}
    </form>
{/snippet}

<div class="slots">
    {#each slots as slot (slot.key)}
        {@render slotForm(slot)}
    {/each}
</div>

<h3>Armes</h3>
<div class="slots">
    {#each hands as slot (slot.key)}
        <!-- Une arme à deux mains occupe les deux : les mains seules sont alors grisées. -->
        {@render slotForm(slot, twoHanded && slot.hand !== "deux")}
    {/each}
</div>
{#if canEdit && weapons.length === 0}
    <p class="muted small">Aucune arme en main. Prends-en une depuis l'inventaire pour l'équiper.</p>
{/if}

<style>
    .slots {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
        gap: 1rem;
    }

    h3 {
        margin: 1.5rem 0 0.75rem;
        font-size: 1.3rem;
        color: var(--primary);
    }

    .slot {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .slot.dimmed {
        opacity: 0.6;
    }

    label {
        color: var(--primary);
    }

    select {
        height: 40px;
        font-size: 18px;
        padding: 0 0.6rem;
    }

    select:disabled {
        opacity: 0.5;
    }

    .small {
        margin-top: 0.5rem;
        font-size: 0.9rem;
    }
</style>
