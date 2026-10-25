<script lang="ts">
    // Fiche d'un booster, ouverte depuis la vitrine : le paquet en grand (il s'incline vers le doigt),
    // son nom, sa description, l'avancement de l'album et le bouton pour l'ouvrir.
    // En bas de l'écran sur téléphone, au centre sur ordinateur.
    import { onDestroy } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import type { PackView } from "$lib/cards/types";
    import Countdown from "./Countdown.svelte";
    import PackModel from "./opening/PackModel.svelte";

    let {
        title,
        code,
        pack,
        variants,
        description = null,
        total,
        endsAt = null,
        progress = null,
        stock,
        nextAt = null,
        disabled = false,
        onopen,
        onclose,
    }: {
        title: string;
        code: string;
        pack: PackView;
        /** Nombre de paquets dessinés pour ce booster. */
        variants: number;
        description?: string | null;
        /** Cartes possibles. */
        total: number;
        endsAt?: string | null;
        progress?: { owned: number; total: number } | null;
        stock: number;
        nextAt?: string | null;
        disabled?: boolean;
        onopen: () => void;
        onclose: () => void;
    } = $props();

    let percent = $derived(progress?.total ? Math.floor((progress.owned / progress.total) * 100) : 0);

    let overflow = "";
    if (typeof document !== "undefined") {
        overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
    }
    onDestroy(() => {
        if (typeof document !== "undefined") document.body.style.overflow = overflow;
    });
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && onclose()} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={onclose} transition:fade={{ duration: 200 }}></div>
<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="booster-title" style="--c: {pack.color}" transition:fly={{ y: 60, duration: 320, easing: cubicOut }}>
    <button type="button" class="close" onclick={onclose} aria-label="Fermer">×</button>
    <div class="pack">
        <PackModel {pack} {title} {code} width="min(11rem, 42vw)" follow idle />
    </div>
    <div class="info">
        <span class="code">{code}</span>
        <h2 id="booster-title">{title}</h2>
        {#if description}<p class="desc">{description}</p>{/if}
        <ul class="facts">
            <li><strong>{total}</strong> carte{total > 1 ? "s" : ""} possible{total > 1 ? "s" : ""}</li>
            {#if endsAt}<li>Se termine dans <strong><Countdown until={endsAt} /></strong></li>{/if}
            {#if variants > 1}<li>{variants} paquets au choix, même contenu</li>{/if}
        </ul>
        {#if progress && progress.total}
            <div class="progress">
                <span class="muted">Ton album</span>
                <strong>{progress.owned}/{progress.total} · {percent} %</strong>
                <span class="meter"><span class="fill" style="width: {Math.min(100, percent)}%"></span></span>
            </div>
        {/if}
        <button type="button" class="btn btn-accent open" disabled={disabled || stock < 1} onclick={onopen}>
            {#if stock < 1}
                Aucun booster en réserve
            {:else}
                Ouvrir ce booster
            {/if}
        </button>
        {#if stock < 1 && nextAt}
            <span class="muted small">Prochain dans <Countdown until={nextAt} /></span>
        {:else if stock > 0}
            <span class="muted small">{stock} en réserve</span>
        {/if}
    </div>
</div>

<style>
    .backdrop {
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
    }

    .sheet {
        position: fixed;
        z-index: 10001;
        left: 50%;
        top: 50%;
        translate: -50% -50%;
        width: min(46rem, 94vw);
        max-height: 92dvh;
        overflow-y: auto;
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 2rem;
        padding: 2rem 2.2rem;
        border: 1px solid color-mix(in srgb, var(--c) 60%, transparent);
        border-radius: calc(var(--radius) * 2);
        background:
            radial-gradient(circle at 20% 30%, color-mix(in srgb, var(--c) 28%, transparent), transparent 60%),
            var(--surface);
        box-shadow: 0 1.5rem 4rem rgba(0, 0, 0, 0.6);
    }

    .close {
        position: absolute;
        top: 0.5rem;
        right: 0.6rem;
        width: 2.4rem;
        height: 2.4rem;
        border: none;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.06);
        color: var(--foreground);
        font-size: 1.5rem;
        line-height: 1;
    }

    .pack {
        display: grid;
        place-items: center;
        padding: 1rem 0.5rem 1.5rem;
    }

    .info {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-width: 0;
    }

    .code {
        font-size: 0.75rem;
        letter-spacing: 0.3em;
        color: var(--c);
    }

    h2 {
        font-family: var(--titleFont);
        font-size: 2rem;
        line-height: 1.05;
    }

    .desc {
        color: var(--muted);
        line-height: 1.45;
        white-space: pre-line;
    }

    .facts {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        font-size: 0.9rem;
    }

    .facts li::before {
        content: "◆";
        margin-right: 0.5rem;
        font-size: 0.6rem;
        color: var(--c);
        vertical-align: middle;
    }

    .progress {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.3rem;
        padding: 0.6rem 0.75rem;
        border-radius: var(--radius);
        background: rgba(255, 255, 255, 0.04);
        font-size: 0.85rem;
    }

    .meter {
        grid-column: 1 / -1;
        position: relative;
        height: 6px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        overflow: hidden;
    }

    .fill {
        position: absolute;
        inset: 0 auto 0 0;
        border-radius: inherit;
        background: var(--Pura);
        box-shadow: 0 0 8px var(--Pura);
        animation: grow 0.9s 0.15s cubic-bezier(0.22, 1, 0.36, 1) backwards;
    }

    .open {
        margin-top: 0.4rem;
        padding: 0.8rem 1rem;
        font-size: 1.05rem;
    }

    .small {
        font-size: 0.8rem;
        text-align: center;
    }

    @keyframes grow {
        from {
            width: 0;
        }
    }

    @media (max-width: 640px) {
        .sheet {
            left: 0;
            right: 0;
            top: auto;
            bottom: 0;
            translate: none;
            width: auto;
            grid-template-columns: 1fr;
            gap: 0.5rem;
            padding: 1.2rem 1.1rem calc(1.2rem + env(safe-area-inset-bottom));
            border-radius: calc(var(--radius) * 3) calc(var(--radius) * 3) 0 0;
            border-bottom: none;
        }

        .pack {
            padding: 0.5rem 0 1rem;
        }

        h2 {
            font-size: 1.6rem;
        }

        .info {
            text-align: left;
        }
    }
</style>
