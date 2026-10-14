<script lang="ts">
	import "../app.css";
	import { page } from "$app/state";
	import Header from "$lib/components/layout/Header.svelte";

	let { children, data } = $props();

	// L'accueil occupe tout l'écran et sert lui-même de menu.
	let bare = $derived(page.route.id === "/accueil");
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
</svelte:head>

{#if !bare}
	<Header user={data.user} />
{/if}

{@render children?.()}
