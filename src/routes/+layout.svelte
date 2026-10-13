<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";
	import { page } from "$app/state";
	import Header from "$lib/components/layout/Header.svelte";

	let { children, data } = $props();

	// L'accueil occupe tout l'écran et sert lui-même de menu.
	let bare = $derived(page.route.id === "/accueil");
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if !bare}
	<Header user={data.user} />
{/if}

{@render children?.()}
