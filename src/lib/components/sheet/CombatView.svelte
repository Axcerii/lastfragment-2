<script lang="ts">
    import PassivesPanel from "./PassivesPanel.svelte";
    import ItemDetails from "$lib/components/game/ItemDetails.svelte";
    import StatsPanel from "$lib/components/game/StatsPanel.svelte";
    import Icon from "$lib/components/ui/Icon.svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import {
        ARMOR_SLOTS,
        CATEGORY_LABELS,
        CONTAINERS,
        formatMoney,
        itemIcon,
        stackWeight,
        type ContainerKey,
    } from "$lib/game/inventory";
    import { containerLoads, sheetOf } from "$lib/game/sheet";
    import { HAND_LABELS, describeWeaponBonus } from "$lib/game/weapons";
    import type { InventoryEntry, SheetData } from "$lib/server/sheet";

    // Vue d'ensemble plein écran pour le combat : stats, armure, passifs, objets à portée et argent.
    let {
        data,
        canEdit,
        isAdmin = false,
        back,
    }: { data: SheetData; canEdit: boolean; isAdmin?: boolean; back: string } = $props();

    // En combat, seul ce que le personnage a sur lui compte.
    const AT_HAND: ContainerKey[] = ["main", "sac"];

    let character = $derived(data.character!);
    let sheet = $derived(sheetOf(data.stats, data.inventory, data.passives));
    let loads = $derived(containerLoads(data.stats, data.inventory));
    let armor = $derived(
        ARMOR_SLOTS.map((slot) => ({
            slot,
            piece: data.inventory.find((e) => e.equipped && e.slot === slot),
        })),
    );

    let weapons = $derived(data.inventory.filter((e) => e.hand));

    let openId = $state<number | null>(null);
    let detailsOpen = $state(false);
    let opened = $derived(data.inventory.find((e) => e.id === openId));

    function open(entry: InventoryEntry) {
        openId = entry.id;
        detailsOpen = true;
    }

    let view: HTMLElement | undefined = $state();
    let fullscreen = $state(false);

    function toggleFullscreen() {
        if (document.fullscreenElement) document.exitFullscreen();
        else view?.requestFullscreen();
    }
</script>

<svelte:document onfullscreenchange={() => (fullscreen = !!document.fullscreenElement)} />

<div class="view" bind:this={view}>
    <header>
        <img src={character.image} alt="" />
        <div class="who">
            <h1>{character.name}</h1>
            {#if character.flux}<p class="muted">{character.flux}</p>{/if}
        </div>
        <p class="money">
            <strong>{formatMoney(data.player.money, isAdmin)}</strong> pièces d'or
        </p>
        <div class="actions">
            <button class="btn btn-small" onclick={toggleFullscreen}>
                {fullscreen ? "Quitter le plein écran" : "Plein écran"}
            </button>
            <a class="btn btn-small" href={back}>Fermer</a>
        </div>
    </header>

    <div class="columns">
        <section>
            <h2>Statistiques</h2>
            <StatsPanel {sheet} compact />
        </section>

        <section>
            <h2>Armure</h2>
            <ul class="list">
                {#each armor as { slot, piece } (slot)}
                    <li>
                        <span class="muted slot">{CATEGORY_LABELS[slot]}</span>
                        {#if piece}
                            <button type="button" class="link" onclick={() => open(piece)}>
                                {piece.item.name}
                            </button>
                        {:else}
                            <span class="muted">—</span>
                        {/if}
                    </li>
                {/each}
            </ul>

            <h2>Armes</h2>
            <ul class="list">
                {#each weapons as entry (entry.id)}
                    <li>
                        <span class="muted slot">{HAND_LABELS[entry.hand!]}</span>
                        <button type="button" class="link" onclick={() => open(entry)}>
                            {entry.item.name}
                        </button>
                        {#if entry.weaponBonuses.length}
                            <span class="muted bonus">
                                {entry.weaponBonuses.map((b) => describeWeaponBonus(b, true)).join(", ")}
                            </span>
                        {/if}
                    </li>
                {:else}
                    <li class="muted">Mains nues.</li>
                {/each}
            </ul>

            <h2>Passifs</h2>
            <PassivesPanel passives={data.passives} {canEdit} compact />
        </section>

        <section>
            {#each AT_HAND as key (key)}
                {@const items = data.inventory.filter((e) => e.container === key)}
                <h2>
                    {CONTAINERS[key].label}
                    <span class="load" class:over={loads[key].over}>
                        {loads[key].weight} / {loads[key].capacity}
                    </span>
                </h2>
                <ul class="list">
                    {#each items as entry (entry.id)}
                        <li>
                            <Icon
                                src={itemIcon(entry.item)}
                                color="var(--rarity-{Math.min(5, Math.max(1, entry.item.rarity))})"
                                size="1.4rem"
                            />
                            <button type="button" class="link" onclick={() => open(entry)}>
                                {entry.item.name}{#if entry.quantity > 1}&nbsp;×{entry.quantity}{/if}
                            </button>
                            <span class="muted weight">
                                {entry.equipped ? "équipé" : stackWeight(entry)}
                            </span>
                        </li>
                    {:else}
                        <li class="muted">Vide.</li>
                    {/each}
                </ul>
            {/each}
        </section>
    </div>

    <Modal bind:open={detailsOpen} title={opened?.item.name ?? ""}>
        {#if opened}
            <ItemDetails entry={opened} />
        {/if}
    </Modal>
</div>

<style>
    .view {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem 1.5rem;
        box-sizing: border-box;
        background-color: var(--background);
        background-image: url("/layout/soft-neige1B1B1B.png");
        overflow-y: auto;
    }

    header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid var(--primary);
    }

    header img {
        width: 4rem;
        height: 4rem;
        object-fit: cover;
        object-position: top;
        border: 2px solid var(--primary);
        border-radius: var(--radius);
        background-color: #101010;
    }

    h1 {
        font-size: 1.8rem;
        line-height: 1.1;
    }

    .money {
        margin-left: auto;
        font-size: 1.2rem;
    }

    .actions {
        display: flex;
        gap: 0.5rem;
    }

    .columns {
        display: grid;
        grid-template-columns: 1.3fr 1fr 1fr;
        gap: 2rem;
        flex: 1;
        min-height: 0;
    }

    section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        min-width: 0;
    }

    h2 {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-size: 1.3rem;
        color: var(--primary);
    }

    h2:not(:first-child) {
        margin-top: 0.75rem;
    }

    .load {
        font-family: var(--textFont);
        font-size: 0.9rem;
        color: var(--foreground);
    }

    .load.over {
        color: #ff9c9c;
    }

    .list {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        font-size: 0.95rem;
    }

    .list li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .slot {
        width: 5.5rem;
        flex-shrink: 0;
    }

    .bonus {
        font-size: 0.8rem;
    }

    .weight {
        margin-left: auto;
        font-variant-numeric: tabular-nums;
    }

    .link {
        background: none;
        border: none;
        padding: 0;
        color: var(--foreground);
        font-size: inherit;
        text-align: left;
        text-decoration: underline dotted;
        text-underline-offset: 3px;
    }

    .link:hover {
        color: var(--accent);
    }

    @media (max-width: 1000px) {
        .columns {
            grid-template-columns: 1fr;
        }

        header {
            flex-wrap: wrap;
        }

        .money {
            margin-left: 0;
        }
    }
</style>
