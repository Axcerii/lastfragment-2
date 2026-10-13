<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";
	import Header from "$lib/components/layout/Header.svelte";

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div data-sveltekit-reload>
	<Header connected={data.connected} />
</div>

{@render children?.()}
