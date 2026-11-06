<script lang="ts">
    // Page d'un joueur dans l'espace MJ : sa réserve de boosters, ses ouvertures, et ses cartes
    // (don, retrait vers la réserve du MJ, déplacement vers un autre joueur, vitrine).
    import { enhance } from "$app/forms";
    import Countdown from "$lib/components/cards/Countdown.svelte";
    import { portrait } from "$lib/game/labels";
    import { formatSerial, formatWear, padNumber, RARITIES, rarityLabel, wearTier } from "$lib/cards/types";

    let { data, form } = $props();

    const UNSEEN_DAYS = 14;

    // ─── Cartes : filtre et sélection ───
    let query = $state("");
    let rarity = $state(0);
    let selected = $state<number[]>([]);

    const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    let shown = $derived(
        data.copies.filter(
            (c) =>
                (!rarity || c.template.rarity === rarity) &&
                (!query || normalize(`${c.template.name} ${c.template.set ?? ""} ${c.serial}`).includes(normalize(query))),
        ),
    );
    let allShown = $derived(shown.length > 0 && shown.every((c) => selected.includes(c.id)));

    function toggleAll() {
        const ids = shown.map((c) => c.id);
        selected = allShown ? selected.filter((id) => !ids.includes(id)) : [...new Set([...selected, ...ids])];
    }

    // Les exemplaires partis (retirés, déplacés) ne restent pas cochés.
    $effect(() => {
        const present = new Set(data.copies.map((c) => c.id));
        if (selected.some((id) => !present.has(id))) selected = selected.filter((id) => present.has(id));
    });

    // ─── Don d'une carte ───
    let giveQuery = $state("");
    let giveOptions = $derived(
        giveQuery
            ? data.templates.filter((t) => normalize(`${t.name} ${t.set ?? ""} ${padNumber(t.number)}`).includes(normalize(giveQuery)))
            : data.templates,
    );

    const date = (iso: string) =>
        new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
    const replayable = (iso: string) => Date.now() - new Date(iso).getTime() < UNSEEN_DAYS * 86_400_000;
    const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });
</script>

<svelte:head>
    <title>Cartes de {data.player.name} : Espace MJ</title>
</svelte:head>

