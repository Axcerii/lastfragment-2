<script lang="ts">
	import "../app.css";
	import { page } from "$app/state";
	import CookieNotice from "$lib/components/layout/CookieNotice.svelte";
	import Header from "$lib/components/layout/Header.svelte";

	let { children, data } = $props();

	// La vue OBS est filmée en direct : jamais de bandeau dessus.
	let obs = $derived((page.route.id ?? "").endsWith("/obs"));

	// L'accueil occupe tout l'écran et sert lui-même de menu ; la table de jeu et sa vue OBS aussi,
	// comme la découverte du don de flux.
	let bare = $derived(
		page.route.id === "/accueil" ||
			page.route.id === "/flux" ||
			page.route.id === "/flux/secret" ||
			(page.route.id ?? "").startsWith("/outils/table/[id]")
	);

	// Pages qui font défiler leur contenu dans leur propre cadre, à hauteur d'écran (la liste des
	// personnages) : sur ordinateur, le pied de page les ferait déborder et toute la page défilerait
	// en plus du cadre. Sur téléphone, elles défilent normalement et gardent le lien vers les CGU.
	let ownScroll = $derived(page.route.id === "/personnages");
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
</svelte:head>

{#if !bare}
	<Header user={data.user} cardsVisible={data.cardsVisible} />
{/if}

{@render children?.()}

{#if !bare}
	<footer class:own-scroll={ownScroll}>
		<a href="/cgu">Conditions générales d'utilisation</a>
	</footer>
{/if}

{#if !obs}
	<CookieNotice />
{/if}

<style>
	footer {
		padding: 1.5rem 1rem;
		text-align: center;
		font-size: 0.8rem;
	}

	footer a {
		color: var(--muted);
		transition: var(--transition);
	}

	footer a:hover,
	footer a:focus-visible {
		color: var(--accent);
		text-decoration: underline;
	}

	/* Même seuil que la liste des personnages, qui ne défile dans son cadre qu'au-dessus de 600 px. */
	@media screen and (min-width: 601px) {
		footer.own-scroll {
			display: none;
		}
	}
</style>
