<script lang="ts">
    // Résultat d'un jet du menu de dés, affiché quelques secondes en haut du plateau,
    // pour le lanceur seulement (le journal garde la trace pour tout le monde).
    import DieShape from "$lib/components/ui/DieShape.svelte";
    import type { DiceResult } from "$lib/table/types";

    let { roll = $bindable() }: { roll: (DiceResult & { at: number }) | null } = $props();

    const SHOWN_DICE = 8;

    $effect(() => {
        if (!roll) return;
        const timer = setTimeout(() => (roll = null), 6000);
        return () => clearTimeout(timer);
    });
</script>

{#if roll}
    {#key roll.at}
        <div class="zone">
            <div class="toast" role="status">
                {#if roll.reason}<span class="reason">{roll.reason}</span>{/if}
                {#if roll.manual}<span class="reason">Saisi à la main</span>{/if}
                <div class="line">
                    <span class="dice" aria-hidden="true">
                        {#each roll.dice.slice(0, SHOWN_DICE) as die, i (i)}
                            <DieShape
                                faces={die.faces}
                                label={die.value}
                                size="1.7rem"
                                filled={die.value === die.faces}
                                dim={die.value === 1}
                            />
                        {/each}
                        {#if roll.dice.length > SHOWN_DICE}<span class="more">…</span>{/if}
                    </span>
                    <span class="formula">{roll.formula}</span>
                    <strong class="total">{roll.total}</strong>
                    <button class="close" onclick={() => (roll = null)} aria-label="Fermer">✕</button>
                </div>
                {#if roll.detail}<span class="detail">{roll.detail}</span>{/if}
            </div>
        </div>
    {/key}
{/if}

<style>
    /* Centré dans la bande à droite du menu des dés, pour ne pas le couvrir quand il est ouvert. */
    .zone {
        position: absolute;
        z-index: 41;
        top: 0.75rem;
        left: max(0.75rem, min(25rem, calc(100% - 14rem)));
        right: 0.75rem;
        display: flex;
        justify-content: center;
        pointer-events: none;
    }

    .toast {
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.15rem;
        max-width: 100%;
        padding: 0.4rem 0.5rem 0.4rem 0.9rem;
        border: 1px solid var(--chance);
        border-radius: var(--radius);
        background-color: rgba(20, 20, 20, 0.92);
        box-shadow: 0 6px 22px rgba(0, 0, 0, 0.55), 0 0 0 3px var(--chance-glow);
        animation: drop 0.25s ease-out;
    }

    @keyframes drop {
        from {
            opacity: 0;
            transform: translateY(-0.75rem);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .toast {
            animation: none;
        }
    }

    .reason {
        font-size: 0.8rem;
        color: var(--muted);
    }

    .line {
        display: flex;
        align-items: center;
        gap: 0.6rem;
    }

    .dice {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.15rem;
    }

    .more {
        color: var(--muted);
    }

    .formula {
        font-size: 0.85rem;
        color: var(--muted);
        white-space: nowrap;
    }

    .total {
        font-family: var(--titleFont);
        font-size: 1.8rem;
        line-height: 1;
        color: var(--chance);
        font-variant-numeric: tabular-nums;
    }

    .detail {
        font-size: 0.75rem;
        color: var(--muted);
    }

    .close {
        align-self: flex-start;
        padding: 0 0.2rem;
        border: none;
        background: none;
        color: var(--muted);
        font-size: 0.8rem;
    }

    .close:hover {
        color: var(--foreground);
    }
</style>
