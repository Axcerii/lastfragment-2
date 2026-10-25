<script lang="ts">
    // Vitrine d'un joueur : ses cartes épinglées, sur son profil et sur la fiche de son personnage.
    // Un toucher ouvre la carte en grand, comme dans la collection.
    import type { OwnedCard } from "$lib/cards/types";
    import CardInspector from "./CardInspector.svelte";
    import CollectibleCard from "./CollectibleCard.svelte";

    let {
        cards,
        title = "Vitrine",
        owner = null,
        mine = false,
    }: {
        cards: OwnedCard[];
        title?: string;
        /** Pseudo du joueur, affiché sous le titre. */
        owner?: string | null;
        /** Sa propre vitrine : propose de la garnir quand elle est vide. */
        mine?: boolean;
    } = $props();

    let open = $state<OwnedCard | null>(null);
</script>

{#if cards.length || mine}
    <section class="showcase" aria-label={title}>
        <header>
            <h2>{title}</h2>
            {#if owner}<span class="muted">de {owner}</span>{/if}
            {#if mine}<a class="edit" href="/cartes/collection">Changer</a>{/if}
        </header>
        {#if cards.length}
            <div class="row">
                {#each cards as card (card.copy.id)}
                    <button type="button" class="tile" onclick={() => (open = card)} aria-label={card.template.name}>
                        <CollectibleCard card={card.template} copy={card.copy} lite tilt="hover" glow={card.template.rarity >= 4} />
                    </button>
                {/each}
            </div>
        {:else}
            <p class="muted empty">
                Ta vitrine est vide : épingle jusqu’à six cartes depuis <a href="/cartes/collection">ta collection</a>, elles
                s’afficheront ici et sur la fiche de ton personnage.
            </p>
        {/if}
    </section>
{/if}

{#if open}
    <CardInspector template={open.template} copies={[open.copy]} onclose={() => (open = null)} />
{/if}

<style>
    .showcase {
        width: min(1100px, 92%);
        margin: 2rem auto;
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
    }

    header {
        display: flex;
        align-items: baseline;
        gap: 0.6rem;
    }

    h2 {
        font-family: var(--titleFont);
        font-size: 1.6rem;
    }

    .edit {
        margin-left: auto;
        font-size: 0.85rem;
        color: var(--accent);
    }

    .row {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 1rem;
    }

    .tile {
        padding: 0;
        border: none;
        background: none;
        transition: transform 0.25s ease;
    }

    .tile:hover {
        transform: translateY(-4px);
    }

    .empty a {
        color: var(--accent);
    }

    @media (max-width: 800px) {
        .row {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 0.7rem;
        }
    }
</style>
