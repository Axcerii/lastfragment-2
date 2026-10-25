<script lang="ts">
    // Vue détaillée d'une carte, en plein écran : on la manipule au doigt (ou au gyroscope sur
    // téléphone), on la retourne, et on passe d'un exemplaire à l'autre quand on en a plusieurs.
    import type { Snippet } from "svelte";
    import { onDestroy } from "svelte";
    import { formatSerial, formatWear, rarityLabel, wearTier, type CopyView, type TemplateView } from "$lib/cards/types";
    import CollectibleCard from "./CollectibleCard.svelte";

    let {
        template,
        copies,
        selected = $bindable(0),
        onclose,
        actions,
    }: {
        template: TemplateView;
        copies: CopyView[];
        selected?: number;
        onclose: () => void;
        actions?: Snippet<[CopyView]>;
    } = $props();

    let flipped = $state(false);
    let gyro = $state(false);
    let copy = $derived(copies[selected] ?? copies[0] ?? null);

    // Le gyroscope n'existe que sur téléphone ; iOS demande une autorisation, accordée d'un toucher.
    const canGyro =
        typeof window !== "undefined" && "DeviceOrientationEvent" in window && navigator.maxTouchPoints > 0;

    async function toggleGyro() {
        if (gyro) {
            gyro = false;
            return;
        }
        const request = (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
            .requestPermission;
        if (typeof request === "function") {
            try {
                if ((await request()) !== "granted") return;
            } catch {
                return;
            }
        }
        gyro = true;
    }

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
<div
    class="inspector"
    role="dialog"
    aria-modal="true"
    aria-label={template.name}
    tabindex="-1"
    style="--rarity: var(--rarity-{template.rarity})"
    onclick={(e) => e.target === e.currentTarget && onclose()}
>
    <button type="button" class="close btn btn-small" onclick={onclose} aria-label="Fermer">✕</button>

    <div class="card">
        <CollectibleCard card={template} {copy} bind:flipped tilt="full" {gyro} glow={template.rarity >= 3} label={template.name} />
    </div>

    <div class="info">
        <strong>{template.name}</strong>
        <span class="rarity">{rarityLabel(template.rarity)}{template.set ? ` · ${template.set.name}` : ""}</span>
        {#if copy}
            <span class="muted">
                {formatSerial(copy.serial, template.maxPrints)} · {wearTier(copy.wear).label} · {formatWear(copy.wear)}
            </span>
        {/if}
    </div>

    {#if copies.length > 1}
        <div class="copies" role="radiogroup" aria-label="Exemplaires">
            {#each copies as c, i (c.id)}
                <button type="button" role="radio" aria-checked={i === selected} class:on={i === selected} onclick={() => (selected = i)}>
                    {formatSerial(c.serial, template.maxPrints)}
                    <small>{formatWear(c.wear).slice(0, 5)}</small>
                </button>
            {/each}
        </div>
    {/if}

    <div class="tools">
        <button type="button" class="btn btn-small" onclick={() => (flipped = !flipped)}>
            {flipped ? "Recto" : "Verso"}
        </button>
        {#if canGyro}
            <button type="button" class="btn btn-small" class:on={gyro} onclick={toggleGyro}>
                {gyro ? "Inclinaison activée" : "Incliner le téléphone"}
            </button>
        {/if}
        {#if copy}
            <a class="btn btn-small" href="/cartes/carte/{copy.id}">Historique</a>
            {@render actions?.(copy)}
        {/if}
    </div>
    <p class="hint muted">Glisse sur le côté pour la retourner · le reflet suit ton doigt</p>
</div>

<style>
    .inspector {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.9rem;
        padding: 1rem;
        background:
            radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--rarity) 22%, transparent), transparent 60%),
            rgba(8, 8, 10, 0.96);
        overflow: auto;
        animation: appear 0.25s ease-out;
    }

    .close {
        position: fixed;
        top: 1rem;
        right: 1rem;
    }

    .card {
        width: min(78vw, 360px, calc(62dvh * 63 / 88));
        animation: rise 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.1);
    }

    .info {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0.1rem;
    }

    .info strong {
        font-family: var(--titleFont);
        font-size: 1.4rem;
    }

    .rarity {
        color: var(--rarity);
        font-size: 0.8rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .info .muted {
        font-size: 0.75rem;
        font-variant-numeric: tabular-nums;
    }

    .copies {
        display: flex;
        gap: 0.35rem;
        max-width: 100%;
        overflow-x: auto;
        padding-bottom: 0.2rem;
    }

    .copies button {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0.25rem 0.6rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: none;
        color: var(--foreground);
        font-size: 0.75rem;
        font-variant-numeric: tabular-nums;
    }

    .copies button.on {
        border-color: var(--rarity);
        background: color-mix(in srgb, var(--rarity) 18%, transparent);
    }

    .copies small {
        opacity: 0.6;
    }

    .tools {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.4rem;
    }

    .tools .on {
        border-color: var(--accent);
        color: var(--accent);
    }

    .hint {
        font-size: 0.7rem;
    }

    @keyframes appear {
        from {
            opacity: 0;
        }
    }

    @keyframes rise {
        from {
            transform: translateY(30px) scale(0.92);
            opacity: 0;
        }
    }
</style>
