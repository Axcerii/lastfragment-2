<script lang="ts">
    import { enhance } from "$app/forms";
    import ItemCard from "$lib/components/game/ItemCard.svelte";
    import Icon from "$lib/components/ui/Icon.svelte";
    import { CONTAINER_KEYS, CONTAINERS, type ContainerKey } from "$lib/game/inventory";
    import { containerLoads } from "$lib/game/sheet";
    import type { SheetData } from "$lib/server/sheet";

    // Deux panneaux côte à côte : on coche des objets d'un côté et on les envoie dans le conteneur d'en face.
    let { data, isAdmin = false, error }: { data: SheetData; isAdmin?: boolean; error?: string } =
        $props();

    type Side = "left" | "right";
    const SIDES: Side[] = ["left", "right"];

    let shown = $state<Record<Side, ContainerKey>>({ left: "main", right: "coffre" });
    let selected = $state<Record<Side, number[]>>({ left: [], right: [] });

    let loads = $derived(containerLoads(data.stats, data.inventory));
    // Le MJ garde accès aux conteneurs qu'il a fermés aux joueurs.
    let isOpen = $derived((key: ContainerKey) => isAdmin || data.access[key]);
    let itemsOf = $derived((side: Side) => data.inventory.filter((e) => e.container === shown[side]));

    const other = (side: Side): Side => (side === "left" ? "right" : "left");

    function show(side: Side, key: ContainerKey) {
        // Choisir le conteneur déjà affiché en face échange les deux panneaux.
        if (shown[other(side)] === key) shown[other(side)] = shown[side];
        shown[side] = key;
        selected = { left: [], right: [] };
    }

    function toggle(side: Side, id: number) {
        selected[side] = selected[side].includes(id)
            ? selected[side].filter((x) => x !== id)
            : [...selected[side], id];
    }

    let canSend = $derived(
        (side: Side) =>
            selected[side].length > 0 && isOpen(shown[side]) && isOpen(shown[other(side)]),
    );
</script>

<div class="board">
    {#each SIDES as side (side)}
        {@const load = loads[shown[side]]}
        <section class="panel side {side}">
            <div class="containers" role="tablist" aria-label="Conteneur">
                {#each CONTAINER_KEYS as key (key)}
                    <button
                        type="button"
                        role="tab"
                        aria-selected={shown[side] === key}
                        class:active={shown[side] === key}
                        class:closed={!data.access[key]}
                        title={CONTAINERS[key].label + (data.access[key] ? "" : " (fermé par le MJ)")}
                        onclick={() => show(side, key)}
                    >
                        <Icon
                            src="/objets/categories/{CONTAINERS[key].icon}.svg"
                            color="currentColor"
                            size="1.8rem"
                            label={CONTAINERS[key].label}
                        />
                    </button>
                {/each}
            </div>

            <header>
                <h2>{CONTAINERS[shown[side]].label}</h2>
                <p class:over={load.over}>{load.weight} / {load.capacity}</p>
            </header>

            {#if !isOpen(shown[side])}
                <p class="muted">Ce conteneur est fermé par le MJ pour le moment.</p>
            {/if}

            <div class="items">
                {#each itemsOf(side) as entry (entry.id)}
                    <ItemCard
                        {entry}
                        selected={selected[side].includes(entry.id)}
                        onclick={() => toggle(side, entry.id)}
                    />
                {:else}
                    <p class="muted">Vide.</p>
                {/each}
            </div>
        </section>

        {#if side === "left"}
            <div class="arrows">
                {#each SIDES as from (from)}
                    <form
                        method="POST"
                        action="?/transfer"
                        use:enhance={() =>
                            async ({ update }) => {
                                await update();
                                selected = { left: [], right: [] };
                            }}
                    >
                        <input type="hidden" name="from" value={shown[from]} />
                        <input type="hidden" name="to" value={shown[other(from)]} />
                        {#each selected[from] as id (id)}
                            <input type="hidden" name="ids" value={id} />
                        {/each}
                        <button
                            class="btn"
                            disabled={!canSend(from)}
                            aria-label="Envoyer vers {CONTAINERS[shown[other(from)]].label}"
                        >
                            <Icon
                                src="/objets/categories/Fleche{from === 'left' ? 'Droite' : 'Gauche'}.svg"
                                color="currentColor"
                                size="1.8rem"
                            />
                            {#if selected[from].length}{selected[from].length}{/if}
                        </button>
                    </form>
                {/each}
            </div>
        {/if}
    {/each}
</div>

{#if error}
    <p class="message-error" role="alert">{error}</p>
{/if}

<style>
    .board {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 1rem;
        align-items: start;
    }

    .side {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-height: 60vh;
    }

    .containers {
        display: flex;
        gap: 0.5rem;
    }

    .containers button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 3rem;
        height: 3rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background-color: transparent;
        color: var(--primary);
        transition: var(--transition);
    }

    .containers button:hover {
        border-color: var(--accent);
    }

    .containers button.active {
        background-color: var(--accent);
        border-color: var(--accent);
        color: var(--background);
    }

    .containers button.closed {
        opacity: 0.4;
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
    }

    h2 {
        font-size: 1.5rem;
    }

    .over {
        color: #ff9c9c;
    }

    .items {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-content: flex-start;
    }

    .arrows {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-self: center;
    }

    .arrows .btn {
        min-width: 4rem;
        min-height: 4rem;
    }

    .message-error {
        text-align: center;
        margin-top: 1rem;
    }

    @media (max-width: 800px) {
        .board {
            grid-template-columns: 1fr;
        }

        .side {
            min-height: 0;
        }

        .arrows {
            flex-direction: row;
            justify-content: center;
        }

        .arrows :global(.icon) {
            transform: rotate(90deg);
        }
    }
</style>
