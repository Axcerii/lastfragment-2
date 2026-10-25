<script lang="ts">
    // Boosters : la réserve du joueur (un booster toutes les X heures, cumulables), puis la vitrine
    // des boosters (« All » et les bannières de séries ouvertes), chacun montré sous l'un de ses
    // paquets tiré au hasard. Un toucher ouvre sa fiche, d'où on l'ouvre ; l'ouverture se joue en
    // plein écran. Un booster ouvert mais pas regardé jusqu'au bout (page quittée,
    // réseau coupé) est reproposé en haut de la page : ses cartes sont déjà dans la collection.
    import { enhance } from "$app/forms";
    import { invalidateAll } from "$app/navigation";
    import BoosterOpening from "$lib/components/cards/BoosterOpening.svelte";
    import BoosterSheet from "$lib/components/cards/BoosterSheet.svelte";
    import Countdown from "$lib/components/cards/Countdown.svelte";
    import DleCountdown from "$lib/components/game/DleCountdown.svelte";
    import PackModel from "$lib/components/cards/opening/PackModel.svelte";
    import type { OwnedCard, PackView } from "$lib/cards/types";

    let { data } = $props();

    type Booster = { setId: number | null; title: string; code: string; packs: PackView[] };
    type Opening = {
        booster: Booster;
        openingId: number | null;
        cards: OwnedCard[] | null;
        fresh: number[];
        error: string | null;
        remaining: number;
    };

    type Shown = Booster & {
        pack: PackView;
        description: string | null;
        total: number;
        endsAt: string | null;
        progress: { owned: number; total: number } | null;
        disabled: boolean;
    };

    let opening = $state<Opening | null>(null);
    let detail = $state<Shown | null>(null);

    // La vitrine : les séries de la plus récente à la plus ancienne, « All » en dernier. Le paquet
    // montré a été tiré par le serveur.
    let showcase = $derived.by((): Shown[] => {
        if (data.guest) return [];
        const list: Shown[] = [];
        const { all, banners } = data.choices;
        for (const b of [...banners].sort((x, y) => y.id - x.id)) {
            list.push({
                setId: b.id,
                title: b.name,
                code: b.code,
                packs: b.packs,
                pack: b.packs[data.featured.banners[b.id] ?? 0] ?? b.packs[0],
                description: b.description,
                total: b.total,
                endsAt: b.endsAt,
                progress: data.progress[b.id] ?? null,
                disabled: b.pool === 0,
            });
        }
        if (all.pool > 0) {
            const mine = Object.values(data.progress).reduce(
                (sum, p) => ({ owned: sum.owned + p.owned, total: sum.total + p.total }),
                { owned: 0, total: 0 },
            );
            list.push({
                setId: null,
                title: "Booster All",
                code: "ALL",
                packs: all.packs,
                pack: all.packs[data.featured.all] ?? all.packs[0],
                description: "Un peu de tout : chaque carte publiée peut tomber, toutes séries confondues.",
                total: all.pool,
                endsAt: null,
                progress: mine.total ? mine : null,
                disabled: false,
            });
        }
        return list;
    });
    let openForm: HTMLFormElement | undefined = $state();
    let seenForm: HTMLFormElement | undefined = $state();
    let formSetId = $state("");
    let formPackId = $state("");
    let seenId = $state("");

    function open(booster: Booster) {
        if (data.guest || data.wallet.stock < 1 || opening) return;
        detail = null;
        opening = { booster, openingId: null, cards: null, fresh: [], error: null, remaining: data.wallet.stock - 1 };
    }

    /** Paquet choisi : le tirage part pendant que le joueur découpe le paquet. */
    function start(pack: PackView) {
        if (!opening) return;
        formSetId = opening.booster.setId === null ? "" : String(opening.booster.setId);
        formPackId = pack.id === null ? "" : String(pack.id);
        queueMicrotask(() => openForm?.requestSubmit());
    }

    /** Rejoue un booster ouvert mais pas regardé jusqu'au bout. */
    function replay(unseen: {
        openingId: number;
        setId: number | null;
        title: string;
        code: string;
        pack: PackView;
        cards: OwnedCard[];
        fresh: number[];
    }) {
        if (data.guest || opening) return;
        // « Ouvrir un autre » à la fin reprend la même série, avec tous ses paquets.
        const packs =
            unseen.setId === null
                ? data.choices.all.packs
                : (data.choices.banners.find((b) => b.id === unseen.setId)?.packs ?? [unseen.pack]);
        opening = {
            booster: { setId: unseen.setId, title: unseen.title, code: unseen.code, packs: [unseen.pack, ...packs.filter((p) => p.id !== unseen.pack.id)] },
            openingId: unseen.openingId,
            cards: unseen.cards,
            fresh: unseen.fresh,
            error: null,
            remaining: data.wallet.stock,
        };
    }

    function seen() {
        if (!opening?.openingId) return;
        seenId = String(opening.openingId);
        queueMicrotask(() => seenForm?.requestSubmit());
    }

    async function close() {
        opening = null;
        await invalidateAll();
    }

    async function again() {
        const booster = opening?.booster;
        opening = null;
        await invalidateAll();
        if (booster) open(booster);
    }

    // Secondes avant le prochain booster ; à zéro, la page se recharge pour le compter.
    let now = $state(Date.now());
    let left = $derived(
        !data.guest && data.wallet.nextAt ? Math.max(0, Math.ceil((Date.parse(data.wallet.nextAt) - now) / 1000)) : 0,
    );
    let refreshed: string | null = null;
    $effect(() => {
        const timer = setInterval(() => {
            now = Date.now();
            const next = data.guest ? null : data.wallet.nextAt;
            if (next && next !== refreshed && Date.parse(next) <= now) {
                refreshed = next;
                invalidateAll();
            }
        }, 1000);
        return () => clearInterval(timer);
    });
