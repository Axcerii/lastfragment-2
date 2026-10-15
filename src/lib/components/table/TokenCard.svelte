<script lang="ts">
    import { STATS, STAT_KEYS, COMBAT_STATS, SOCIAL_STATS, type StatKey } from "$lib/game/stats";
    import { statForRoll } from "$lib/game/combat";
    import type { TableClient } from "$lib/table/client.svelte";
    import { SIDES, SIDE_LABELS, type TokenView } from "$lib/table/types";
    import { GAUGE_INFO, gaugeRatio, type GaugeKey } from "./gauges";

    let {
        token,
        client,
        isAdmin,
        inOrder,
        onclose,
    }: {
        token: TokenView;
        client: TableClient;
        isAdmin: boolean;
        inOrder: boolean;
        onclose: () => void;
    } = $props();

    let amount = $state(100);
    let editing = $state(false);
    let draft = $state<Record<StatKey, number>>({} as Record<StatKey, number>);

    const update = (fields: Record<string, unknown>) => client.act("token.update", { id: token.id, ...fields });
    const gauge = (key: GaugeKey, delta: number) =>
        client.act("token.gauge", { id: token.id, gauge: key, delta });

    function startEdit() {
        if (!token.stats) return;
        draft = { ...token.stats };
        editing = true;
    }

    async function saveStats() {
        await update({ stats: draft });
        editing = false;
    }

    async function remove() {
        if (!confirm(`Retirer ${token.name} du plateau ?`)) return;
        await client.act("token.delete", { id: token.id });
        onclose();
    }

    async function toggleOrder() {
        const order = client.view?.session.order ?? [];
        await client.act("order.set", {
            order: inOrder ? order.filter((id) => id !== token.id) : [...order, token.id],
        });
    }

    const KIND_LABELS = {
        player: "Joueur",
        character: "Personnage",
        monster: "Monstre",
        custom: "Jeton libre",
    } as const;
</script>

