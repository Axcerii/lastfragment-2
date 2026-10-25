<script lang="ts">
    import { enhance } from "$app/forms";
    import CollectionView from "$lib/components/cards/CollectionView.svelte";

    let { data, form } = $props();
</script>

<svelte:head>
    <title>Ma collection : Last Fragment</title>
</svelte:head>

<main>
    <h1>Ma collection</h1>
    {#if form?.error}<p class="message-error" role="alert">{form.error}</p>{/if}
    <CollectionView collection={data.collection} initialAlbum={data.album}>
        {#snippet actions(copy)}
            <form method="POST" action="?/pin" use:enhance={() => async ({ update }) => update({ reset: false })}>
                <input type="hidden" name="cardId" value={copy.id} />
                <button class="btn btn-small btn-accent">{copy.pinned ? "Retirer de la vitrine" : "Mettre en vitrine"}</button>
            </form>
        {/snippet}
    </CollectionView>
    {#if data.collection.copies.length === 0}
        <a class="btn btn-accent" href="/cartes">Ouvrir un booster</a>
    {/if}
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

    h1 {
        font-size: 2.2rem;
    }

    main > a {
        align-self: flex-start;
    }
</style>
