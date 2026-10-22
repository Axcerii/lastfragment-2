<script lang="ts">
    import CombatView from "$lib/components/sheet/CombatView.svelte";

    let { data } = $props();
</script>

<svelte:head>
    <title>Combat · {data.sheet.character?.name} : Espace MJ</title>
</svelte:head>

<CombatView data={data.sheet} canEdit isAdmin back="/admin/fiches/{data.sheet.player.id}" />
