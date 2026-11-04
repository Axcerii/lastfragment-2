<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import PatternBackground from "$lib/components/layout/PatternBackground.svelte";
    import { SECRET_PAGE, SECRET_UNLOCKED_KEY } from "$lib/flux/secret";

    // Page secrète du don de flux : on n'y entre qu'en ayant suivi le chemin (voir secret.ts).
    // Sans la marque laissée à la fin du chemin, elle se fait passer pour une page vide.
    let unlocked = $state<boolean | null>(null);

    onMount(() => {
        try {
            unlocked = localStorage.getItem(SECRET_UNLOCKED_KEY) === "1";
        } catch {
            unlocked = false;
        }
    });
</script>

<svelte:head>
    <title>{unlocked ? SECRET_PAGE.title : "Don de flux"} : Last Fragment</title>
</svelte:head>

<PatternBackground />

<main>
    {#if unlocked}
        <div class="glow" aria-hidden="true"></div>
        <article in:fade={{ duration: 1600 }}>
            <h1>{SECRET_PAGE.title}</h1>
            {#each SECRET_PAGE.paragraphs as paragraph, i (i)}
                <p in:fade={{ duration: 1200, delay: 900 + i * 700 }}>{paragraph}</p>
            {/each}
        </article>
    {:else if unlocked === false}
        <p class="muted" in:fade>Il n'y a rien ici.</p>
    {/if}
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
