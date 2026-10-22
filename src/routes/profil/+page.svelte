<script lang="ts">
    import Notice from "$lib/components/layout/Notice.svelte";
    import PlayerSheet from "$lib/components/sheet/PlayerSheet.svelte";

    let { data, form } = $props();
</script>

<svelte:head>
    <title>{data.sheet.character?.name ?? "Profil"} : Last Fragment</title>
</svelte:head>


{#if data.sheet.character}
    <PlayerSheet
        data={data.sheet}
        canEdit
        isAdmin={data.user?.isAdmin}
        base="/profil"
        error={form?.error}
    />
{:else}
    <Notice title="Bienvenue, {data.sheet.player.login}" dragon="Artrish">
        <p>
            Ton compte n'est pas encore associé à un personnage. Préviens le MJ pour qu'il te
            l'attribue : ta fiche apparaîtra ici.
        </p>
        <a class="btn" href="/personnages">Voir les personnages</a>
    </Notice>
{/if}
