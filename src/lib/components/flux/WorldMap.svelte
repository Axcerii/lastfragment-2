<script lang="ts">
    import { tick } from "svelte";
    import { fade, fly, scale } from "svelte/transition";
    import { MediaQuery } from "svelte/reactivity";
    import { COUNTRIES, MAP_SYMBOL_SIZE, NEUTRAL_MASK, type Country } from "$lib/flux/discovery";

    // Seconde énigme de /flux : la carte du monde. Chaque terre connue en désigne une autre,
    // qu'on révèle en devinant son nom (vérifié par le serveur).
    let {
        found,
        onFound,
        mapEl = $bindable(null),
    }: {
        found: Record<string, string>;
        onFound: (id: string, description: string) => void;
        mapEl?: HTMLElement | null;
    } = $props();

    // La carte remplit l'écran. En portrait, elle garde la hauteur et défile de côté ; sur
    // téléphone, la fiche du pays monte du bas de l'écran.
    const narrow = new MediaQuery("max-width: 760px");

    let selectedId = $state<string | null>(null);
    let guess = $state("");
    let wrong = $state(false);
    let busy = $state(false);
    let justFound = $state<string | null>(null);
    let message = $state("");
    let scroller = $state<HTMLElement | null>(null);
    let input = $state<HTMLInputElement | null>(null);

    let selected = $derived(COUNTRIES.find((c) => c.id === selectedId) ?? null);
    const descriptionOf = (c: Country) => c.description ?? found[c.id] ?? null;

    // Quand la carte déborde (écran en portrait), on part de son milieu, recentré si l'écran tourne.
    $effect(() => {
        if (!scroller) return;
        const el = scroller;
        let lastWidth = 0;
        const center = () => {
            if (el.scrollWidth === lastWidth) return;
            lastWidth = el.scrollWidth;
            el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
            el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
        };
        center();
        const observer = new ResizeObserver(center);
        observer.observe(el);
        return () => observer.disconnect();
    });

    async function select(country: Country) {
        selectedId = selectedId === country.id ? null : country.id;
        guess = "";
        wrong = false;
        message = "";
        if (selectedId && !narrow.current && !descriptionOf(country)) {
            await tick();
            input?.focus();
        }
    }

    async function submit(event: SubmitEvent) {
        event.preventDefault();
        if (!selected || busy || !guess.trim()) return;
        busy = true;
        message = "";
        try {
            const res = await fetch("/flux/essai", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ type: "country", id: selected.id, guess: guess.trim() }),
            });
            if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "");
            const result: { found: boolean; description?: string } = await res.json();
            if (result.found && result.description) {
                justFound = selected.id;
                onFound(selected.id, result.description);
                guess = "";
                setTimeout(() => (justFound = null), 1600);
            } else {
                wrong = true;
                setTimeout(() => (wrong = false), 800);
            }
        } catch (e) {
            message = (e as Error).message || "La carte reste muette. Réessaie.";
        } finally {
            busy = false;
        }
    }

    // Fiche ancrée au point : elle s'ouvre du côté où il reste de la place.
    function anchor(c: Country) {
        const h = c.x > 65 ? "right" : c.x < 35 ? "left" : "center";
        const v = c.y > 55 ? "above" : "below";
        return `${h} ${v}`;
    }
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && (selectedId = null)} />

