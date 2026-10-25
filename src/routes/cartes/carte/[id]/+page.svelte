<script lang="ts">
    // Un exemplaire, comme l'inspection d'un objet de CS : la carte en grand, son numéro de série,
    // son usure, et tous ses propriétaires successifs.
    import { enhance } from "$app/forms";
    import CollectibleCard from "$lib/components/cards/CollectibleCard.svelte";
    import {
        CARD_TYPES,
        formatSerial,
        formatWear,
        padNumber,
        rarityLabel,
        WEAR_TIERS,
        wearTier,
    } from "$lib/cards/types";

    let { data, form } = $props();
    let card = $derived(data.card);
    let t = $derived(card.template);
    let c = $derived(card.copy);
    let flipped = $state(false);

    const EVENTS: Record<string, string> = {
        tirage: "Tirée d’un booster par",
        don: "Donnée par le MJ à",
        echange: "Échangée",
        transfert: "Transférée par le MJ",
        retrait: "Retirée par le MJ à",
    };

    const date = (iso: string) =>
        new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

    const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });
</script>

<svelte:head>
    <title>{t.name} {formatSerial(c.serial, t.maxPrints)} : Last Fragment</title>
</svelte:head>

<main>
    <div class="card">
        <CollectibleCard card={t} copy={c} bind:flipped tilt="full" glow={t.rarity >= 3} label={t.name} />
        <button type="button" class="btn btn-small" onclick={() => (flipped = !flipped)}>{flipped ? "Recto" : "Verso"}</button>
    </div>

    <section class="details">
        <span class="kicker" style="color: var(--rarity-{t.rarity})">{rarityLabel(t.rarity)} · {CARD_TYPES[t.type].label}</span>
        <h1>{t.name}</h1>
        {#if t.face.subtitle}<p class="muted">{t.face.subtitle}</p>{/if}

        <dl>
            <div><dt>N° de série</dt><dd>{formatSerial(c.serial, t.maxPrints)}</dd></div>
            <div><dt>Série</dt><dd>{t.set ? `${t.set.name} · ${t.set.code} ${padNumber(t.number)}/${padNumber(t.set.total)}` : "Hors série"}</dd></div>
            <div><dt>Propriétaire</dt><dd>{#if c.owner}<a href="/cartes/joueurs/{c.owner.id}">{c.owner.name}</a>{:else}Réserve du MJ{/if}</dd></div>
            <div><dt>En circulation</dt><dd>{data.circulating} exemplaire{data.circulating > 1 ? "s" : ""}{t.maxPrints ? ` sur ${t.maxPrints}` : ""}</dd></div>
        </dl>

        <div class="wear">
            <div class="wear-head">
                <span>Usure</span>
                <strong>{wearTier(c.wear).label}</strong>
                <code>{formatWear(c.wear)}</code>
            </div>
            <div class="scale" aria-hidden="true">
                {#each WEAR_TIERS as tier (tier.key)}
                    <span style="flex: {tier.max - tier.min}" title={tier.label}></span>
                {/each}
                <i style="left: {c.wear * 100}%"></i>
            </div>
        </div>

        {#if form?.error}<p class="message-error" role="alert">{form.error}</p>{/if}

        <div class="actions">
            {#if data.mine}
                <form method="POST" action="?/pin" use:enhance={keep}>
                    <button class="btn btn-accent">{c.pinned ? "Retirer de la vitrine" : "Mettre en vitrine"}</button>
                </form>
                <a class="btn" href="/cartes/echanges/nouveau?donne={c.id}">Proposer en échange</a>
            {:else if c.owner}
                <a class="btn btn-accent" href="/cartes/echanges/nouveau?avec={c.owner.id}&carte={c.id}">Demander cette carte</a>
            {/if}
        </div>

        {#if data.isAdmin}
            <div class="panel mj">
                <h2>MJ</h2>
                <form method="POST" action="?/move" use:enhance={keep} class="row">
                    <select name="toId" required aria-label="Joueur">
                        <option value="">Déplacer vers…</option>
                        {#each data.players as p (p.id)}<option value={p.id}>{p.login}</option>{/each}
                    </select>
                    <button class="btn btn-small">Déplacer</button>
                </form>
                {#if c.owner}
                    <form
                        method="POST"
                        action="?/remove"
                        use:enhance={({ cancel }) => {
                            if (!confirm(`Retirer cette carte à ${c.owner?.name} ? Elle reste dans ta réserve.`)) cancel();
                            return keep();
                        }}
                    >
                        <button class="btn btn-small btn-danger">Retirer au joueur</button>
                    </form>
                {/if}
                <a class="btn btn-small" href="/admin/cartes/{t.id}">Modifier le modèle</a>
            </div>
        {/if}

        <h2>Historique</h2>
        <ol class="history">
            {#each data.events as e (e.id)}
                <li>
                    <time>{date(e.at)}</time>
                    <span>
                        {EVENTS[e.kind] ?? e.kind}
                        {#if e.kind === "echange" || e.kind === "transfert"}
                            de <strong>{e.from ?? "?"}</strong> à <strong>{e.to ?? "?"}</strong>
                        {:else if e.kind === "retrait"}
                            <strong>{e.from ?? "?"}</strong>
                        {:else}
                            <strong>{e.to ?? "?"}</strong>
                        {/if}
                    </span>
                </li>
            {/each}
        </ol>
    </section>
</main>

<style>
    select {
        padding-top: 0;
        padding-bottom: 0;
    }

    main {
        width: min(1000px, 94%);
        margin: 0 auto;
        padding: 1.5rem 0 3rem;
        display: grid;
        grid-template-columns: minmax(240px, 380px) 1fr;
        gap: 2rem;
        align-items: start;
    }

    .card {
        position: sticky;
        top: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
    }

    .details {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-width: 0;
    }

    .kicker {
        font-size: 0.8rem;
        letter-spacing: 0.15em;
        text-transform: uppercase;
    }

    h1 {
        font-size: 2.4rem;
        line-height: 1.05;
    }

    h2 {
        font-size: 1.15rem;
    }

    dl {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
    }

    dt {
        font-size: 0.72rem;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    dd a {
        color: var(--accent);
    }

    .wear-head {
        display: flex;
        align-items: baseline;
        gap: 0.75rem;
    }

    .wear-head span {
        font-size: 0.72rem;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    code {
        font-variant-numeric: tabular-nums;
        color: var(--muted);
    }

    /* Échelle d'usure, de neuve (vert) à marquée par le combat (rouge), comme sur CS. */
    .scale {
        position: relative;
        display: flex;
        height: 8px;
        margin-top: 0.4rem;
        border-radius: 4px;
        overflow: visible;
    }

    .scale span:nth-child(1) {
        background: #4caf7a;
    }
    .scale span:nth-child(2) {
        background: #8bc34a;
    }
    .scale span:nth-child(3) {
        background: #d2b674;
    }
    .scale span:nth-child(4) {
        background: #e08a4a;
    }
    .scale span:nth-child(5) {
        background: #ca4444;
    }

    .scale span:first-child {
        border-radius: 4px 0 0 4px;
    }

    .scale span:last-of-type {
        border-radius: 0 4px 4px 0;
    }

    .scale i {
        position: absolute;
        top: -5px;
        width: 3px;
        height: 18px;
        margin-left: -1.5px;
        background: #fff;
        box-shadow: 0 0 4px #000;
        border-radius: 2px;
    }

    .actions,
    .mj,
    .row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
    }

    .mj h2 {
        width: 100%;
    }

    .row select {
        height: 36px;
        font-size: 16px;
        width: auto;
    }

    .history {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        border-left: 2px solid var(--border);
        padding-left: 1rem;
        font-size: 0.85rem;
    }

    .history li {
        display: flex;
        flex-direction: column;
    }

    time {
        font-size: 0.72rem;
        color: var(--muted);
    }

    @media (max-width: 760px) {
        main {
            grid-template-columns: 1fr;
        }

        .card {
            position: static;
            width: min(78vw, 340px);
            margin: 0 auto;
        }
    }
</style>