</script>

<svelte:head>
    <title>Cartes : Last Fragment</title>
</svelte:head>

<main>
    {#if data.guest}
        <section class="pitch">
            <h1>Cartes à collectionner</h1>
            <p>
                Personnages, monstres, armes et lieux de Last Fragment en cartes holographiques. Un booster
                gratuit t’attend régulièrement : ouvre-le, complète tes séries, échange tes doubles.
            </p>
            <a class="btn btn-accent" href="/auth/login">Se connecter pour jouer</a>
        </section>
    {:else}
        {#if data.unseen.length}
            {@const next = data.unseen[0]}
            <section class="unseen panel" aria-label="Booster pas encore découvert">
                <span class="unseen-pack">
                    <PackModel pack={next.pack} title={next.title} code={next.code} width="3.6rem" angle={-18} />
                </span>
                <span class="text">
                    <strong>Un booster t’attend</strong>
                    <span class="muted">
                        Tu as quitté l’ouverture de « {next.title} » avant la fin. Tes cartes sont déjà dans ta
                        collection : rejoue l’ouverture pour les découvrir.
                        {#if data.unseen.length > 1}({data.unseen.length - 1} autre{data.unseen.length > 2 ? "s" : ""} ensuite){/if}
                    </span>
                </span>
                <button type="button" class="btn btn-accent" onclick={() => replay(next)}>Découvrir</button>
            </section>
        {/if}

        <section class="reserve panel" aria-label="Réserve de boosters">
            <div class="crystals" aria-hidden="true">
                {#each Array.from({ length: Math.max(data.wallet.max, data.wallet.stock) }) as _, i (i)}
                    <span class="gem" class:full={i < data.wallet.stock}></span>
                {/each}
            </div>
            <div class="text">
                <strong>{data.wallet.stock} booster{data.wallet.stock > 1 ? "s" : ""} en réserve</strong>
                {#if !data.dleSolved}
                    <a class="dle" href="/outils/lastdle">+1 booster avec le Lastdle du jour</a>
                {/if}
            </div>
            {#if data.wallet.nextAt && left > 0}
                <span class="next">
                    <span class="muted small">Prochain booster</span>
                    <DleCountdown seconds={left} label="Prochain booster dans" />
                </span>
            {/if}
        </section>

        <section class="packs" aria-label="Boosters">
            <h2>Boosters</h2>
            {#if showcase.length}
                <div class="shelf">
                    {#each showcase as booster, i (booster.setId ?? "all")}
                        <button
                            type="button"
                            class="pack"
                            class:off={booster.disabled}
                            style="--c: {booster.pack.color}"
                            onclick={() => (detail = booster)}
                            aria-label="{booster.title} : voir le booster"
                        >
                            <span class="model">
                                <PackModel pack={booster.pack} title={booster.title} code={booster.code} width="min(8.5rem, 34vw)" delay={i * -1.3} />
                            </span>
                            <span class="name">{booster.title}</span>
                            <span class="muted small">
                                {#if booster.endsAt}
                                    Encore <Countdown until={booster.endsAt} ondone={invalidateAll} />
                                {:else}
                                    {booster.code}
                                {/if}
                            </span>
                            {#if booster.progress}
                                <span class="mini-meter" aria-hidden="true">
                                    <span style="width: {Math.min(100, (booster.progress.owned / booster.progress.total) * 100)}%"></span>
                                </span>
                            {/if}
                        </button>
                    {/each}
                </div>
            {:else}
                <p class="muted">Aucun booster n’est encore disponible : le MJ prépare les cartes.</p>
            {/if}
        </section>

        <form
            bind:this={openForm}
            method="POST"
            action="?/open"
            hidden
            use:enhance={() => async ({ result }) => {
                if (!opening) return;
                if (result.type === "success" && result.data?.opened) {
                    const opened = result.data.opened as {
                        openingId: number;
                        cards: OwnedCard[];
                        fresh: number[];
                        wallet: { stock: number };
                    };
                    opening.openingId = opened.openingId;
                    opening.cards = opened.cards;
                    opening.fresh = opened.fresh;
                    opening.remaining = opened.wallet.stock;
                } else if (result.type === "failure") {
                    opening.error = String(result.data?.error ?? "Ouverture impossible.");
                } else {
                    opening.error = "Ouverture impossible, réessaie dans un instant.";
                }
            }}
        >
            <input type="hidden" name="setId" value={formSetId} />
            <input type="hidden" name="packId" value={formPackId} />
        </form>
        <form bind:this={seenForm} method="POST" action="?/seen" hidden use:enhance={() => async () => {}}>
            <input type="hidden" name="openingId" value={seenId} />
        </form>
    {/if}
</main>

{#if detail && !data.guest}
    {@const d = detail}
    <BoosterSheet
        title={d.title}
        code={d.code}
        pack={d.pack}
        variants={d.packs.length}
        description={d.description}
        total={d.total}
        endsAt={d.endsAt}
        progress={d.progress}
        stock={data.wallet.stock}
        nextAt={data.wallet.nextAt}
        disabled={d.disabled}
        onopen={() => open({ setId: d.setId, title: d.title, code: d.code, packs: [d.pack, ...d.packs.filter((p) => p.id !== d.pack.id)] })}
        onclose={() => (detail = null)}
    />
{/if}

{#if opening}
    <BoosterOpening
        title={opening.booster.title}
        code={opening.booster.code}
        packs={opening.booster.packs}
        cards={opening.cards}
        fresh={opening.fresh}
        error={opening.error}
        remaining={opening.remaining}
        count={data.guest ? 5 : data.count}
        onstart={start}
        onseen={seen}
        onclose={close}
        onagain={again}
    />
{/if}

<style>
    main {
        width: min(960px, 94%);
        margin: 0 auto;
        padding: 1.5rem 0 3rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .pitch {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        padding: 3rem 0;
    }

    h1 {
        font-size: 2.4rem;
    }

    h2 {
        font-size: 1.3rem;
        margin-bottom: 0.75rem;
    }

    .reserve {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.75rem 1.25rem;
    }

    .next {
        margin-left: auto;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.2rem;
    }

    /* Un cristal par booster : pleins ceux en réserve, éteints les places libres. */
    .crystals {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        max-width: 100%;
    }

    .gem {
        width: 1.4rem;
        height: 2.2rem;
        clip-path: polygon(50% 0, 100% 17%, 100% 83%, 50% 100%, 0 83%, 0 17%);
        background: rgba(255, 255, 255, 0.12);
    }

    .gem.full {
        background: linear-gradient(160deg, #fff, var(--Pura) 45%, color-mix(in srgb, var(--Pura) 40%, #000));
        filter: drop-shadow(0 0 6px var(--Pura));
        animation: glint 2.6s ease-in-out infinite;
    }

    @keyframes glint {
        50% {
            filter: brightness(1.3) drop-shadow(0 0 8px var(--Pura));
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .gem.full {
            animation: none;
        }
    }

    .text {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }

    .text strong {
        font-size: 1.15rem;
    }

    .dle {
        align-self: flex-start;
        margin-top: 0.35rem;
        padding: 0.15rem 0.7rem;
        border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
        border-radius: 999px;
        color: var(--accent);
        font-size: 0.8rem;
        transition: var(--transition);
    }

    .dle:hover {
        background: color-mix(in srgb, var(--accent) 15%, transparent);
    }

    .small {
        font-size: 0.75rem;
    }

    .packs h2 {
        font-family: var(--titleFont);
        font-size: 1.6rem;
        text-align: center;
    }

    /* Vitrine : les paquets debout, qui pivotent doucement chacun à son rythme. */
    /* Les boosters disponibles, centrés quel que soit leur nombre. */
    .shelf {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1.5rem 1rem;
    }

    .shelf .pack {
        width: 12rem;
    }

    .pack {
        --c: var(--primary);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        padding: 1.2rem 0.5rem 0.9rem;
        border: 1px solid transparent;
        border-radius: calc(var(--radius) * 2);
        background: radial-gradient(ellipse at 50% 35%, color-mix(in srgb, var(--c) 20%, transparent), transparent 65%);
        color: var(--foreground);
        text-align: center;
        transition:
            border-color 0.3s ease,
            background-color 0.3s ease,
            transform 0.3s ease;
    }

    .pack:hover,
    .pack:focus-visible {
        border-color: color-mix(in srgb, var(--c) 50%, transparent);
        background-color: var(--surface);
        transform: translateY(-4px);
    }

    .pack:active {
        transform: scale(0.97);
    }

    .pack.off {
        opacity: 0.55;
    }

    .model {
        padding-bottom: 0.9rem;
    }

    .name {
        font-family: var(--titleFont);
        font-size: 1.25rem;
        line-height: 1.1;
    }

    .mini-meter {
        width: 60%;
        height: 4px;
        margin-top: 0.3rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.1);
        overflow: hidden;
    }

    .mini-meter span {
        display: block;
        height: 100%;
        background: var(--Pura);
    }

    .unseen {
        display: flex;
        align-items: center;
        gap: 1rem;
        border-color: var(--accent);
        background:
            radial-gradient(circle at 0% 50%, rgba(229, 184, 204, 0.18), transparent 60%),
            var(--surface);
    }

    .unseen-pack {
        flex-shrink: 0;
        padding: 0 0.5rem;
    }

    .unseen .text {
        flex: 1;
        min-width: 0;
    }

    .unseen .muted {
        font-size: 0.85rem;
    }

    @media (max-width: 600px) {
        .shelf {
            gap: 1rem 0.5rem;
        }

        .shelf .pack {
            width: calc(50% - 0.25rem);
        }

        .crystals {
            width: 100%;
            justify-content: center;
        }

        .next {
            margin-left: 0;
            align-items: flex-start;
        }

        .unseen {
            flex-wrap: wrap;
        }

        .unseen .btn {
            width: 100%;
        }
    }
</style>
