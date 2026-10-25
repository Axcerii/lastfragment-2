<script lang="ts">
    import CollectionView from "$lib/components/cards/CollectionView.svelte";
    import { portrait } from "$lib/game/labels";

    let { data } = $props();
    let owner = $derived(data.collection.owner);
</script>

<svelte:head>
    <title>Collection de {owner.name} : Last Fragment</title>
</svelte:head>

<main>
    <header>
        <img src={portrait(owner.portrait)} alt="" />
        <div>
            <h1>Collection de {owner.name}</h1>
        </div>
        <a class="btn btn-accent" href="/cartes/echanges/nouveau?avec={owner.id}">Proposer un échange</a>
    </header>

    <CollectionView collection={data.collection} initialAlbum={data.album}>
        {#snippet actions(copy)}
            <a class="btn btn-small btn-accent" href="/cartes/echanges/nouveau?avec={owner.id}&carte={copy.id}">Demander cette carte</a>
        {/snippet}
    </CollectionView>
</main>

<style>
    main {
        width: min(1100px, 94%);
        margin: 0 auto;
        padding: 1.5rem 0 3rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    header {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    header > div {
        flex: 1;
        min-width: 12rem;
    }

    header img {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        object-fit: cover;
        object-position: top;
        background: #2a2a2a;
    }

    h1 {
        font-size: 2rem;
    }
</style>
