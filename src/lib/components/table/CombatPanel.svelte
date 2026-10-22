<script lang="ts">
    import { statForRoll } from "$lib/game/combat";
    import type { TableClient } from "$lib/table/client.svelte";
    import type { TableView, TokenView } from "$lib/table/types";

    let {
        client,
        view,
        sceneTokens,
    }: { client: TableClient; view: TableView; sceneTokens: TokenView[] } = $props();

    let session = $derived(view.session);
    let byId = $derived(new Map(view.tokens.map((t) => [t.id, t])));
    let order = $derived(session.order.filter((id) => byId.has(id)));

    const setOrder = (ids: number[]) => client.act("order.set", { order: ids });

    function move(index: number, delta: number) {
        const ids = [...order];
        const [id] = ids.splice(index, 1);
        ids.splice(Math.max(0, Math.min(ids.length, index + delta)), 0, id);
        setOrder(ids);
    }

    function next() {
        if (order.length === 0) return;
        const index = session.turn === null ? -1 : order.indexOf(session.turn);
        client.act("order.turn", { turn: order[(index + 1) % order.length] });
    }

    function addScene() {
        const missing = sceneTokens.filter((t) => !order.includes(t.id)).map((t) => t.id);
        setOrder([...order, ...missing]);
    }
</script>

<div class="panel-body">
    <section>
        <h3>Combat</h3>
        <button
            class="btn {session.combat ? 'btn-danger' : 'btn-accent'}"
            onclick={() => client.act("combat.set", { combat: !session.combat })}
        >
            {session.combat ? "Terminer le combat" : "Lancer un combat"}
        </button>
        <p class="muted small">
            Pas de tour imposé : chacun agit quand tu le décides. L'ordre ci-dessous n'est qu'un repère,
            que tu peux montrer aux joueurs.
        </p>
    </section>

    <section>
        <h3>Ordre de passage</h3>
        <label class="check players-check">
            <input
                type="checkbox"
                checked={session.orderVisible}
                onchange={(e) => client.act("order.visible", { visible: e.currentTarget.checked })}
            />
            Afficher l'ordre aux joueurs
        </label>
        <div class="row">
            <button class="btn btn-small" onclick={() => client.act("order.sort")}>Trier par Vitesse</button>
            <button class="btn btn-small" onclick={addScene}>Ajouter la scène</button>
            <button class="btn btn-small" disabled={order.length === 0} onclick={() => setOrder([])}>Vider</button>
        </div>

        <ol>
            {#each order as id, index (id)}
                {@const token = byId.get(id)!}
                <li class:turn={session.turn === id}>
                    <span class="rank">{index + 1}</span>
                    <button class="name" onclick={() => client.act("order.turn", { turn: id })} title="Mettre en avant">
                        {token.name}
                        {#if token.stats}<span class="muted">VIT {statForRoll("vitesse", token.stats.vitesse)}</span>{/if}
                    </button>
                    <button class="btn btn-small" disabled={index === 0} onclick={() => move(index, -1)} aria-label="Monter">↑</button>
                    <button class="btn btn-small" disabled={index === order.length - 1} onclick={() => move(index, 1)} aria-label="Descendre">↓</button>
                    <button class="btn btn-small" onclick={() => setOrder(order.filter((o) => o !== id))} aria-label="Retirer">✕</button>
                </li>
            {:else}
                <li class="muted">Ordre vide. Trie par Vitesse ou ajoute des jetons depuis leur fiche.</li>
            {/each}
        </ol>

        <div class="row">
            <button class="btn btn-accent" disabled={order.length === 0} onclick={next}>Au suivant</button>
            <button class="btn btn-small" disabled={session.turn === null} onclick={() => client.act("order.turn", { turn: null })}>
                Personne en avant
            </button>
        </div>
    </section>
</div>

<style>
    .panel-body {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        font-size: 0.9rem;
    }

    section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    section + section {
        border-top: 1px solid var(--border);
        padding-top: 0.75rem;
    }

    h3 {
        font-size: 1.15rem;
    }

    .check {
        display: flex;
        align-items: center;
        gap: 0.35rem;
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
    }

    ol {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    li {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.2rem 0.4rem;
        border-radius: var(--radius);
    }

    li.turn {
        background-color: rgba(229, 184, 204, 0.2);
        outline: 1px solid var(--accent);
    }

    .rank {
        width: 1.5rem;
        text-align: center;
        color: var(--muted);
    }

    .name {
        flex: 1;
        display: flex;
        gap: 0.5rem;
        align-items: baseline;
        border: none;
        background: none;
        color: var(--foreground);
        text-align: left;
        font-size: 0.9rem;
    }

    .btn-small {
        min-height: 28px;
        padding: 0 0.45rem;
    }

    .small {
        font-size: 0.8rem;
    }
</style>
