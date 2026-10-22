<script lang="ts">
    import { ARMOR_SLOTS, CATEGORY_LABELS, type ArmorSlot } from "$lib/game/inventory";
    import type { TableClient } from "$lib/table/client.svelte";
    import type { ArmorOption, TokenView } from "$lib/table/types";

    // Armure d'un personnage ou d'un monstre, choisie par le MJ parmi tout le catalogue, sans
    // inventaire. Elle est enregistrée sur la fiche : tous les jetons de cette fiche suivent.
    let {
        token,
        client,
        armors,
    }: { token: TokenView; client: TableClient; armors: ArmorOption[] } = $props();

    let worn = $derived(token.armorIds ?? []);
    let busy = $state(false);

    const optionsFor = (slot: ArmorSlot) => armors.filter((a) => a.slot === slot);
    const wornIn = (slot: ArmorSlot) => optionsFor(slot).find((a) => worn.includes(a.id))?.id ?? 0;

    async function change(slot: ArmorSlot, id: number) {
        const others = worn.filter((w) => !optionsFor(slot).some((a) => a.id === w));
        busy = true;
        await client.act("token.armor", { id: token.id, armorIds: id ? [...others, id] : others });
        busy = false;
    }
</script>

<section class="armor" aria-label="Armure">
    <h4>Armure</h4>
    <div class="slots">
        {#each ARMOR_SLOTS as slot (slot)}
            {@const options = optionsFor(slot)}
            <label>
                <span>{CATEGORY_LABELS[slot]}</span>
                <select
                    value={wornIn(slot)}
                    disabled={busy}
                    onchange={(e) => change(slot, Number(e.currentTarget.value))}
                >
                    <option value={0}>— Aucune —</option>
                    {#each options as armor (armor.id)}
                        <option value={armor.id} title={armor.bonus}>
                            {armor.name}{armor.bonus ? ` (${armor.bonus})` : ""}
                        </option>
                    {/each}
                </select>
            </label>
        {/each}
    </div>
    <p class="muted small">Enregistrée sur la fiche : tous ses jetons sont mis à jour.</p>
</section>

<style>
    .armor {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        border-top: 1px solid var(--border);
        padding-top: 0.75rem;
    }

    h4 {
        font-size: 1.05rem;
        color: var(--primary);
    }

    .slots {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
        gap: 0.4rem;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        font-size: 0.75rem;
        min-width: 0;
    }

    select {
        height: 30px;
        font-size: 15px;
        padding: 0 0.4rem;
        min-width: 0;
    }

    .small {
        font-size: 0.8rem;
    }
</style>
