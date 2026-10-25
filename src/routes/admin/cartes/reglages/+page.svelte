<script lang="ts">
    // Réglages du jeu de cartes : rythme des boosters, contenu, taux par rareté ; et dons de boosters.
    import { untrack } from "svelte";
    import { enhance } from "$app/forms";
    import { RARITIES } from "$lib/cards/types";

    let { data, form } = $props();

    // Copie modifiable des réglages enregistrés, pour recalculer les chances en direct.
    let rates = $state(untrack(() => ({ ...data.rules.rates })));
    let count = $state(untrack(() => data.rules.count));
    let guaranteed = $state(untrack(() => data.rules.guaranteed));
    let godPack = $state(untrack(() => data.rules.godPack));
    let total = $derived(Object.values(rates).reduce((a, b) => a + (Number(b) || 0), 0));

    // Chance d'au moins une carte de cette rareté (ou mieux) dans un booster. La garantie remonte
    // la dernière carte jusqu'à sa rareté minimale sans toucher aux chances des raretés au-dessus.
    // Un God Pack contient toujours Légendaire et Unique.
    function atLeast(rarity: number) {
        if (guaranteed >= rarity) return 1;
        const p = [1, 2, 3, 4, 5].filter((r) => r >= rarity).reduce((a, r) => a + (Number(rates[r]) || 0), 0) / (total || 1);
        const normal = 1 - Math.pow(1 - p, count);
        const god = Math.min(100, Math.max(0, Number(godPack) || 0)) / 100;
        return god + (1 - god) * normal;
    }

    const percent = (n: number) => `${(n * 100).toFixed(n < 0.01 ? 2 : 1).replace(".", ",")} %`;
    const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });
</script>

<svelte:head>
    <title>Réglages des cartes : Espace MJ</title>
</svelte:head>

<main>
    <a class="back" href="/admin/cartes">← Cartes</a>
    <h1>Réglages des cartes</h1>
    {#if form?.error}<p class="message-error" role="alert">{form.error}</p>{/if}
    {#if form?.message}<p class="message-success" role="status">{form.message}</p>{/if}

    <form class="panel" method="POST" action="?/rules" use:enhance={keep}>
        <h2>Boosters</h2>
        <div class="grid">
            <label>
                Un booster toutes les
                <span class="unit"><input name="hours" type="number" step="0.25" min="0.25" max="336" value={data.rules.minutes / 60} /> h</span>
            </label>
            <label>
                Cumulables au maximum
                <input name="max" type="number" min={data.bounds.max[0]} max={data.bounds.max[1]} value={data.rules.max} />
            </label>
            <label>
                Offerts à un nouveau joueur
                <input name="starter" type="number" min={data.bounds.starter[0]} max={data.bounds.starter[1]} value={data.rules.starter} />
            </label>
            <label>
                Cartes par booster
                <input name="count" type="number" min={data.bounds.count[0]} max={data.bounds.count[1]} bind:value={count} />
            </label>
            <label>
                Dernière carte au moins
                <select name="guaranteed" bind:value={guaranteed}>
                    <option value={1}>Sans garantie</option>
                    {#each RARITIES.slice(1) as label, i (label)}<option value={i + 2}>{label}</option>{/each}
                </select>
            </label>
        </div>

        <h2>Taux par rareté</h2>
        <p class="muted small">
            Poids relatifs de chaque rareté pour une carte ({total.toFixed(1).replace(".", ",")} au total : ils sont ramenés à 100 %).
            Une rareté sans carte disponible dans le booster est simplement sautée.
        </p>
        <table>
            <thead><tr><th>Rareté</th><th>Taux</th><th>Par carte</th><th>Au moins une par booster</th></tr></thead>
            <tbody>
                {#each RARITIES as label, i (label)}
                    {@const r = i + 1}
                    <tr style="--c: var(--rarity-{r})">
                        <td><i></i>{label}</td>
                        <td><input name="rate{r}" type="number" step="0.01" min="0" max="100" bind:value={rates[r]} aria-label="Taux {label}" /></td>
                        <td>{percent((Number(rates[r]) || 0) / (total || 1))}</td>
                        <td>{r === 1 ? "—" : percent(atLeast(r))}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
        <h2>God Pack</h2>
        <p class="muted small">
            Un booster sur tant est un God Pack : toutes ses cartes sont au moins Légendaires et la dernière est
            une Unique (s’il en reste à tirer). 0 : jamais.
        </p>
        <label class="god">
            Chance par booster
            <span class="unit"><input name="godPack" type="number" step="0.01" min="0" max="100" bind:value={godPack} /> %</span>
            <span class="muted small">{godPack > 0 ? `≈ 1 booster sur ${Math.round(100 / godPack).toLocaleString("fr-FR")}` : "Désactivé"}</span>
        </label>
        <button class="btn btn-accent">Enregistrer les réglages</button>
    </form>

    <form class="panel" method="POST" action="?/gift" use:enhance={keep}>
        <h2>Offrir des boosters</h2>
        <p class="muted small">S’ajoutent à la réserve, au-delà du maximum s’il le faut. Un nombre négatif en retire.</p>
        <div class="row">
            <select name="playerId" required aria-label="Joueur">
                <option value="tous">Tous les joueurs</option>
                {#each data.players as p (p.id)}<option value={p.id}>{p.login}</option>{/each}
            </select>
            <input name="amount" type="number" min="-50" max="50" value="1" aria-label="Nombre de boosters" />
            <button class="btn btn-accent">Offrir</button>
        </div>
    </form>

    <section class="panel">
        <h2>Joueurs</h2>
        <table>
            <thead><tr><th>Joueur</th><th>Réserve</th><th>Ouverts</th><th>Cartes</th></tr></thead>
            <tbody>
                {#each data.players as p (p.id)}
                    <tr>
                        <td><a href="/cartes/joueurs/{p.id}">{p.login}</a></td>
                        <td>{p.stock ?? "—"}</td>
                        <td>{p.opened}</td>
                        <td>{p.cards}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </section>
</main>

<style>
    select {
        padding-top: 0;
        padding-bottom: 0;
    }

    main {
        width: min(860px, 94%);
        margin: 0 auto;
        padding: 1.5rem 0 4rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .back {
        color: var(--primary);
        font-size: 0.9rem;
    }

    h1 {
        font-size: 2.2rem;
    }

    h2 {
        font-size: 1.2rem;
        margin-bottom: 0.6rem;
    }

    form,
    section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.75rem;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.85rem;
    }

    input,
    select {
        height: 40px;
        font-size: 16px;
    }

    label.god {
        max-width: 16rem;
        margin-bottom: 1rem;
    }

    .unit {
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }

    .small {
        font-size: 0.78rem;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
    }

    th {
        text-align: left;
        font-weight: normal;
        color: var(--muted);
        font-size: 0.75rem;
        padding: 0.3rem 0.4rem;
    }

    td {
        padding: 0.3rem 0.4rem;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        font-variant-numeric: tabular-nums;
    }

    td input {
        width: 6rem;
        height: 34px;
    }

    td i {
        display: inline-block;
        width: 0.7rem;
        height: 0.7rem;
        margin-right: 0.4rem;
        transform: rotate(45deg);
        background: var(--c);
    }

    td a {
        color: var(--accent);
    }

    .row {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .row select {
        flex: 1;
        min-width: 10rem;
    }

    .row input {
        width: 6rem;
    }

    button {
        align-self: flex-start;
    }
</style>
