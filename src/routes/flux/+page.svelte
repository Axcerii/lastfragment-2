<script lang="ts">
    import { onMount, tick, untrack } from "svelte";
    import { fade } from "svelte/transition";
    import Constellation from "$lib/components/flux/Constellation.svelte";
    import WorldMap from "$lib/components/flux/WorldMap.svelte";
    import {
        COUNTRIES,
        DRAGONS,
        MAP_DRAGONS,
        MAP_SYMBOL_SIZE,
        STORAGE_KEY,
        type DiscoveryProgress,
        type DragonName,
    } from "$lib/flux/discovery";

    let { data } = $props();

    // Connecté : la progression vient du compte. Visiteur : du navigateur, lue au chargement.
    // Lue une fois : la page la tient ensuite à jour elle-même.
    const account = untrack(() => data.progress);
    let progress = $state<DiscoveryProgress>(account ?? { constellation: false, found: {} });
    let ready = $state(!!account);
    let stage = $state<"constellation" | "travel" | "map">(account?.constellation ? "map" : "constellation");

    // Voyage des dragons de la constellation vers leur symbole sur la carte.
    type Flyer = { name: DragonName; x: number; y: number; size: number; delay: number };
    let flyers = $state<Flyer[]>([]);
    let flying = $state(false);
    let mapShown = $state(account?.constellation ?? false);
    let mapEl = $state<HTMLElement | null>(null);

    let knownCount = $derived(COUNTRIES.filter((c) => c.description || progress.found[c.id]).length);
    let allKnown = $derived(knownCount === COUNTRIES.length);

    onMount(() => {
        if (account) return;
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
            if (saved && typeof saved === "object") {
                const found: Record<string, string> = {};
                for (const c of COUNTRIES)
                    if (typeof saved.found?.[c.id] === "string") found[c.id] = saved.found[c.id];
                progress = { constellation: saved.constellation === true, found };
            }
        } catch {
            // Stockage indisponible ou abîmé : on repart de zéro.
        }
        if (progress.constellation) {
            stage = "map";
            mapShown = true;
        }
        ready = true;
    });

    function save() {
        if (account) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        } catch {
            // Navigation privée : la progression ne survivra pas au rechargement.
        }
    }

    const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    async function travel(icons: Record<DragonName, DOMRect>) {
        progress.constellation = true;
        save();

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            stage = "map";
            mapShown = true;
            return;
        }

        // Chaque dragon part de son icône, à l'écran, et vole jusqu'à son symbole sur la carte.
        flyers = DRAGONS.map((name, i) => {
            const r = icons[name];
            return { name, x: r.left + r.width / 2, y: r.top + r.height / 2, size: r.width, delay: i * 90 };
        });
        stage = "travel";
        await tick();
        await frame();

        const m = mapEl!.getBoundingClientRect();
        flying = true;
        flyers = flyers.map((f) => ({
            ...f,
            x: m.left + (MAP_DRAGONS[f.name].x / 100) * m.width,
            y: m.top + (MAP_DRAGONS[f.name].y / 100) * m.height,
            size: (MAP_SYMBOL_SIZE / 100) * m.width,
        }));

        await wait(1900 + DRAGONS.length * 90);
        mapShown = true;
        await wait(1200);
        flyers = [];
        flying = false;
        stage = "map";
    }

    function found(id: string, description: string) {
        progress.found[id] = description;
        save();
    }
</script>

<svelte:head>
    <title>Don de flux : Last Fragment</title>
</svelte:head>

<main>
    <header>
        <h1>Don de flux</h1>
        {#if ready}
            {#if stage === "constellation"}
                <p class="muted" in:fade>Les onze dragons attendent. Touche-les dans le bon ordre.</p>
            {:else}
                <p class="muted" in:fade={{ delay: 400 }}>
                    Le monde s'ouvre à toi. {knownCount} terres sur {COUNTRIES.length} te sont connues.
                </p>
            {/if}
        {/if}
    </header>

    {#if ready}
        <div class="stack">
            {#if stage === "constellation"}
                <div class="layer" out:fade={{ duration: 900 }}>
                    <Constellation onComplete={travel} />
                </div>
            {/if}
            {#if stage !== "constellation"}
                <div class="layer map-layer" class:shown={mapShown}>
                    <WorldMap found={progress.found} onFound={found} bind:mapEl />
                </div>
            {/if}
        </div>

        {#if stage === "map"}
            <footer in:fade={{ delay: 300 }}>
                {#if allKnown}
                    <p class="ending" in:fade>
                        Toutes les terres te sont connues. Le test qui révélera ton don de flux arrive bientôt.
                    </p>
                {/if}
                {#if !account}
                    <p class="muted small">
                        Ta progression reste dans ce navigateur. <a href="/auth/login">Connecte-toi</a> pour la garder
                        sur ton compte.
                    </p>
                {/if}
                <button class="btn btn-small" onclick={() => (stage = "constellation")}>Revoir la constellation</button>
            </footer>
        {/if}
    {/if}
</main>

{#each flyers as f (f.name)}
    <span
        class="flyer"
        class:flying
        class:landed={mapShown}
        style="left: {f.x}px; top: {f.y}px; width: {f.size}px; transition-delay: {f.delay}ms; --icon: url('/icones/dragons/{f.name}.svg');"
        aria-hidden="true"
    ></span>
{/each}

<style>
    main {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        width: min(100% - 2rem, 72rem);
        margin: 2rem auto 4rem;
    }

    header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        min-height: 5rem;
        text-align: center;
    }

    h1 {
        font-size: 3rem;
        color: var(--secondary);
    }

    /* Les deux énigmes se superposent pendant le passage de l'une à l'autre. */
    .stack {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        width: 100%;
    }

    .layer {
        grid-area: 1 / 1;
        min-width: 0;
        display: flex;
        justify-content: center;
        align-items: start;
    }

    .map-layer {
        opacity: 0;
        transition: opacity 1.2s ease;
        pointer-events: none;
    }

    .map-layer.shown {
        opacity: 1;
        pointer-events: auto;
    }

    footer {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        text-align: center;
    }

    .ending {
        font-family: var(--titleFont);
        font-size: 1.3rem;
        color: var(--secondary);
    }

    .small {
        font-size: 0.85rem;
    }

    .small a {
        text-decoration: underline;
    }

    .flyer {
        position: fixed;
        z-index: 50;
        aspect-ratio: 1;
        transform: translate(-50%, -50%);
        background-color: var(--secondary);
        mask: var(--icon) center / contain no-repeat;
        pointer-events: none;
    }

    .flyer.flying {
        transition:
            left 1.8s cubic-bezier(0.65, 0, 0.35, 1),
            top 1.8s cubic-bezier(0.65, 0, 0.35, 1),
            width 1.8s cubic-bezier(0.65, 0, 0.35, 1),
            opacity 1s ease;
    }

    .flyer.landed {
        opacity: 0;
        transition-delay: 0s !important;
    }
</style>
