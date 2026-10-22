<script lang="ts">
    import { enhance } from "$app/forms";
    import { ARMOR_SLOTS, CATEGORY_LABELS } from "$lib/game/inventory";
    import type { InventoryEntry } from "$lib/server/sheet";

    // Les 4 emplacements d'armure. Chaque liste propose les pièces que le personnage a en main.
    let { inventory, canEdit }: { inventory: InventoryEntry[]; canEdit: boolean } = $props();

    let slots = $derived(
        ARMOR_SLOTS.map((slot) => {
            const pieces = inventory.filter((e) => e.slot === slot && e.container !== "commun");
            return {
                slot,
                equipped: pieces.find((e) => e.equipped),
                // Seule une pièce en main peut être équipée.
                options: pieces.filter((e) => e.equipped || e.container === "main"),
            };
        }),
    );

    // Choisir une pièce l'équipe ; choisir « Rien » retire celle qui était portée.
    function choose(select: HTMLSelectElement, equippedId: number | undefined) {
        const form = select.form!;
        const [id, equip] = form.querySelectorAll<HTMLInputElement>("input[type=hidden]");
        id.value = select.value || String(equippedId ?? "");
        equip.value = select.value ? "on" : "";
        form.requestSubmit();
    }
</script>

<div class="slots">
    {#each slots as { slot, equipped, options } (slot)}
        <form method="POST" action="?/equip" use:enhance class="slot">
            <label for="slot-{slot}">{CATEGORY_LABELS[slot]}</label>
            {#if canEdit}
                <select
                    id="slot-{slot}"
                    disabled={options.length === 0}
                    onchange={(e) => choose(e.currentTarget, equipped?.id)}
                >
                    <option value="" selected={!equipped}>Rien</option>
                    {#each options as piece (piece.id)}
                        <option value={piece.id} selected={piece.equipped}>
                            {piece.item.name}
                        </option>
                    {/each}
                </select>
                <input type="hidden" name="id" />
                <input type="hidden" name="equip" />
            {:else}
                <p>{equipped?.item.name ?? "Rien"}</p>
            {/if}
        </form>
    {/each}
</div>

<style>
    .slots {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
        gap: 1rem;
    }

    .slot {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
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
</style>
