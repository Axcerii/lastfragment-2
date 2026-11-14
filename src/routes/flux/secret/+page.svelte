<script lang="ts">
    import { fade } from "svelte/transition";
    import PatternBackground from "$lib/components/layout/PatternBackground.svelte";

    // Page secrète du don de flux. Le serveur ne la sert qu'à qui a suivi le chemin jusqu'au bout
    // (voir $lib/server/flux/secret) ; son texte vient de lui.
    let { data } = $props();
</script>

<svelte:head>
    <title>{data.page.title} : Last Fragment</title>
</svelte:head>

<PatternBackground />

<main>
    <div class="glow" aria-hidden="true"></div>
    <article in:fade={{ duration: 1600 }}>
        <h1>{data.page.title}</h1>
        {#each data.page.paragraphs as paragraph, i (i)}
            <p in:fade={{ duration: 1200, delay: 900 + i * 700 }}>{paragraph}</p>
        {/each}
    </article>
    <a class="btn btn-small" href="/flux">Revenir au don de flux</a>
</main>

<style>
    main {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2.5rem;
        min-height: 100svh;
        padding: 2rem 1rem;
        box-sizing: border-box;
        overflow: clip;
        text-align: center;
    }

    .glow {
        position: absolute;
        inset: 0;
        z-index: -1;
        background: radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.16), transparent 55%);
        animation: breathe 5s ease-in-out infinite alternate;
        pointer-events: none;
    }

    article {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        max-width: 38rem;
    }

    h1 {
        font-size: clamp(2rem, 6vw, 3.2rem);
        color: var(--secondary);
        text-shadow: 0 0 24px rgba(210, 182, 116, 0.5);
    }

    p {
        font-family: var(--titleFont);
        font-size: 1.2rem;
        line-height: 1.5;
    }

    @keyframes breathe {
        to {
            opacity: 0.5;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .glow {
            animation: none;
        }
    }
</style>
