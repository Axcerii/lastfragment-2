<script lang="ts">
    import TransferBoard from "$lib/components/sheet/TransferBoard.svelte";

    let { data, form } = $props();
</script>

<svelte:head>
    <title>Inventaire : Last Fragment</title>
</svelte:head>


<main>
    <header>
        <h1>Inventaire</h1>
        <a class="btn" href="/profil">Retour à la fiche</a>
    </header>
    <p class="muted">
        Sélectionne des objets d'un côté, puis envoie-les dans le conteneur affiché en face. Ce qui
        est déposé dans le coffre commun peut être repris par n'importe quel joueur.
    </p>
    <TransferBoard data={data.sheet} isAdmin={data.user?.isAdmin} error={form?.error} />
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        width: min(80rem, 94%);
        margin: 0 auto;
        padding: 2rem 0 4rem;
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }

    h1 {
        font-size: 2.2rem;
    }
</style>
