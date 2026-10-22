<script lang="ts">
    // Image montrée par le MJ en plein écran. Chacun peut la fermer chez soi.
    import { onMount } from "svelte";

    let { url }: { url: string | null } = $props();

    // L'image fermée reste fermée si la page est rechargée.
    const STORAGE = "lf-table-showcase-dismissed";
    let dismissed = $state<string | null>(null);
    let visible = $derived(url !== null && dismissed !== url);

    onMount(() => {
        try {
            dismissed = sessionStorage.getItem(STORAGE);
        } catch {
            /* stockage indisponible */
        }
    });

    function close() {
        dismissed = url;
        try {
            if (url) sessionStorage.setItem(STORAGE, url);
        } catch {
            /* rien */
        }
    }
</script>

{#if visible && url}
    <div class="showcase" role="dialog" aria-label="Image montrée par le MJ">
        <img src={url} alt="" />
        <button class="btn" onclick={close}>Fermer</button>
    </div>
{/if}

<style>
    .showcase {
        position: fixed;
        inset: 0;
        z-index: 100;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 1.5rem;
        background-color: rgba(0, 0, 0, 0.88);
        animation: appear 0.4s ease-out;
    }

    img {
        max-width: 100%;
        max-height: calc(100dvh - 6rem);
        object-fit: contain;
        border-radius: var(--radius);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
    }

    @keyframes appear {
        from {
            opacity: 0;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .showcase {
            animation: none;
        }
    }
</style>
