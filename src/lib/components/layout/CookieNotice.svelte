<script lang="ts">
    import { onMount } from "svelte";

    // Petit bandeau d'information : le site ne pose aucun cookie de traçage, donc rien à accepter
    // ni à refuser. Une fois fermé, il ne revient plus sur ce navigateur.
    const STORAGE = "lf-cookies-vu";

    let open = $state(false);

    onMount(() => {
        try {
            open = localStorage.getItem(STORAGE) === null;
        } catch {
            open = true; // Stockage bloqué : le bandeau reviendra à chaque visite, sans gêner le reste.
        }
    });

    function close() {
        open = false;
        try {
            localStorage.setItem(STORAGE, "1");
        } catch {
            // Rien à faire : il reste fermé pour cette page.
        }
    }
</script>

{#if open}
    <aside aria-label="Information sur les cookies">
        <p>
            Aucun cookie de traçage ni de publicité, seulement ceux utiles au site.
            <a href="/cgu#cookies">En savoir plus</a>
        </p>
        <button type="button" onclick={close} aria-label="Fermer l'information sur les cookies">OK</button>
    </aside>
{/if}

<style>
    aside {
        position: fixed;
        left: 1rem;
        bottom: calc(1rem + env(safe-area-inset-bottom));
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        max-width: 26rem;
        padding: 0.6rem 0.75rem 0.6rem 1rem;
        background-color: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
        font-size: 0.85rem;
        line-height: 1.4;
        animation: rise 0.35s ease-out both;
    }

    a {
        color: var(--accent);
        text-decoration: underline;
        white-space: nowrap;
    }

    button {
        flex-shrink: 0;
        padding: 0.35rem 0.7rem;
        background-color: var(--primary);
        color: var(--background);
        border: none;
        border-radius: var(--radius);
        font: inherit;
        font-weight: 600;
        cursor: pointer;
        transition: var(--transition);
    }

    button:hover,
    button:focus-visible {
        background-color: var(--accent);
    }

    @keyframes rise {
        from {
            opacity: 0;
            transform: translateY(0.75rem);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        aside {
            animation: none;
        }
    }

    @media only screen and (max-width: 600px) {
        aside {
            right: 1rem;
            max-width: none;
            font-size: 0.8rem;
            line-height: 1.3;
        }
    }
</style>
