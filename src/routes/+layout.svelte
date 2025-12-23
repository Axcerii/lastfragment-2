<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";
	import Header from "$lib/components/layout/Header.svelte";

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Header connected={data.connected} />

{@render children?.()}
