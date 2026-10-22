<script lang="ts">
    import { enhance } from "$app/forms";

    let { data, form } = $props();

    let amounts = $state<Record<number, number | null>>({});
    let same = $state<number | null>(null);
    let mode = $state<"add" | "remove">("add");

    let playing = $derived(data.players.filter((p) => p.character));
    let total = $derived(Object.values(amounts).reduce((sum: number, a) => sum + (a ?? 0), 0));

    // Remplit d'un coup le montant de tous les joueurs qui ont un personnage.
    function fillAll() {
        for (const player of playing) amounts[player.id] = same;
    }
</script>

<svelte:head>
    <title>Argent : Espace MJ</title>
</svelte:head>

<main>
    <a class="muted back" href="/admin">← Espace MJ</a>
    <h1>Distribuer de l'argent</h1>

    <form
        method="POST"
        action="?/distribute"
        use:enhance={() =>
            async ({ update, result }) => {
                await update({ reset: false });
                if (result.type === "success") amounts = {};
            }}
    >
        <div class="panel controls">
            <label>
                <input type="radio" name="mode" value="add" bind:group={mode} /> Donner
            </label>
            <label>
                <input type="radio" name="mode" value="remove" bind:group={mode} /> Retirer
            </label>
            <div class="same">
                <input
                    type="number"
                    min="0"
                    placeholder="Même montant"
                    aria-label="Même montant pour tous"
                    bind:value={same}
                />
                <button type="button" class="btn btn-small" onclick={fillAll}>
                    Appliquer aux {playing.length} personnages joués
                </button>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Joueur</th>
                    <th>Personnage</th>
                    <th class="number">Argent actuel</th>
                    <th>{mode === "add" ? "À donner" : "À retirer"}</th>
                </tr>
            </thead>
            <tbody>
                {#each data.players as player (player.id)}
                    <tr class:idle={!player.character}>
                        <td>{player.login}</td>
                        <td>{player.character?.name ?? "—"}</td>
                        <td class="number">{player.money.toLocaleString("fr-FR")}</td>
                        <td>
                            <input
                                type="number"
                                min="0"
                                name="amount-{player.id}"
                                aria-label="Montant pour {player.login}"
                                bind:value={amounts[player.id]}
                            />
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>

        <div class="bar">
            <button class="btn btn-accent" disabled={total === 0}>
                {mode === "add" ? "Donner" : "Retirer"} {total.toLocaleString("fr-FR")} pièces d'or
            </button>
            {#if form?.message}
                <span class="message-success" role="status">{form.message}</span>
            {/if}
            {#if form?.error}
                <span class="message-error" role="alert">{form.error}</span>
            {/if}
        </div>
    </form>
</main>

<style>
    main {
        width: min(60rem, 94%);
        margin: 0 auto;
        padding: 2rem 0 4rem;
    }

    .back {
        font-size: 0.9rem;
    }

    h1 {
        font-size: 2.2rem;
        margin-bottom: 1.5rem;
    }

    .controls {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1rem 2rem;
        margin-bottom: 1.5rem;
    }

    .controls label {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        cursor: pointer;
    }

    .same {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-left: auto;
    }

    .same input {
        width: 11rem;
        height: 40px;
    }

    table {
        width: 100%;
        background-color: var(--surface);
        border: 1px solid var(--border);
    }

    th,
    td {
        padding: 0.5rem 0.75rem;
        text-align: left;
        vertical-align: middle;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    th {
        background-color: var(--surface-raised);
        color: var(--primary);
    }

    .number {
        text-align: right;
        font-variant-numeric: tabular-nums;
    }

    td input {
        height: 36px;
        width: 9rem;
    }

    tr.idle td:not(:last-child) {
        opacity: 0.5;
    }

    .bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1rem;
        margin-top: 1.5rem;
    }
</style>