{#snippet sheet(country: Country)}
    {@const description = descriptionOf(country)}
    {#if description}
        <h3>
            {#if country.icon}
                <span class="sheet-icon" style="--icon: url('/icones/pays/{country.icon}.svg');"></span>
            {/if}
            {country.name}
        </h3>
        {#if justFound === country.id}
            <p class="revealed" in:scale={{ start: 0.8, duration: 400 }}>Terre révélée</p>
        {/if}
        <p class="description" in:fade={{ duration: 600 }}>{description}</p>
    {:else}
        <h3><span class="sheet-icon unknown" style="--icon: url('/icones/pays/Inconnu.svg');"></span> Terre inconnue</h3>
        {#if country.riddle}
            <p class="description">{country.riddle}</p>
        {/if}
        <p class="muted small">Le nom de cette fleur, ou celui de la terre, lève le voile.</p>
        <form onsubmit={submit} class:wrong>
            <input bind:this={input} bind:value={guess} maxlength="64" placeholder="Son nom…" autocomplete="off" aria-label="Nom de la terre" />
            <button class="btn" disabled={busy || !guess.trim()}>Révéler</button>
        </form>
        {#if wrong}
            <p class="message-error" transition:fade={{ duration: 200 }}>Ce nom ne lui dit rien.</p>
        {/if}
        {#if message}
            <p class="message-error" role="alert">{message}</p>
        {/if}
    {/if}
{/snippet}

<div class="world">
    <div class="scroller" bind:this={scroller}>
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="map" bind:this={mapEl} onclick={(e) => e.target === e.currentTarget && (selectedId = null)}>
            <!-- Territoire neutre de Vulcain : le motif des pages personnages, découpé à sa forme. -->
            <div class="neutral" style="--mask: url('{NEUTRAL_MASK}');" aria-hidden="true"></div>
            <img src="/flux/carte.webp" alt="Carte du monde d'Aeteria" draggable="false" />

            {#each COUNTRIES as country (country.id)}
                {@const known = !!descriptionOf(country)}
                <button
                    class="marker"
                    class:known
                    class:neutral-marker={known && !country.icon}
                    class:selected={selectedId === country.id}
                    class:burst={justFound === country.id}
                    style="left: {country.x}%; top: {country.y}%; --size: {MAP_SYMBOL_SIZE}%;"
                    aria-label={known ? country.name : "Terre inconnue"}
                    aria-expanded={selectedId === country.id}
                    onclick={() => select(country)}
                >
                    {#if known}
                        {#if country.icon}
                            <span class="marker-icon" in:scale={{ start: 0.4, duration: 700 }} style="--icon: url('/icones/pays/{country.icon}.svg');"></span>
                        {/if}
                        <span class="label" in:fade={{ duration: 800 }}>{country.name}</span>
                    {/if}
                </button>
            {/each}

            {#if selected && !narrow.current}
                <div
                    class="popup {anchor(selected)}"
                    style="left: {selected.x}%; top: {selected.y}%;"
                    transition:fade={{ duration: 180 }}
                >
                    {@render sheet(selected)}
                </div>
            {/if}
        </div>
    </div>

    {#if selected && narrow.current}
        <div class="panel-below" transition:fly={{ y: 40, duration: 220 }}>
            <button class="close" aria-label="Fermer" onclick={() => (selectedId = null)}>×</button>
            {@render sheet(selected)}
        </div>
    {/if}
</div>

<style>
    /* Toute la place du parent (l'écran) : la carte y tient en entier, centrée. */
    .world {
        position: absolute;
        inset: 0;
    }

    .scroller {
        width: 100%;
        height: 100%;
        display: flex;
        overflow: auto;
        overscroll-behavior: contain;
        scrollbar-width: thin;
        scrollbar-color: rgba(210, 182, 116, 0.35) transparent;
        background: radial-gradient(ellipse at center, rgba(210, 182, 116, 0.1), rgba(0, 0, 0, 0.45) 75%);
    }

    .map {
        position: relative;
        flex-shrink: 0;
        /* margin auto : centrée quand elle tient, défilable sans être rognée quand elle déborde. */
        margin: auto;
        width: min(100vw, 100svh * 16 / 9);
        aspect-ratio: 16 / 9;
        user-select: none;
    }

    /* Portrait : la carte garde de la hauteur et défile de côté (deux à trois écrans). */
    @media (max-aspect-ratio: 1 / 1) {
        .map {
            width: auto;
            height: min(100svh, 145vw);
        }
    }

    .neutral {
        position: absolute;
        inset: 0;
        background: url("/personnages/backgroundpattern.png") center / 32% repeat;
        mask: var(--mask) center / 100% 100% no-repeat;
        /* Le motif d'origine est presque noir : éclairci pour se lire sur la carte. */
        filter: brightness(2.2) sepia(0.35);
        opacity: 0.75;
        pointer-events: none;
    }

    img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        /* Traits noirs d'origine, passés en doré. */
        filter: invert(76%) sepia(57%) saturate(281%) hue-rotate(2deg) brightness(88%) contrast(87%);
        opacity: 0.85;
    }

    .marker {
        position: absolute;
        width: clamp(1.6rem, 3.2%, 2.6rem);
        aspect-ratio: 1;
        transform: translate(-50%, -50%);
        display: grid;
        place-items: center;
        padding: 0;
        border: 1px solid rgba(210, 182, 116, 0.6);
        border-radius: 50%;
        background: rgba(27, 27, 27, 0.9);
        transition:
            transform 0.25s ease,
            box-shadow 0.3s ease,
            border-color 0.3s ease;
    }

    .marker::after {
        content: "";
        position: absolute;
        inset: -1px;
        border-radius: 50%;
        border: 1px solid var(--secondary);
        animation: ping 2.4s ease-out infinite;
        pointer-events: none;
    }

    .marker:hover,
    .marker.selected {
        transform: translate(-50%, -50%) scale(1.15);
        box-shadow: 0 0 16px rgba(210, 182, 116, 0.55);
    }

    /* Terre inconnue : un simple point doré, pour ne pas la confondre avec les symboles des dragons. */
    .marker:not(.known) {
        width: clamp(1.1rem, 2%, 1.6rem);
        border-style: dashed;
    }

    .marker:not(.known)::before {
        content: "";
        width: 40%;
        height: 40%;
        border-radius: 50%;
        background-color: var(--secondary);
        box-shadow: 0 0 10px var(--secondary);
    }

    .marker-icon {
        width: 70%;
        height: 70%;
        background-color: var(--primary);
        mask: var(--icon) center / contain no-repeat;
    }

    /* Terre connue : son symbole, cerclé et à la taille de ceux des dragons imprimés sur la carte. */
    .marker.known {
        width: max(var(--size), 1.6rem);
        border-color: var(--primary);
    }

    /* Territoire sans nation : seulement son nom. */
    .marker.neutral-marker {
        width: 1.6rem;
        border: none;
        background: none;
    }

    .marker.neutral-marker .label {
        top: 50%;
        transform: translate(-50%, -50%);
        font-style: italic;
        color: rgba(255, 255, 255, 0.75);
    }

    .marker.known::after {
        display: none;
    }

    .marker.burst {
        animation: burst 1.2s ease-out;
    }

    .label {
        position: absolute;
        top: calc(100% + 0.2rem);
        left: 50%;
        transform: translateX(-50%);
        font-family: var(--titleFont);
        font-size: 0.8rem;
        color: var(--primary);
        white-space: nowrap;
        text-shadow: 0 0 6px var(--background), 0 0 6px var(--background);
        pointer-events: none;
    }

    .popup,
    .panel-below {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1.1rem 1.25rem;
        border: 1px solid var(--secondary);
        border-radius: var(--radius);
        background: rgba(15, 15, 15, 0.96);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
    }

    /* Téléphone : la fiche monte du bas de l'écran, par-dessus la carte et ses boutons. */
    .panel-below {
        position: fixed;
        left: 0.75rem;
        right: 0.75rem;
        bottom: max(0.75rem, env(safe-area-inset-bottom));
        z-index: 10;
        max-height: 60svh;
        overflow-y: auto;
        padding-right: 2.75rem;
    }

    .close {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 2rem;
        height: 2rem;
        padding: 0;
        font-size: 1.4rem;
        line-height: 1;
        color: var(--muted);
        background: none;
        border: none;
    }

    .popup {
        position: absolute;
        z-index: 5;
        width: 18rem;
        --dx: -50%;
        --dy: 1.6rem;
        transform: translate(var(--dx), var(--dy));
    }

    .popup.left {
        --dx: -1.2rem;
    }

    .popup.right {
        --dx: calc(-100% + 1.2rem);
    }

    .popup.above {
        --dy: calc(-100% - 1.6rem);
    }

    h3 {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 1.4rem;
        color: var(--primary);
    }

    .sheet-icon {
        width: 1.6rem;
        height: 1.6rem;
        flex-shrink: 0;
        background-color: var(--primary);
        mask: var(--icon) center / contain no-repeat;
    }

    .sheet-icon.unknown {
        background-color: var(--secondary);
    }

    .revealed {
        font-family: var(--titleFont);
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--secondary);
        text-shadow: 0 0 10px rgba(210, 182, 116, 0.6);
    }

    .small {
        font-size: 0.8rem;
    }

    .description {
        font-family: var(--titleFont);
        font-size: 1.05rem;
        line-height: 1.45;
        color: rgba(255, 255, 255, 0.85);
    }

    form {
        display: flex;
        gap: 0.5rem;
    }

    form input {
        height: 40px;
        font-size: 18px;
    }

    form.wrong input {
        border-color: var(--danger);
        animation: shake 0.4s ease-in-out;
    }

    @keyframes ping {
        0% {
            transform: scale(1);
            opacity: 0.6;
        }
        100% {
            transform: scale(1.9);
            opacity: 0;
        }
    }

    @keyframes burst {
        0% {
            box-shadow: 0 0 0 0 rgba(207, 223, 196, 0.8);
        }
        100% {
            box-shadow: 0 0 0 2.5rem rgba(207, 223, 196, 0);
        }
    }

    @keyframes shake {
        25%,
        75% {
            transform: translateX(-4px);
        }
        50% {
            transform: translateX(4px);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .marker::after,
        .marker.burst,
        form.wrong input {
            animation: none;
        }
    }
</style>
