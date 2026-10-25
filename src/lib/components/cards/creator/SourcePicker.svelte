<script lang="ts">
    // « Partir d'une fiche » : un personnage, un monstre ou un objet remplit la carte d'un coup
    // (nom, titre, portrait, dragons, fiche du verso, stats, citation).
    import Modal from "$lib/components/ui/Modal.svelte";
    import Tabs from "$lib/components/ui/Tabs.svelte";
    import { matches } from "$lib/components/table/MediaPicker.svelte";
    import {
        fromCharacter,
        fromItem,
        fromMonster,
        type CharacterSource,
        type ItemSource,
        type MonsterSource,
        type Prefill,
    } from "$lib/cards/prefill";
    import { thumbOf } from "./ImageLibrary.svelte";

    let {
        open = $bindable(false),
        sources,
        onpick,
    }: {
        open?: boolean;
        sources: { characters: CharacterSource[]; monsters: MonsterSource[]; items: ItemSource[] };
        onpick: (prefill: Prefill) => void;
    } = $props();

    let tab = $state<"personnage" | "monstre" | "objet">("personnage");
    let query = $state("");

    let rows = $derived.by(() => {
        const list =
            tab === "personnage"
                ? sources.characters.map((c) => ({ id: c.id, name: c.name, detail: c.title ?? "", image: c.image, make: () => fromCharacter(c) }))
                : tab === "monstre"
                  ? sources.monsters.map((m) => ({ id: m.id, name: m.name, detail: `Danger ${m.dangerosity}`, image: m.image, make: () => fromMonster(m) }))
                  : sources.items.map((i) => ({ id: i.id, name: i.name, detail: i.category, image: i.icon, make: () => fromItem(i) }));
        return list.filter((r) => matches(`${r.name} ${r.detail}`, query)).slice(0, 200);
    });
</script>

<Modal bind:open title="Partir d’une fiche" side>
    <Tabs
        bind:value={tab}
        label="Type de fiche"
        options={[
            { value: "personnage", label: "Personnages", badge: sources.characters.length },
            { value: "monstre", label: "Bestiaire", badge: sources.monsters.length },
            { value: "objet", label: "Objets", badge: sources.items.length },
        ]}
    />
    <input type="search" placeholder="Chercher…" bind:value={query} aria-label="Chercher une fiche" />
    <ul>
        {#each rows as row (row.id)}
            <li>
                <button
                    type="button"
                    onclick={() => {
                        onpick(row.make());
                        open = false;
                    }}
                >
                    {#if row.image}
                        <img src={thumbOf(row.image)} alt="" loading="lazy" />
                    {:else}
                        <span class="blank"></span>
                    {/if}
                    <span>
                        <strong>{row.name}</strong>
                        <span class="muted">{row.detail}</span>
                    </span>
                </button>
            </li>
        {:else}
            <li class="muted">Aucune fiche.</li>
        {/each}
    </ul>
</Modal>

<style>
    input[type="search"] {
        height: 42px;
        font-size: 18px;
    }

    ul {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }

    button {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.4rem 0.6rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
        color: var(--foreground);
        text-align: left;
    }

    button:hover {
        border-color: var(--accent);
    }

    img,
    .blank {
        width: 44px;
        height: 44px;
        object-fit: contain;
        flex-shrink: 0;
        border-radius: 4px;
        background: #2a2a2a;
    }

    button > span {
        display: flex;
        flex-direction: column;
        min-width: 0;
        font-size: 0.85rem;
    }

    .muted {
        font-size: 0.75rem;
    }
</style>