<article class="card" aria-label="Jeton {token.name}">
    <header>
        {#if token.image}
            <img src={token.image} alt="" />
        {/if}
        <div class="title">
            <h3>{token.name}</h3>
            <span class="muted">
                {KIND_LABELS[token.kind]} · {SIDE_LABELS[token.side]}
                {#if token.hidden}· <strong class="warn">caché</strong>{/if}
                {#if token.nameHidden && isAdmin}· <strong class="warn">nom caché</strong>{/if}
            </span>
        </div>
        <button class="btn btn-small" onclick={onclose} aria-label="Fermer la fiche">✕</button>
    </header>

    <div class="gauges">
        {#each Object.entries(GAUGE_INFO) as [key, info] (key)}
            {@const g = token[key as GaugeKey]}
            {#if g}
                {@const ratio = gaugeRatio(g) ?? 0}
                <div class="gauge">
                    <span class="label">{info.label}</span>
                    <div class="bar" title={"current" in g ? `${g.current} / ${g.max}` : ""}>
                        <span style="width: {ratio * 100}%; background-color: {info.color};"></span>
                    </div>
                    <span class="value">
                        {#if "current" in g}{g.current} / {g.max}{:else}{Math.round(ratio * 100)} %{/if}
                    </span>
                    {#if isAdmin}
                        <span class="adjust">
                            <button class="btn btn-small" onclick={() => gauge(key as GaugeKey, -amount)} aria-label="Retirer {amount} {info.label}">−</button>
                            <button class="btn btn-small" onclick={() => gauge(key as GaugeKey, amount)} aria-label="Ajouter {amount} {info.label}">+</button>
                        </span>
                    {/if}
                </div>
            {/if}
        {/each}
        {#if isAdmin}
            <label class="amount">
                Montant
                <input type="number" min="1" bind:value={amount} />
            </label>
        {/if}
    </div>

    {#if token.stats}
        {#if editing}
            <div class="edit">
                {#each STAT_KEYS as key (key)}
                    <label>
                        <span>{STATS[key].abbr}</span>
                        <input type="number" min="0" bind:value={draft[key]} />
                    </label>
                {/each}
            </div>
            <div class="row">
                <button class="btn btn-small btn-accent" onclick={saveStats}>Enregistrer</button>
                <button class="btn btn-small" onclick={() => (editing = false)}>Annuler</button>
            </div>
        {:else}
            <dl class="stats">
                {#each [...COMBAT_STATS, ...SOCIAL_STATS] as key (key)}
                    {@const armor = token.armor?.[key] ?? 0}
                    <div title={armor ? `dont armure ${armor > 0 ? "+" : ""}${armor}` : STATS[key].label}>
                        <dt>{STATS[key].abbr}</dt>
                        <dd>{statForRoll(key, token.stats[key])}</dd>
                    </div>
                {/each}
            </dl>
        {/if}
    {:else}
        <p class="muted small">Statistiques inconnues.</p>
    {/if}

    {#if isAdmin}
        <div class="controls">
            <div class="row">
                <label class="inline">
                    Camp
                    <select value={token.side} onchange={(e) => update({ side: e.currentTarget.value })}>
                        {#each SIDES as side (side)}
                            <option value={side}>{SIDE_LABELS[side]}</option>
                        {/each}
                    </select>
                </label>
                <span class="muted small hint">Taille {token.size}×{token.size} : tire le coin rose du jeton.</span>
            </div>
            <div class="row">
                <button class="btn btn-small" title="Raccourci : H" onclick={() => update({ hidden: !token.hidden })}>
                    {token.hidden ? "Montrer aux joueurs" : "Cacher aux joueurs"}
                </button>
                {#if token.kind !== "player"}
                    <button class="btn btn-small" title="Raccourci : N" onclick={() => update({ nameHidden: !token.nameHidden })}>
                        {token.nameHidden ? "Montrer le nom" : "Cacher le nom"}
                    </button>
                {/if}
                <button class="btn btn-small" title="Raccourci : S" onclick={() => update({ revealed: !token.revealed })}>
                    {token.revealed ? "Masquer les stats" : "Révéler les stats"}
                </button>
                <button class="btn btn-small" title="Raccourci : O" onclick={toggleOrder}>
                    {inOrder ? "Retirer de l'ordre" : "Ajouter à l'ordre"}
                </button>
            </div>
            <div class="row">
                {#if !editing}
                    <button class="btn btn-small" onclick={startEdit}>Modifier les stats</button>
                {/if}
                <button class="btn btn-small" onclick={() => client.act("token.restore", { id: token.id })}>
                    Jauges au max
                </button>
                {#if token.kind !== "custom"}
                    <button
                        class="btn btn-small"
                        title="Relit la fiche (armure, passifs) sans toucher aux jauges"
                        onclick={() => client.act("token.refresh", { id: token.id })}>Relire la fiche</button
                    >
                {/if}
                {#if token.kind !== "player"}
                    <button class="btn btn-small" title="Raccourci : Ctrl+D" onclick={() => client.act("token.duplicate", { id: token.id })}>
                        Dupliquer
                    </button>
                {/if}
                <button class="btn btn-small btn-danger" title="Raccourci : Suppr" onclick={remove}>Retirer</button>
            </div>
        </div>
    {/if}
</article>

<style>
    .card {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem;
        background-color: rgba(27, 27, 27, 0.95);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.6);
        font-size: 0.85rem;
    }

    header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    header img {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        object-fit: cover;
    }

    .title {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    h3 {
        font-size: 1.3rem;
    }

    .warn {
        color: var(--secondary);
    }

    .gauges {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }

    .gauge {
        display: grid;
        grid-template-columns: 2.5rem 1fr auto auto;
        align-items: center;
        gap: 0.5rem;
    }

    .bar {
        height: 0.6rem;
        border-radius: 999px;
        background-color: rgba(255, 255, 255, 0.1);
        overflow: hidden;
    }

    .bar span {
        display: block;
        height: 100%;
        transition: width 0.3s;
    }

    .value {
        font-variant-numeric: tabular-nums;
        min-width: 5.5rem;
        text-align: right;
    }

    .adjust {
        display: flex;
        gap: 0.25rem;
    }

    .adjust .btn {
        min-height: 26px;
        width: 26px;
        padding: 0;
    }

    .amount {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.5rem;
    }

    .amount input {
        width: 6rem;
        height: 30px;
        font-size: 16px;
    }

    .stats {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 0.35rem;
    }

    .stats div {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0.25rem;
        border-radius: var(--radius);
        background-color: rgba(255, 255, 255, 0.05);
    }

    dt {
        font-size: 0.75rem;
        color: var(--muted);
    }

    dd {
        font-size: 1.05rem;
        font-variant-numeric: tabular-nums;
    }

    .edit {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
        gap: 0.35rem;
    }

    .edit label {
        display: flex;
        flex-direction: column;
        font-size: 0.75rem;
    }

    .edit input,
    select {
        height: 30px;
        font-size: 15px;
        padding: 0 0.4rem;
    }

    .controls {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        border-top: 1px solid var(--border);
        padding-top: 0.75rem;
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
    }

    .inline {
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }

    .inline select {
        width: auto;
    }

    .hint {
        align-self: center;
    }

    .small {
        font-size: 0.8rem;
    }
</style>
