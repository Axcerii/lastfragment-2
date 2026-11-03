<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import { revealFlux, type FluxResult } from "$lib/flux/quiz";
    import type { Race } from "$lib/flux/races";

    // Fin du test : le flux révélé, le dragon qui l'a béni et ses mots.
    let {
        result,
        race,
        onRetry,
        onMap,
    }: { result: FluxResult; race: Race | null; onRetry: () => void; onMap: () => void } = $props();

    let flux = $derived(revealFlux(result));

    // Shizari a la couleur du fond du site : on l'éclaircit pour qu'il se lise.
    const DRAGON_COLOR: Record<string, string> = { Shizari: "#bdbdbd", Chaos: "#ff3b3b" };
    let tone = $derived(DRAGON_COLOR[flux.dragon] ?? `var(--${flux.dragon})`);
</script>

<article class="result" style="--d: {tone};">
    <blockquote in:fade={{ duration: 1400 }}>
        <p>« {flux.quote} »</p>
        <cite>— {flux.dragon}</cite>
    </blockquote>

    <div class="card" in:fly={{ y: 24, duration: 800, delay: 1200 }}>
        {#if flux.dragon !== "Chaos"}
            <span class="emblem" style="--icon: url('/icones/dragons/{flux.dragon}.svg');" aria-hidden="true"></span>
        {/if}
        <p class="blessing">
            {#if race}{race.name} · {/if}Bénédiction de <strong>{flux.dragon}</strong>
        </p>
        <h2>{flux.name}</h2>
        <p class="description">{flux.description}</p>
        {#if race?.resultNote}
            <p class="note">{race.resultNote}</p>
        {/if}
        {#if flux.names.length}
            <p class="names"><span class="muted">Prénoms possibles :</span> {flux.names.join(", ")}</p>
        {/if}
    </div>

    <div class="actions" in:fade={{ delay: 2000 }}>
        <button class="btn" onclick={onRetry}>Refaire le test</button>
        <button class="btn" onclick={onMap}>Revoir la carte</button>
    </div>
</article>

<style>
    .result {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        width: min(100%, 44rem);
        margin: 0 auto;
        text-align: center;
    }

    blockquote {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        font-family: var(--titleFont);
    }

    blockquote p {
        font-size: clamp(1.5rem, 4vw, 2.2rem);
        font-style: italic;
        line-height: 1.25;
        color: var(--d);
        text-shadow: 0 0 18px color-mix(in srgb, var(--d) 50%, transparent);
    }

    cite {
        font-size: 1rem;
        color: var(--muted);
    }

    .card {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.9rem;
        width: 100%;
        padding: 2rem 1.5rem 1.6rem;
        border: 1px solid var(--d);
        border-radius: var(--radius);
        background: rgba(12, 12, 14, 0.92);
        box-shadow: 0 0 30px color-mix(in srgb, var(--d) 25%, transparent);
        overflow: hidden;
    }

    .emblem {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 16rem;
        height: 16rem;
        transform: translate(-50%, -50%);
        background-color: var(--d);
        mask: var(--icon) center / contain no-repeat;
        opacity: 0.08;
        pointer-events: none;
    }

    .blessing {
        position: relative;
        font-size: 0.9rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
    }

    .blessing strong {
        color: var(--d);
    }

    h2 {
        position: relative;
        font-size: clamp(2rem, 6vw, 3rem);
        color: var(--foreground);
    }

    .description,
    .note,
    .names {
        position: relative;
        line-height: 1.45;
    }

    .description {
        font-family: var(--titleFont);
        font-size: 1.15rem;
    }

    .note {
        font-style: italic;
        color: var(--secondary);
    }

    .names {
        font-size: 0.9rem;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.75rem;
    }
</style>
