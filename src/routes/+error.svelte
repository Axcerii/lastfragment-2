<script lang="ts">
    import { page } from "$app/state";
    import Notice from "$lib/components/layout/Notice.svelte";
</script>

<svelte:head>
    <title>Erreur {page.status} : Last Fragment</title>
</svelte:head>

<Notice title={String(page.status)} dragon="Shizari">
    <p>{page.status === 404 ? "Ce fragment n'existe pas, ou plus." : page.error?.message}</p>
    <a class="btn" href="/accueil">Retour à l'accueil</a>
</Notice>
