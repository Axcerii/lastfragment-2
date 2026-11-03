<script lang="ts">
    import { onMount, tick } from "svelte";
    import { fade } from "svelte/transition";
    import Constellation from "$lib/components/flux/Constellation.svelte";
    import FluxJourney from "$lib/components/flux/FluxJourney.svelte";
    import FluxResult from "$lib/components/flux/FluxResult.svelte";
    import Portals from "$lib/components/flux/Portals.svelte";
    import WorldMap from "$lib/components/flux/WorldMap.svelte";
    import PatternBackground from "$lib/components/layout/PatternBackground.svelte";
    import {
        COUNTRIES,
        DRAGONS,
        MAP_DRAGONS,
        MAP_SYMBOL_SIZE,
        STORAGE_KEY,
        type DiscoveryProgress,
        type DragonName,
    } from "$lib/flux/discovery";
    import { isFluxResult, scoreAnswers } from "$lib/flux/quiz";
    import { raceById, type Race } from "$lib/flux/races";

    // La progression reste dans le navigateur, lue au chargement.
    let progress = $state<DiscoveryProgress>({ constellation: false, found: {} });
    let ready = $state(false);
    let stage = $state<"constellation" | "travel" | "map" | "portals" | "journey" | "result">("constellation");
    let race = $derived(raceById(progress.race));

    // Voile de couleur quand on franchit un portail.
    let veil = $state<string | null>(null);

    // Voyage des dragons de la constellation vers leur symbole sur la carte.
    type Flyer = { name: DragonName; x: number; y: number; size: number; delay: number };
    let flyers = $state<Flyer[]>([]);
    let flying = $state(false);
    let mapShown = $state(false);
    let mapEl = $state<HTMLElement | null>(null);

    let knownCount = $derived(COUNTRIES.filter((c) => c.description || progress.found[c.id]).length);
    let allKnown = $derived(knownCount === COUNTRIES.length);

    onMount(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
            if (saved && typeof saved === "object") {
                const found: Record<string, string> = {};
                for (const c of COUNTRIES)
                    if (typeof saved.found?.[c.id] === "string") found[c.id] = saved.found[c.id];
                progress = {
                    constellation: saved.constellation === true,
                    found,
                    race: raceById(saved.race)?.id,
                    result: isFluxResult(saved.result) ? saved.result : undefined,
                };
            }
        } catch {
            // Stockage indisponible ou abîmé : on repart de zéro.
        }
        if (progress.result) stage = "result";
        else if (progress.constellation) stage = "map";
        mapShown = progress.constellation;
        ready = true;
    });

    function save() {
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

    function goTo(next: typeof stage) {
        stage = next;
        mapShown = next === "map";
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Le portail s'ouvre : un voile de sa couleur couvre l'écran, et le test commence derrière.
    async function enter(chosen: Race) {
        progress.race = chosen.id;
        save();
        veil = chosen.color;
        await wait(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900);
        goTo("journey");
        await wait(300);
        veil = null;
    }

    function finish(answers: number[]) {
        progress.result = scoreAnswers(answers);
        save();
        goTo("result");
    }

    const SUBTITLES: Record<string, string> = {
        constellation: "Les onze dragons attendent. Touche-les dans le bon ordre.",
        portals: "Trois portails. Un seul est le tien.",
        journey: "Suis le fil. Réponds sans trop réfléchir.",
        result: "Ton don de flux.",
    };
</script>

<svelte:head>
    <title>Don de flux : Last Fragment</title>
</svelte:head>

<main>
    <header>
        <h1>Don de flux</h1>
        {#if ready}
            {#key stage}
                <p class="muted" in:fade={{ delay: 300 }}>
                    {SUBTITLES[stage] ?? `Le monde s'ouvre à toi. ${knownCount} terres sur ${COUNTRIES.length} te sont connues.`}
                </p>
            {/key}
        {/if}
    </header>

    {#if stage === "portals" || stage === "journey" || stage === "result"}
        <PatternBackground />
    {/if}

    {#if ready && stage === "portals"}
        <div class="full" in:fade={{ duration: 600 }}>
            <Portals onChoose={enter} />
            <button class="btn btn-small" onclick={() => goTo("map")}>Revenir à la carte</button>
        </div>
    {:else if ready && stage === "journey" && race}
        <div class="full" in:fade={{ duration: 800 }}>
            <FluxJourney color={race.color} onFinish={finish} />
        </div>
    {:else if ready && stage === "result" && progress.result}
        <div class="full" in:fade={{ duration: 800 }}>
            <FluxResult result={progress.result} {race} onRetry={() => goTo("portals")} onMap={() => goTo("map")} />
        </div>
    {:else if ready}
        <div class="stack">
            {#if stage === "constellation"}
                <div class="layer" out:fade={{ duration: 900 }}>
                    <Constellation onComplete={travel} />
                </div>
            {/if}
            {#if stage === "travel" || stage === "map"}
                <div class="layer map-layer" class:shown={mapShown}>
                    <WorldMap found={progress.found} onFound={found} bind:mapEl />
                </div>
            {/if}
        </div>

        {#if stage === "map"}
            <footer in:fade={{ delay: 300 }}>
                {#if allKnown}
                    <p class="ending" in:fade>Toutes les terres te sont connues. Les portails t'attendent.</p>
                    <button class="btn portals-btn" in:fade onclick={() => goTo("portals")}>Franchir les portails</button>
                {/if}
                <button class="btn btn-small" onclick={() => goTo("constellation")}>Revoir la constellation</button>
            </footer>
        {/if}
    {/if}
</main>

{#if veil}
    <div class="veil" style="--c: {veil};" transition:fade={{ duration: 700 }} aria-hidden="true"></div>
{/if}

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

    .full {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        width: 100%;
    }

    .portals-btn {
        border-color: var(--secondary);
        box-shadow: 0 0 14px rgba(210, 182, 116, 0.45);
    }

    .veil {
        position: fixed;
        inset: 0;
        z-index: 60;
        background: radial-gradient(circle, #fff 0%, var(--c) 35%, #060608 100%);
        pointer-events: none;
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
