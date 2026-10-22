<script lang="ts">
    import CombatView from "$lib/components/sheet/CombatView.svelte";

    let { data } = $props();
</script>

<svelte:head>
    <title>Combat · {data.sheet.character?.name} : Last Fragment</title>
</svelte:head>

<CombatView data={data.sheet} canEdit isAdmin={data.user?.isAdmin} back="/profil" />
