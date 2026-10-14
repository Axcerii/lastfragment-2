<script lang="ts">
    import { enhance } from "$app/forms";
    import Notice from "$lib/components/layout/Notice.svelte";
    import PlayerSheet from "$lib/components/sheet/PlayerSheet.svelte";
    import { CONTAINER_KEYS, CONTAINERS } from "$lib/game/inventory";

    let { data, form } = $props();

    let sheet = $derived(data.sheet);
</script>

<svelte:head>
    <title>Fiche de {sheet.player.login} : Espace MJ</title>
</svelte:head>


{#if sheet.character}
    <PlayerSheet
        data={sheet}
        canEdit
        isAdmin
        base="/admin/fiches/{sheet.player.id}"
        showTransfer={false}
        error={form?.error}
    >
        {#snippet mjTools()}
            <section class="panel mj">
                <header>
                    <h2>Outils MJ · {sheet.player.login}</h2>
                    <div class="links">
                        <a class="btn btn-small" href="/admin/joueurs/{sheet.player.id}">Compte</a>
                        <a class="btn btn-small" href="/admin/personnages/{sheet.character?.id}">
                            Personnage et stats
                        </a>
                        <a class="btn btn-small" href="/admin/passifs">Passifs</a>
                        <a class="btn btn-small" href="/admin/jetons">Badges</a>
                    </div>
                </header>

                <form method="POST" action="?/giveItem" use:enhance>
                    <label>
                        Donner un objet
                        <select name="itemId" required>
                            <option value="" disabled selected>Choisir…</option>
                            {#each data.items as item (item.id)}
                                <option value={item.id}>{item.name}</option>
                            {/each}
                        </select>
                    </label>
                    <label class="narrow">
                        Quantité
                        <input type="number" name="quantity" value="1" min="1" />
                    </label>
                    <label>
                        Dans
                        <select name="container">
                            {#each CONTAINER_KEYS as key (key)}
                                <option value={key}>{CONTAINERS[key].label}</option>
                            {/each}
                        </select>
                    </label>
                    <button class="btn btn-accent">Donner</button>
                </form>

                <form method="POST" action="?/money" use:enhance>
                    <label class="narrow">
                        Argent (négatif pour retirer)
                        <input type="number" name="amount" placeholder="100" required />
                    </label>
                    <button class="btn btn-accent">Appliquer</button>
                </form>

                {#if form?.message}
                    <p class="message-success" role="status">{form.message}</p>
                {/if}
            </section>
        {/snippet}
    </PlayerSheet>
{:else}
    <Notice title={sheet.player.login} dragon="Artrish">
        <p>Ce compte n'est associé à aucun personnage.</p>
        <a class="btn" href="/admin/joueurs/{sheet.player.id}">Lui attribuer un personnage</a>
    </Notice>
{/if}

<style>
    .mj {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        border-color: var(--accent);
    }

    header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
    }

    h2 {
        font-size: 1.4rem;
    }

    .links {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    form {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: 1rem;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1;
        min-width: 12rem;
        font-size: 0.9rem;
    }

    label.narrow {
        flex: 0 1 14rem;
    }

    select,
    input {
        height: 40px;
        font-size: 18px;
    }
</style>
