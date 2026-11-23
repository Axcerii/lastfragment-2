<script lang="ts">
    // Boutique : les offres proposées aux joueurs (cartes contre points, cartes ou boosters), leur
    // état, et les derniers échanges conclus.
    import { enhance } from "$app/forms";
    import OfferEditor from "$lib/components/cards/creator/OfferEditor.svelte";
    import { pointsLabel, priceLineLabel, rewardCardLabel, type ShopNames } from "$lib/cards/shop";

    let { data, form } = $props();

    type Offer = (typeof data.offers)[number];

    let editing = $state<number | "new" | null>(null);

    const setOf = (id: number) => data.sets.find((s) => s.id === id);
    let names = $derived<ShopNames>({
        template: (id) => data.templates.find((t) => t.id === id)?.name,
        set: (id) => setOf(id)?.name,
    });

    function status(o: Offer) {
        if (!o.active) return "Fermée";
        const now = Date.now();
        if (o.startsAt && new Date(o.startsAt).getTime() > now) return "Programmée";
        if (o.endsAt && new Date(o.endsAt).getTime() <= now) return "Terminée";
        if (o.stock !== null && o.purchases >= o.stock) return "Épuisée";
        return "Ouverte";
    }

    function gives(o: Offer) {
        const list = [...o.price.cards.map((l) => priceLineLabel(l, names)), ...(o.price.points ? [pointsLabel(o.price.points)] : [])];
        return list.join(" + ") || "rien";
    }

    function gets(o: Offer) {
        const list = [
            ...o.reward.cards.map((c) => rewardCardLabel(c, names)),
            ...o.reward.held.map((h) => `${h.count} booster${h.count > 1 ? "s" : ""} « ${setOf(h.setId)?.name ?? "?"} »`),
            ...(o.reward.boosters ? [`${o.reward.boosters} booster${o.reward.boosters > 1 ? "s" : ""} de réserve`] : []),
            ...(o.reward.points ? [pointsLabel(o.reward.points)] : []),
        ];
        return list.join(" + ") || "rien";
    }

    const date = (iso: string) =>
        new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

    const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });
</script>

<svelte:head>
    <title>Boutique des cartes : Espace MJ</title>
</svelte:head>

<main>
    <a class="back" href="/admin/cartes">← Cartes</a>
    <header>
        <h1>Boutique</h1>
        {#if editing !== "new"}
            <button type="button" class="btn btn-accent" onclick={() => (editing = "new")}>Nouvelle offre</button>
        {/if}
    </header>
    <p class="muted">
        Chaque offre dit ce que le joueur cède (points, cartes précises ou cartes selon leur rareté, leur état, leur
        série) et ce qu’il reçoit (points, boosters, cartes). Pour un booster réservé à la boutique, coche « Booster
        spécial » sur sa série dans <a href="/admin/cartes/series">Séries</a> : il disparaît de la vitrine des
        boosters, et ses cartes ne tombent du booster All que si elles y sont marquées.
    </p>
    {#if form?.error && editing === null}<p class="message-error" role="alert">{form.error}</p>{/if}
    {#if form?.message}<p class="message-success" role="status">{form.message}</p>{/if}

    {#if editing === "new"}
        <section class="panel offer editing">
            <h2>Nouvelle offre</h2>
            <OfferEditor templates={data.templates} sets={data.sets} onsaved={() => (editing = null)} oncancel={() => (editing = null)} />
        </section>
    {/if}

    {#each data.offers as o (o.id)}
        <section class="panel offer" class:editing={editing === o.id}>
            <header>
                <h2>{o.name}</h2>
                <span class="badge b-{status(o)}">{status(o)}</span>
                <span class="muted small">
                    Prise {o.purchases} fois{o.stock !== null ? ` sur ${o.stock}` : ""}{o.perPlayer !== null ? ` · ${o.perPlayer} par joueur` : ""}
                </span>
                {#if editing !== o.id}
                    <button type="button" class="btn btn-small edit" onclick={() => (editing = o.id)}>Modifier</button>
                {/if}
            </header>
            {#if o.problem}<p class="warn">⚠ {o.problem}</p>{/if}
            {#if editing === o.id}
                {#key o}
                    <OfferEditor offer={o} templates={data.templates} sets={data.sets} onsaved={() => (editing = null)} oncancel={() => (editing = null)} />
                {/key}
                {#if o.purchases === 0}
                    <form
                        method="POST"
                        action="?/delete"
                        class="delete"
                        use:enhance={({ cancel }) => {
                            if (!confirm(`Supprimer l’offre « ${o.name} » ?`)) cancel();
                            return keep();
                        }}
                    >
                        <input type="hidden" name="id" value={o.id} />
                        <button class="btn btn-small btn-danger">Supprimer l’offre</button>
                    </form>
                {/if}
            {:else}
                <p class="trade"><span class="muted">Cède</span> {gives(o)} <span class="arrow">→</span> <span class="muted">reçoit</span> {gets(o)}</p>
                {#if o.description}<p class="muted small">{o.description}</p>{/if}
            {/if}
        </section>
    {:else}
        {#if editing !== "new"}<p class="muted">Aucune offre pour l’instant.</p>{/if}
    {/each}

    {#if data.recent.length}
        <section class="panel">
            <h2>Derniers échanges</h2>
            <table>
                <thead><tr><th>Quand</th><th>Joueur</th><th>Offre</th><th>Cartes cédées</th><th>Cartes reçues</th></tr></thead>
                <tbody>
                    {#each data.recent as p (p.id)}
                        <tr>
                            <td>{date(p.at)}</td>
                            <td><a href="/admin/cartes/joueurs/{p.player.id}">{p.player.name}</a> <span class="muted small">({p.player.login})</span></td>
                            <td>{p.offer}</td>
                            <td>{p.given}</td>
                            <td>{p.received}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}
</main>

<style>
    main {
        width: min(1000px, 94%);
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

    main > header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    h1 {
        font-size: 2.2rem;
    }

    h2 {
        font-size: 1.3rem;
    }

    .offer {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        border-left: 4px solid var(--border);
    }

    .offer.editing {
        border-left-color: var(--accent);
    }

    .offer header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .edit {
        margin-left: auto;
    }

    .badge {
        padding: 0.05rem 0.6rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        font-size: 0.75rem;
    }

    .b-Ouverte {
        border-color: var(--primary);
        color: var(--primary);
    }

    .b-Programmée {
        border-color: var(--secondary);
        color: var(--secondary);
    }

    .b-Épuisée {
        border-color: var(--chance, #ca4444);
        color: var(--chance, #ca4444);
    }

    .trade {
        font-size: 0.95rem;
    }

    .arrow {
        color: var(--accent);
        margin: 0 0.3rem;
    }

    .warn {
        color: var(--secondary);
        font-size: 0.9rem;
    }

    .small {
        font-size: 0.8rem;
    }

    .delete {
        align-self: flex-end;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
        margin-top: 0.5rem;
    }

    th,
    td {
        text-align: left;
        padding: 0.35rem 0.5rem;
        border-bottom: 1px solid var(--border);
    }

    th {
        color: var(--muted);
        font-weight: normal;
    }

    @media (max-width: 700px) {
        table {
            display: block;
            overflow-x: auto;
        }
    }
</style>
