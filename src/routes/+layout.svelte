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
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
</svelte:head>

{#if !bare}
	<Header user={data.user} cardsVisible={data.cardsVisible} />
{/if}

{@render children?.()}

{#if !bare}
	<footer>
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
</style>
