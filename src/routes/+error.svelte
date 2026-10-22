<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import Notice from "$lib/components/layout/Notice.svelte";
    import phrases from "$lib/data/phrases-erreur.json";

    const tirage = () => Math.floor(Math.random() * phrases.length);

    // Au chargement de la page, le client reprend la phrase tirée par le serveur
    // (inscrite dans data-phrase) pour que l'hydratation retrouve le même texte.
    // Ensuite, chaque nouvelle erreur (changement d'URL) tire une autre phrase.
    let premierTirage = true;
    const indice = $derived.by(() => {
        page.url;
        if (browser && premierTirage) {
            premierTirage = false;
            const serveur = Number(document.querySelector<HTMLElement>("[data-phrase]")?.dataset.phrase);
            if (Number.isInteger(serveur) && serveur >= 0 && serveur < phrases.length) return serveur;
        }
        return tirage();
    });
</script>

<svelte:head>
    <title>Erreur {page.status} : Last Fragment</title>
</svelte:head>

<Notice title={String(page.status)} dragon="Shizari">
    <p class="phrase" data-phrase={indice}>{phrases[indice]}</p>
    <p>{page.status === 404 ? "Ce fragment n'existe pas, ou plus." : page.error?.message}</p>
    <a class="btn" href="/accueil">Retour à l'accueil</a>
</Notice>

<style>
    .phrase {
        font-family: var(--titleFont);
        font-size: 1.4rem;
        font-style: italic;
        color: var(--primary);
    }
</style>
