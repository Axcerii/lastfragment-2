<script lang="ts">
    // Séries : chacune est une bannière de boosters (avec dates de début et de fin facultatives)
    // et numérote ses cartes. Le booster « All », lui, est toujours ouvert.
    import { enhance } from "$app/forms";
    import DateTimeInput from "$lib/components/cards/creator/DateTimeInput.svelte";
    import ImageInput from "$lib/components/cards/creator/ImageInput.svelte";
    import PackEditor from "$lib/components/cards/creator/PackEditor.svelte";

    let { data, form } = $props();

    type SetRow = (typeof data.sets)[number];
    const blank: SetRow = {
        id: 0,
        name: "",
        code: "",
        description: "",
        logo: null,
        banner: null,
        color: "#e5b8cc",
        active: false,
        startsAt: null,
        endsAt: null,
        sortOrder: 0,
        cards: 0,
        published: 0,
        packs: [],
    };

    function status(s: SetRow) {
        if (!s.active) return "Fermée";
        const now = Date.now();
        if (s.startsAt && new Date(s.startsAt).getTime() > now) return "Programmée";
        if (s.endsAt && new Date(s.endsAt).getTime() <= now) return "Terminée";
        return "Ouverte";
    }

    const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });
</script>

<svelte:head>
    <title>Séries de cartes : Espace MJ</title>
</svelte:head>

<main>
    <a class="back" href="/admin/cartes">← Cartes</a>
    <h1>Séries et bannières</h1>
    <p class="muted">
        Une série ouverte propose son propre booster aux joueurs, à côté du booster All. Les dates bornent une bannière
        temporaire ; une série fermée garde ses cartes et son album.
    </p>
    <p class="muted small">
        Paquets : l’illustration couvre toute la face avant (format conseillé 1000 × 1620 px, les bords haut et bas
        sont sertis et un peu rognés). Les textes du site ne s’y ajoutent que si tu les demandes.
    </p>
    {#if form?.error}<p class="message-error" role="alert">{form.error}</p>{/if}
    {#if form?.message}<p class="message-success" role="status">{form.message}</p>{/if}

    <section class="panel set all">
        <header><h2>Booster All</h2><span class="muted small">Toujours ouvert, pioche dans toutes les cartes publiées.</span></header>
        <PackEditor target="all" title="Booster All" code="ALL" packs={data.allPacks} color="#cfdfc4" />
    </section>

    {#each [...data.sets, blank] as s (s.id)}
        <form class="panel set" method="POST" action="?/save" use:enhance={keep} style="--c: {s.color}">
            <input type="hidden" name="id" value={s.id || ""} />
            <header>
                <h2>{s.id ? s.name : "Nouvelle série"}</h2>
                {#if s.id}
                    <span class="badge b-{status(s)}">{status(s)}</span>
                    <span class="muted small">{s.published} publiée{s.published > 1 ? "s" : ""} / {s.cards} carte{s.cards > 1 ? "s" : ""}</span>
                {/if}
            </header>
            <div class="fields">
                <label class="wide">Nom <input name="name" value={s.name} maxlength="80" required /></label>
                <label>Code <input name="code" value={s.code} maxlength="8" required placeholder="ARC1" /></label>
                <label>Couleur <input type="color" name="color" value={s.color} /></label>
                <label>Ordre <input type="number" name="sortOrder" value={s.sortOrder} min="0" max="9999" /></label>
                <label class="wide">Description <input name="description" value={s.description} maxlength="400" /></label>
                <label>Début <DateTimeInput name="startsAt" value={s.startsAt} /></label>
                <label>Fin <DateTimeInput name="endsAt" value={s.endsAt} /></label>
            </div>
            <div class="images">
                <ImageInput name="banner" value={s.banner} label="Bannière" />
                <ImageInput name="logo" value={s.logo} label="Logo" />
            </div>
            <div class="foot">
                <label class="check"><input type="checkbox" name="active" checked={s.active} /> Booster proposé aux joueurs</label>
                <button class="btn btn-accent">{s.id ? "Enregistrer" : "Créer la série"}</button>
            </div>
        </form>
        {#if s.id}
            <div class="panel set-packs" style="--c: {s.color}">
                <PackEditor target={s.id} title={s.name} code={s.code} packs={s.packs} color={s.color} />
            </div>
        {/if}
        {#if s.id && s.cards === 0}
            <form method="POST" action="?/delete" use:enhance={keep} class="delete">
                <input type="hidden" name="id" value={s.id} />
                <button class="btn btn-small btn-danger">Supprimer « {s.name} »</button>
            </form>
        {/if}
    {/each}
</main>

<style>
    main {
        width: min(900px, 94%);
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

    .set-packs {
        margin-top: -0.75rem;
        border-left: 4px solid var(--c);
        border-top: none;
        border-radius: 0 0 var(--radius) var(--radius);
    }

    .set.all {
        --c: #cfdfc4;
    }

    .set {
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
        border-left: 4px solid var(--c);
    }

    header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    h2 {
        font-size: 1.3rem;
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

    .small {
        font-size: 0.75rem;
    }

    .fields {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.6rem;
    }

    .fields label {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        font-size: 0.8rem;
    }

    .fields .wide {
        grid-column: span 2;
    }

    .fields :global(input) {
        height: 40px;
        font-size: 16px;
    }

    .fields input[type="color"] {
        padding: 0;
    }

    .images {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem 2rem;
    }

    .foot {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .check {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.9rem;
    }

    .delete {
        margin-top: -0.5rem;
        align-self: flex-end;
    }

    @media (max-width: 700px) {
        .fields {
            grid-template-columns: 1fr 1fr;
        }
    }
</style>
