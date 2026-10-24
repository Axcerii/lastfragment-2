<script lang="ts">
    import { enhance } from "$app/forms";
    import ItemCard from "$lib/components/game/ItemCard.svelte";
    import ItemDetails from "$lib/components/game/ItemDetails.svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import Tabs from "$lib/components/ui/Tabs.svelte";
    import { CONTAINER_KEYS, CONTAINERS, type ContainerKey } from "$lib/game/inventory";
    import { HANDS, HAND_LABELS } from "$lib/game/weapons";
    import type { ContainerLoad } from "$lib/game/sheet";
    import type { InventoryEntry } from "$lib/server/sheet";

    // Inventaire par conteneur. Un clic sur un objet ouvre sa fiche, d'où l'on équipe une armure ou une arme.
    let {
        inventory,
        loads,
        canEdit,
        isAdmin = false,
    }: {
        inventory: InventoryEntry[];
        loads: Record<ContainerKey, ContainerLoad>;
        canEdit: boolean;
        isAdmin?: boolean;
    } = $props();

    let container = $state<ContainerKey>("main");
    let openId = $state<number | null>(null);
    let detailsOpen = $state(false);

    let shown = $derived(inventory.filter((e) => e.container === container));
    // L'objet ouvert est relu dans les données : sa fiche suit ainsi les changements (équipé, déplacé).
    let opened = $derived(inventory.find((e) => e.id === openId));
    let load = $derived(loads[container]);

    function open(entry: InventoryEntry) {
        openId = entry.id;
        detailsOpen = true;
    }
</script>

<div class="inventory">
    <Tabs
        label="Conteneur"
        bind:value={container}
        options={CONTAINER_KEYS.map((key) => ({
            value: key,
            label: CONTAINERS[key].label,
            badge: inventory.filter((e) => e.container === key).length,
        }))}
    />

    <p class="load" class:over={load.over}>
        Emplacements : <strong>{load.weight} / {load.capacity}</strong>
        {#if load.over}— surcharge{/if}
    </p>

    {#if shown.length === 0}
        <p class="muted">Rien ici.</p>
    {:else}
        <div class="grid">
            {#each shown as entry (entry.id)}
                <ItemCard {entry} onclick={() => open(entry)} />
            {/each}
        </div>
    {/if}
</div>

<Modal bind:open={detailsOpen} title={opened?.item.name ?? ""}>
    {#if opened}
        <ItemDetails entry={opened} />

        {#if canEdit && opened.slot && opened.container !== "commun"}
            <form method="POST" action="?/equip" use:enhance>
                <input type="hidden" name="id" value={opened.id} />
                {#if opened.equipped}
                    <button class="btn">Retirer</button>
                {:else if opened.container === "main"}
                    <input type="hidden" name="equip" value="on" />
                    <button class="btn btn-accent">Équiper</button>
                {:else}
                    <p class="muted">À prendre en main pour pouvoir l'équiper.</p>
                {/if}
            </form>
        {/if}

        {#if canEdit && opened.weapon && opened.container !== "commun"}
            {#if opened.container !== "main"}
                <p class="muted">À prendre en main pour pouvoir l'équiper.</p>
            {:else}
                <!-- Une arme se tient d'une main ou des deux : chaque bouton l'y met (ou l'y déplace). -->
                <form method="POST" action="?/equip" use:enhance class="hands">
                    <input type="hidden" name="id" value={opened.id} />
                    <input type="hidden" name="equip" value="on" />
                    {#each HANDS as hand (hand)}
                        <button
                            class="btn"
                            class:btn-accent={opened.hand !== hand}
                            name="hand"
                            value={hand}
                            disabled={opened.hand === hand}
                        >
                            {opened.hand === hand ? `Tenue : ${HAND_LABELS[hand].toLowerCase()}` : HAND_LABELS[hand]}
                        </button>
                    {/each}
                </form>
                {#if opened.hand}
                    <form method="POST" action="?/equip" use:enhance>
                        <input type="hidden" name="id" value={opened.id} />
                        <button class="btn">Ranger l'arme</button>
                    </form>
                {/if}
            {/if}
        {/if}

        {#if isAdmin}
            <form
                method="POST"
                action="?/removeItem"
                use:enhance={() =>
                    async ({ update }) => {
                        detailsOpen = false;
                        await update();
                    }}
            >
                <input type="hidden" name="id" value={opened.id} />
                <button class="btn btn-small btn-danger">Retirer de l'inventaire (MJ)</button>
            </form>
        {/if}
    {/if}
</Modal>

<style>
    .inventory {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .load.over {
        color: #ff9c9c;
    }

    .hands {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
    }
</style>
