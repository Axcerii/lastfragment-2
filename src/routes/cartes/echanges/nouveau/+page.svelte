<script lang="ts">
    // Proposition d'échange : on coche ses cartes à donner et celles qu'on demande, exemplaire par
    // exemplaire (deux exemplaires d'une même carte n'ont ni le même numéro ni la même usure).
    import { enhance } from "$app/forms";
    import { untrack } from "svelte";
    import { matches } from "$lib/components/table/MediaPicker.svelte";
    import CollectibleCard from "$lib/components/cards/CollectibleCard.svelte";
    import { formatSerial, formatWear, type CopyView, type TemplateView } from "$lib/cards/types";
    import { portrait } from "$lib/game/labels";

    let { data, form } = $props();

    let tab = $state<"donne" | "demande">("donne");
    let query = $state("");
    let message = $state("");
    let sending = $state(false);
    let offered = $state<number[]>(untrack(() => (data.step === "cartes" && data.give ? [data.give] : [])));
    let requested = $state<number[]>(untrack(() => (data.step === "cartes" && data.want ? [data.want] : [])));
    if (untrack(() => data.step === "cartes" && data.want && !data.give)) tab = "demande";

    let pool = $derived(data.step === "cartes" ? (tab === "donne" ? data.mine : data.partner) : null);
    let picked = $derived(tab === "donne" ? offered : requested);

    type Pool = { templates: Record<number, TemplateView>; copies: (CopyView & { templateId: number })[] };

    function filtered(pool: Pool) {
        return pool.copies
            .filter((c) => !query || matches(pool.templates[c.templateId].name, query))
            .sort((a, b) => pool.templates[b.templateId].rarity - pool.templates[a.templateId].rarity || a.wear - b.wear);
    }

    function toggle(list: number[], id: number, max: number) {
        if (list.includes(id)) return list.filter((x) => x !== id);
        return list.length >= max ? list : [...list, id];
    }
</script>

<svelte:head>
    <title>Nouvel échange : Last Fragment</title>
</svelte:head>

<main>
    <a class="back" href="/cartes/echanges">← Échanges</a>

    {#if data.step === "partenaire"}
        <h1>Avec qui échanger ?</h1>
        <ul class="players">
            {#each data.players as p (p.id)}
                <li>
                    <a class="panel" href="?avec={p.id}{data.give ? `&donne=${data.give}` : ''}">
                        <img src={portrait(p.portrait)} alt="" loading="lazy" />
                        <span><strong>{p.name}</strong></span>
                    </a>
                </li>
            {/each}
        </ul>
    {:else}
        <h1>Échange avec {data.partner.owner.name}</h1>
        {#if form?.error}<p class="message-error" role="alert">{form.error}</p>{/if}

        <div class="tabs" role="tablist" aria-label="Côté de l’échange">
            <button type="button" role="tab" aria-selected={tab === "donne"} class:on={tab === "donne"} onclick={() => (tab = "donne")}>
                Tu donnes <span>{offered.length}</span>
            </button>
            <button type="button" role="tab" aria-selected={tab === "demande"} class:on={tab === "demande"} onclick={() => (tab = "demande")}>
                Tu demandes <span>{requested.length}</span>
            </button>
        </div>
        <input type="search" placeholder="Chercher une carte…" bind:value={query} aria-label="Chercher une carte" />

        {#if !pool || pool.copies.length === 0}
            <p class="muted">{tab === "donne" ? "Tu n’as aucune carte à donner." : `${data.partner.owner.name} n’a aucune carte.`}</p>
        {:else}
            <div class="grid">
                {#each filtered(pool) as copy (copy.id)}
                    {@const on = picked.includes(copy.id)}
                    <button
                        type="button"
                        class="pick"
                        class:on
                        aria-pressed={on}
                        onclick={() => {
                            if (tab === "donne") offered = toggle(offered, copy.id, data.max);
                            else requested = toggle(requested, copy.id, data.max);
                        }}
                    >
                        <CollectibleCard card={pool.templates[copy.templateId]} {copy} lite />
                        <small>{formatSerial(copy.serial, pool.templates[copy.templateId].maxPrints)} · {formatWear(copy.wear).slice(0, 5)}</small>
                        {#if on}<span class="check" aria-hidden="true">✓</span>{/if}
                    </button>
                {/each}
            </div>
        {/if}

        <form
            class="send"
            method="POST"
            action="?/propose"
            use:enhance={() => {
                sending = true;
                return async ({ update }) => {
                    await update();
                    sending = false;
                };
            }}
        >
            <input type="hidden" name="toId" value={data.partner.owner.id} />
            {#each offered as id (id)}<input type="hidden" name="offered" value={id} />{/each}
            {#each requested as id (id)}<input type="hidden" name="requested" value={id} />{/each}
            <input name="message" maxlength="200" placeholder="Un mot pour {data.partner.owner.name} (facultatif)" bind:value={message} aria-label="Message" />
            <div class="recap">
                <span>Tu donnes <strong>{offered.length}</strong> · tu demandes <strong>{requested.length}</strong></span>
                <button class="btn btn-accent" disabled={sending || offered.length + requested.length === 0}>
                    {sending ? "Envoi…" : "Envoyer la proposition"}
                </button>
            </div>
        </form>
    {/if}
</main>

<style>
    main {
        width: min(1000px, 94%);
        margin: 0 auto;
        padding: 1.5rem 0 3rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .back {
        color: var(--primary);
        font-size: 0.9rem;
    }

    h1 {
        font-size: 2rem;
    }

    .players {
        list-style: none;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 0.5rem;
    }

    .players a {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.6rem 0.8rem;
        color: var(--foreground);
    }

    .players a:hover {
        border-color: var(--accent);
    }

    .players img {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        object-fit: cover;
        object-position: top;
        background: #2a2a2a;
    }

    .players span {
        display: flex;
        flex-direction: column;
    }

    .tabs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        overflow: hidden;
    }

    .tabs button {
        padding: 0.7rem;
        border: none;
        background: none;
        color: var(--foreground);
        font-size: 0.95rem;
    }

    .tabs button.on {
        background: var(--accent);
        color: var(--background);
    }

    .tabs span {
        display: inline-grid;
        place-items: center;
        min-width: 1.4rem;
        height: 1.4rem;
        margin-left: 0.3rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.25);
        font-size: 0.75rem;
    }

    input[type="search"],
    .send input {
        height: 42px;
        font-size: 17px;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 0.75rem;
    }

    .pick {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.3rem;
        border: 2px solid transparent;
        border-radius: var(--radius);
        background: none;
        color: var(--foreground);
        content-visibility: auto;
        contain-intrinsic-size: 110px 180px;
    }

    .pick.on {
        border-color: var(--accent);
        background: rgba(229, 184, 204, 0.12);
    }

    .pick small {
        font-size: 0.62rem;
        color: var(--muted);
        text-align: center;
        font-variant-numeric: tabular-nums;
    }

    .check {
        position: absolute;
        top: 0.2rem;
        right: 0.2rem;
        z-index: 3;
        width: 1.6rem;
        height: 1.6rem;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: var(--accent);
        color: var(--background);
        font-weight: 700;
    }

    .send {
        position: sticky;
        bottom: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem 0;
        background: linear-gradient(transparent, var(--background) 20%);
    }

    .recap {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
        font-size: 0.9rem;
    }

    @media (max-width: 700px) {
        .send {
            bottom: 4.2rem;
        }

        .grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }
</style>
