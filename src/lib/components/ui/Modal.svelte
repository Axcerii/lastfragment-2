<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        open = $bindable(false),
        title,
        side = false,
        id,
        children,
    }: {
        open?: boolean;
        title: string;
        /** Panneau qui glisse depuis la droite, pleine hauteur, au lieu d'une fenêtre centrée. */
        side?: boolean;
        id?: string;
        children: Snippet;
    } = $props();

    let dialog: HTMLDialogElement | undefined = $state();

    $effect(() => {
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
    bind:this={dialog}
    {id}
    class:side
    onclose={() => (open = false)}
    onclick={(e) => {
        // Un clic sur le fond (le dialog lui-même, hors de son contenu) ferme la fenêtre.
        if (e.target === dialog) open = false;
    }}
>
    <div class="content">
        <header>
            <h2>{title}</h2>
            <button class="btn btn-small" onclick={() => (open = false)} aria-label="Fermer">
                ✕
            </button>
        </header>
        {@render children()}
    </div>
</dialog>

<style>
    dialog {
        padding: 0;
        border: 1px solid var(--primary);
        border-radius: var(--radius);
        background-color: var(--surface);
        color: var(--foreground);
        width: min(40rem, 92vw);
        max-height: 85dvh;
    }

    dialog.side {
        margin: 0 0 0 auto;
        width: min(36rem, 100vw);
        height: 100dvh;
        max-height: 100dvh;
        border-width: 0 0 0 1px;
        border-radius: 0;
    }

    dialog.side[open] {
        animation: slide-in 250ms ease-out;
    }

    @keyframes slide-in {
        from {
            transform: translateX(100%);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        dialog.side[open] {
            animation: none;
        }
    }

    dialog::backdrop {
        background-color: rgba(0, 0, 0, 0.7);
    }

    .content {
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }

    h2 {
        font-size: 1.5rem;
    }
</style>
