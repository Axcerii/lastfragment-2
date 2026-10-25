<script lang="ts">
    // Échanges : propositions reçues (à accepter ou refuser), envoyées (à annuler) et historique.
    import { enhance } from "$app/forms";
    import { page } from "$app/state";
    import Tabs from "$lib/components/ui/Tabs.svelte";
    import CollectibleCard from "$lib/components/cards/CollectibleCard.svelte";
    import { formatSerial, formatWear, TRADE_STATUSES, type OwnedCard } from "$lib/cards/types";

    let { data, form } = $props();

    // Arrivée juste après l'envoi d'une proposition : on la montre.
    const justSent = page.url.searchParams.has("envoye");
    let tab = $state<"recues" | "envoyees" | "historique">(justSent ? "envoyees" : "recues");
    let received = $derived(data.trades.filter((t) => t.incoming && t.status === "attente"));
    let sent = $derived(data.trades.filter((t) => !t.incoming && t.status === "attente"));
    let history = $derived(data.trades.filter((t) => t.status !== "attente"));
    let list = $derived(tab === "recues" ? received : tab === "envoyees" ? sent : history);
    let busy = $state<number | null>(null);

    const date = (iso: string) =>
        new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

    const submit = (id: number) => () => {
        busy = id;
        return async ({ update }: { update: () => Promise<void> }) => {
            await update();
            busy = null;
        };
    };
</script>

{#snippet side(title: string, cards: OwnedCard[])}
    <div class="side">
        <h3>{title}</h3>
        {#if cards.length === 0}
            <p class="muted small">Rien</p>
        {:else}
            <div class="cards">
                {#each cards as card (card.copy.id)}
                    <a href="/cartes/carte/{card.copy.id}" class="mini" title="{card.template.name} {formatSerial(card.copy.serial, card.template.maxPrints)}">
                        <CollectibleCard card={card.template} copy={card.copy} lite tilt="hover" />
                        <small>{formatSerial(card.copy.serial, card.template.maxPrints)} · {formatWear(card.copy.wear).slice(0, 5)}</small>
                    </a>
                {/each}
            </div>
        {/if}
    </div>
{/snippet}

<svelte:head>
    <title>Échanges : Last Fragment</title>
</svelte:head>

<main>
    <header>
        <h1>Échanges</h1>
        <a class="btn btn-accent" href="/cartes/echanges/nouveau">Nouvel échange</a>
    </header>

    {#if form?.error}<p class="message-error" role="alert">{form.error}</p>{/if}
    {#if form?.message}
        <p class="message-success" role="status">{form.message}</p>
    {:else if justSent && !form}
        <p class="message-success" role="status">Proposition envoyée.</p>
    {/if}

    <Tabs
        bind:value={tab}
        label="Échanges"
        options={[
            { value: "recues", label: "Reçues", badge: received.length },
            { value: "envoyees", label: "Envoyées", badge: sent.length },
            { value: "historique", label: "Historique", badge: history.length },
        ]}
    />

    {#each list as trade (trade.id)}
        <article class="panel trade s-{trade.status}">
            <header class="who">
                <span>
                    {#if trade.incoming}
                        <strong>{trade.from.name}</strong> te propose
                    {:else}
                        Tu proposes à <strong>{trade.to.name}</strong>
                    {/if}
                </span>
                <span class="muted small">{date(trade.createdAt)}</span>
                {#if trade.status !== "attente"}<span class="status">{TRADE_STATUSES[trade.status]}</span>{/if}
            </header>
            {#if trade.message}<p class="message">« {trade.message} »</p>{/if}

            <div class="sides">
                {@render side(trade.incoming ? `${trade.from.name} donne` : "Tu donnes", trade.offered)}
                <span class="arrow" aria-hidden="true">⇄</span>
                {@render side(trade.incoming ? "Tu donnes" : `${trade.to.name} donne`, trade.requested)}
            </div>

            {#if trade.stale}
                <p class="message-error small">Une des cartes a déjà changé de mains : cet échange ne peut plus aboutir.</p>
            {/if}

            {#if trade.status === "attente"}
                <div class="actions">
                    {#if trade.incoming}
                        <form method="POST" action="?/accept" use:enhance={submit(trade.id)}>
                            <input type="hidden" name="tradeId" value={trade.id} />
                            <button class="btn btn-accent" disabled={busy === trade.id || trade.stale}>Accepter</button>
                        </form>
                        <form method="POST" action="?/refuse" use:enhance={submit(trade.id)}>
                            <input type="hidden" name="tradeId" value={trade.id} />
                            <button class="btn btn-danger" disabled={busy === trade.id}>Refuser</button>
                        </form>
                        <a class="btn" href="/cartes/echanges/nouveau?avec={trade.from.id}">Contre-proposer</a>
                    {:else}
                        <form method="POST" action="?/cancel" use:enhance={submit(trade.id)}>
                            <input type="hidden" name="tradeId" value={trade.id} />
                            <button class="btn btn-danger" disabled={busy === trade.id}>Annuler</button>
                        </form>
                    {/if}
                </div>
            {/if}
        </article>
    {:else}
        <p class="muted">
            {tab === "recues" ? "Aucune proposition reçue." : tab === "envoyees" ? "Aucune proposition en attente." : "Aucun échange terminé."}
        </p>
    {/each}
</main>

<style>
    main {
        width: min(960px, 94%);
        margin: 0 auto;
        padding: 1.5rem 0 3rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
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

    h3 {
        font-size: 0.85rem;
        color: var(--muted);
        margin-bottom: 0.5rem;
    }

    .trade {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .s-acceptee {
        border-color: var(--primary);
    }

    .s-refusee,
    .s-annulee,
    .s-caduque {
        opacity: 0.7;
    }

    .who {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1rem;
        align-items: baseline;
    }

    .status {
        margin-left: auto;
        padding: 0.05rem 0.6rem;
        border: 1px solid var(--border);
        border-radius: 999px;
        font-size: 0.75rem;
    }

    .message {
        font-family: var(--titleFont);
        font-style: italic;
    }

    .sides {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 1rem;
        align-items: start;
    }

    .arrow {
        align-self: center;
        font-size: 1.6rem;
        color: var(--accent);
    }

    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
        gap: 0.5rem;
    }

    .mini {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        color: var(--foreground);
    }

    .mini small {
        font-size: 0.62rem;
        color: var(--muted);
        font-variant-numeric: tabular-nums;
        text-align: center;
    }

    .small {
        font-size: 0.75rem;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    @media (max-width: 600px) {
        .sides {
            grid-template-columns: 1fr;
        }

        .arrow {
            justify-self: center;
            transform: rotate(90deg);
        }
    }
</style>
