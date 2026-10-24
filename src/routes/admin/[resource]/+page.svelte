<script lang="ts">
    import DataTable from "$lib/components/admin/DataTable.svelte";

    let { data } = $props();

    let base = $derived(`/admin/${data.resource.slug}`);
</script>

<svelte:head>
    <title>{data.resource.label} : Espace MJ</title>
</svelte:head>

<main>
    <header>
        <div>
            <a class="muted back" href="/admin">← Espace MJ</a>
            <h1>{data.resource.label}</h1>
            <p class="muted">{data.resource.description}</p>
        </div>
        <div class="header-actions">
            {#if data.resource.slug === "personnages"}
                <a class="btn" href="/admin/edition-personnages">Édition rapide</a>
            {/if}
            <a class="btn btn-accent" href="{base}/nouveau">Ajouter</a>
        </div>
    </header>

    <!-- La clé repart d'un tableau neuf (recherche, tri) quand on change de ressource. -->
    {#key data.resource.slug}
        <DataTable columns={data.columns} rows={data.rows} href={(row) => `${base}/${row.id}`}>
            {#snippet actions(row)}
                {#if data.resource.slug === "joueurs"}
                    <a class="btn btn-small" href="/admin/fiches/{row.id}">Fiche</a>
                {:else if data.resource.slug === "personnages"}
                    <a class="btn btn-small" href="/personnages/{row.id}">Voir</a>
                {:else if data.resource.slug === "monstres"}
                    <a class="btn btn-small" href="/bestiaire/{row.id}">Voir</a>
                {/if}
            {/snippet}
        </DataTable>
    {/key}
</main>

<style>
    main {
        width: min(90rem, 96%);
        margin: 0 auto;
        padding: 2rem 0 4rem;
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .header-actions {
        display: flex;
        gap: 0.5rem;
    }

    .back {
        font-size: 0.9rem;
    }

    .back:hover {
        color: var(--accent);
    }

    h1 {
        font-size: 2.2rem;
    }
</style>