<main>
    <a class="back" href="/admin/cartes/joueurs">← Cartes par joueur</a>

    <header class="head">
        <img src={portrait(data.player.portrait)} alt="" />
        <div>
            <h1>{data.player.name}</h1>
            <p class="muted">
                {data.player.login} · {data.stats.copies} carte{data.stats.copies > 1 ? "s" : ""} ({data.stats.distinct} différente{data.stats.distinct > 1 ? "s" : ""})
                {#if data.stats.uniques}· {data.stats.uniques} Unique{data.stats.uniques > 1 ? "s" : ""}{/if}
                {#if data.stats.pendingTrades}· {data.stats.pendingTrades} échange{data.stats.pendingTrades > 1 ? "s" : ""} en attente{/if}
            </p>
        </div>
        <nav>
            {#if data.player.characterId}<a class="btn btn-small" href="/admin/fiches/{data.player.id}">Fiche</a>{/if}
            <a class="btn btn-small" href="/cartes/joueurs/{data.player.id}">Collection côté joueur</a>
        </nav>
    </header>

    {#if form?.error}<p class="message-error" role="alert">{form.error}</p>{/if}
    {#if form?.message}<p class="message-success" role="status">{form.message}</p>{/if}

    <div class="columns">
        <section class="panel boosters">
            <h2>Boosters</h2>
            {#if data.wallet}
                <p class="stock">
                    <b>{data.wallet.stock}</b> / {data.rules.max} en réserve
                    <span class="muted small">
                        · {data.wallet.opened} ouvert{data.wallet.opened > 1 ? "s" : ""}
                        {#if data.wallet.nextAt}· prochain dans <Countdown until={data.wallet.nextAt} />{:else}· réserve pleine, le compteur attend{/if}
                    </span>
                </p>
            {:else}
                <p class="muted small">
                    Jamais venu sur les cartes : {data.rules.starter} booster{data.rules.starter > 1 ? "s" : ""} de départ l’attendent.
                    Fixer la réserve ici remplace ces boosters de départ.
                </p>
            {/if}

            <form method="POST" action="?/gift" use:enhance={keep} class="row">
                <label class="grow">Ajouter / retirer <input name="amount" type="number" min="-50" max="50" value="1" /></label>
                <button class="btn btn-accent">Appliquer</button>
            </form>
            <form method="POST" action="?/stock" use:enhance={keep} class="row">
                <label class="grow">Réserve exacte <input name="stock" type="number" min="0" max="99" value={data.wallet?.stock ?? data.rules.starter} /></label>
                <button class="btn">Fixer</button>
            </form>
            <p class="muted small">Ajouter peut dépasser le maximum. Fixer la réserve relance le compteur du prochain booster.</p>
        </section>

        <section class="panel give">
            <h2>Donner une carte</h2>
            <form method="POST" action="?/give" use:enhance={keep}>
                <input type="search" placeholder="Filtrer les cartes…" bind:value={giveQuery} aria-label="Filtrer les cartes à donner" />
                <select name="templateId" required size="6" aria-label="Carte à donner">
                    {#each giveOptions as t (t.id)}
                        <option value={t.id} disabled={t.remaining === 0} style="--c: var(--rarity-{t.rarity})">
                            {t.set ? `${t.set} ${padNumber(t.number)}` : "Hors série"} · {t.name} · {rarityLabel(t.rarity)}{t.remaining !== null ? ` · reste ${t.remaining}` : ""}
                        </option>
                    {/each}
                </select>
                <div class="row">
                    <label class="grow">Exemplaires <input name="count" type="number" min="1" max="20" value="1" /></label>
                    <button class="btn btn-accent">Donner</button>
                </div>
            </form>
        </section>
    </div>

    <section class="panel">
        <header class="bar">
            <h2>Collection</h2>
            <div class="filters">
                <input type="search" placeholder="Nom, série, n°…" bind:value={query} aria-label="Chercher dans la collection" />
                <select bind:value={rarity} aria-label="Rareté">
                    <option value={0}>Toutes raretés</option>
                    {#each RARITIES as label, i (label)}<option value={i + 1}>{label}</option>{/each}
                </select>
            </div>
        </header>

        {#if data.copies.length === 0}
            <p class="muted">Aucune carte pour l’instant.</p>
        {:else}
            <form method="POST" use:enhance={keep}>
                <div class="actions">
                    <span class="muted small">{selected.length} cochée{selected.length > 1 ? "s" : ""}</span>
                    <button class="btn btn-small btn-danger" formaction="?/remove" disabled={!selected.length}
                        onclick={(e) => { if (!confirm(`Retirer ${selected.length} carte(s) à ${data.player.name} ? Elles iront dans ta réserve.`)) e.preventDefault(); }}>
                        Retirer
                    </button>
                    <select name="toId" aria-label="Déplacer vers">
                        <option value="">Déplacer vers…</option>
                        {#each data.players as p (p.id)}<option value={p.id}>{p.label}</option>{/each}
                    </select>
                    <button class="btn btn-small" formaction="?/move" disabled={!selected.length}>Déplacer</button>
                    <button class="btn btn-small" formaction="?/unpin" disabled={!selected.length}>Retirer de la vitrine</button>
                </div>

                <div class="table">
                    <table>
                        <thead>
                            <tr>
                                <th><input type="checkbox" checked={allShown} onchange={toggleAll} aria-label="Tout cocher" /></th>
                                <th>Carte</th>
                                <th>Série</th>
                                <th>Exemplaire</th>
                                <th>Usure</th>
                                <th>Origine</th>
                                <th>Obtenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each shown as c (c.id)}
                                <tr style="--c: var(--rarity-{c.template.rarity})">
                                    <td><input type="checkbox" name="cards" value={c.id} bind:group={selected} aria-label="Cocher {c.template.name} {formatSerial(c.serial, c.template.maxPrints)}" /></td>
                                    <td class="name">
                                        {#if c.template.thumb}<img src={c.template.thumb} alt="" loading="lazy" />{:else}<span class="blank"></span>{/if}
                                        <a href="/cartes/carte/{c.id}">{c.template.name}</a>
                                        {#if c.pinned}<span class="pin" title="En vitrine">★</span>{/if}
                                        <i class="gem" title={rarityLabel(c.template.rarity)}></i>
                                    </td>
                                    <td>{c.template.set ? `${c.template.set} ${padNumber(c.template.number)}` : "—"}</td>
                                    <td class="num">{formatSerial(c.serial, c.template.maxPrints)}</td>
                                    <td class="num" title={wearTier(c.wear).label}>{formatWear(c.wear)}</td>
                                    <td>{c.origin === "mj" ? "Don du MJ" : "Booster"}</td>
                                    <td class="num">{date(c.obtainedAt)}</td>
                                </tr>
                            {:else}
                                <tr><td colspan="7" class="muted">Aucune carte ne correspond.</td></tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </form>
        {/if}
    </section>

    <section class="panel">
        <h2>Derniers boosters ouverts</h2>
        {#if data.openings.length === 0}
            <p class="muted">Aucun booster ouvert.</p>
        {:else}
            <div class="table">
                <table>
                    <thead><tr><th>Date</th><th>Booster</th><th>Paquet</th><th>Cartes</th><th>Vu</th><th></th></tr></thead>
                    <tbody>
                        {#each data.openings as o (o.id)}
                            <tr>
                                <td class="num">{date(o.at)}</td>
                                <td>{o.title} <span class="muted small">{o.code}</span></td>
                                <td>{o.pack ?? "Par défaut"}</td>
                                <td class="num">{o.cards}</td>
                                <td>{o.seen ? "Oui" : "Pas encore"}</td>
                                <td>
                                    {#if o.seen && replayable(o.at)}
                                        <form method="POST" action="?/replay" use:enhance={keep}>
                                            <input type="hidden" name="openingId" value={o.id} />
                                            <button class="btn btn-small" title="Le joueur pourra revoir l’ouverture ; ses cartes ne changent pas.">Reproposer</button>
                                        </form>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            <p class="muted small">« Reproposer » rejoue l’animation d’ouverture pour le joueur (ouvertures de moins de {UNSEEN_DAYS} jours), sans toucher à ses cartes.</p>
        {/if}
    </section>
</main>

<style>
    main {
        width: min(1100px, 94%);
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

    .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1rem;
    }

    .head > div {
        flex: 1;
        min-width: 12rem;
    }

    .head img {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        object-fit: cover;
        object-position: top;
        background: #2a2a2a;
    }

    .head nav {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    h1 {
        font-size: 2rem;
    }

    h2 {
        font-size: 1.2rem;
    }

    .columns {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
        gap: 1rem;
    }

    section,
    .give form {
        display: flex;
        flex-direction: column;
        gap: 0.7rem;
    }

    .row {
        display: flex;
        align-items: flex-end;
        gap: 0.6rem;
    }

    .grow {
        flex: 1;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.85rem;
    }

    input:not([type="checkbox"]),
    select:not([size]) {
        height: 40px;
        font-size: 16px;
    }

    select {
        padding-top: 0;
        padding-bottom: 0;
    }

    select[size] {
        height: 11rem;
        font-size: 0.9rem;
        padding: 0.3rem;
    }

    .filters input,
    .filters select {
        width: auto;
        min-width: 10rem;
    }

    .stock b {
        font-size: 1.6rem;
        color: var(--primary);
    }

    .small {
        font-size: 0.78rem;
    }

    .bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.6rem;
    }

    .filters,
    .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
    }

    .actions {
        position: sticky;
        top: 0;
        z-index: 2;
        padding: 0.5rem 0;
        background: var(--surface);
    }

    .actions select {
        height: 34px;
        font-size: 0.9rem;
        max-width: 14rem;
    }

    .table {
        overflow-x: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.88rem;
    }

    th,
    td {
        padding: 0.35rem 0.5rem;
        text-align: left;
        border-bottom: 1px solid var(--border);
        white-space: nowrap;
    }

    th {
        font-weight: 600;
        color: var(--muted);
        font-size: 0.78rem;
    }

    .num {
        font-variant-numeric: tabular-nums;
    }

    .name {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .name img,
    .blank {
        width: 28px;
        height: 28px;
        border-radius: 4px;
        object-fit: cover;
        object-position: top;
        background: #2a2a2a;
        flex-shrink: 0;
    }

    .name a {
        color: var(--foreground);
        text-decoration: underline;
        text-decoration-color: color-mix(in srgb, var(--c) 60%, transparent);
    }

    .gem {
        width: 0.55rem;
        height: 0.55rem;
        transform: rotate(45deg);
        background: var(--c);
        flex-shrink: 0;
    }

    .pin {
        color: var(--primary);
    }
</style>
