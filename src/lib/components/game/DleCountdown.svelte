<script lang="ts">
    import { onMount } from "svelte";

    // Compte à rebours jusqu'au prochain personnage du Lastdle. En grand (partie finie),
    // un anneau se vide au fil de la journée et les chiffres défilent à chaque seconde.
    let { seconds, big = false }: { seconds: number; big?: boolean } = $props();

    const DAY = 86_400;
    const RADIUS = 54;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

    const pad = (n: number) => String(n).padStart(2, "0");
    let parts = $derived([
        pad(Math.floor(seconds / 3600)),
        pad(Math.floor((seconds % 3600) / 60)),
        pad(seconds % 60),
    ]);

    // L'anneau part vide puis se remplit jusqu'au temps restant : l'entrée de l'animation.
    let drawn = $state(false);
    let settled = $state(false);
    let offset = $derived(drawn ? CIRCUMFERENCE * (1 - Math.min(seconds, DAY) / DAY) : CIRCUMFERENCE);

    onMount(() => {
        requestAnimationFrame(() => (drawn = true));
        const timer = setTimeout(() => (settled = true), 1500);
        return () => clearTimeout(timer);
    });
</script>

<div class="countdown" class:big role="timer" aria-label="Prochain personnage dans {parts.join(':')}">
    {#if big}
        <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle class="track" cx="60" cy="60" r={RADIUS} />
            <circle
                class="ring"
                class:settled
                cx="60"
                cy="60"
                r={RADIUS}
                stroke-dasharray={CIRCUMFERENCE}
                stroke-dashoffset={offset}
            />
        </svg>
    {/if}
    <span class="digits" aria-hidden="true">
        {#each parts as part, i (i)}
            {#if i}<span class="colon">:</span>{/if}
            <span class="group">
                {#key part}
                    <span class="value">{part}</span>
                {/key}
            </span>
        {/each}
    </span>
    {#if big}<span class="caption muted">avant le prochain personnage</span>{/if}
</div>

<style>
    .countdown {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-variant-numeric: tabular-nums;
    }

    .digits {
        display: inline-flex;
        align-items: baseline;
        font-family: var(--titleFont);
        font-size: 1.6rem;
        /* Le temps est l'affaire de Chronos. */
        color: var(--Chronos);
        line-height: 1;
    }

    .group {
        display: inline-block;
    }

    /* Chaque nouvelle valeur glisse depuis le haut (sans fondu : le chiffre reste lisible quoi qu'il arrive). */
    .value {
        display: inline-block;
        animation: drop 0.35s ease-out;
    }

    @keyframes drop {
        from {
            transform: translateY(-35%);
        }
        to {
            transform: translateY(0);
        }
    }

    .colon {
        margin: 0 0.1em;
        color: var(--muted);
    }

    .big {
        flex-shrink: 0;
        width: 11rem;
        height: 11rem;
        animation: appear 0.6s ease-out;
    }

    /* Entrée en zoom seulement : sans fondu, le compte à rebours reste lisible même si l'animation est interrompue. */
    @keyframes appear {
        from {
            transform: scale(0.85);
        }
        to {
            transform: scale(1);
        }
    }

    .big svg {
        position: absolute;
        inset: 0;
        transform: rotate(-90deg);
    }

    .big .digits {
        font-size: 2.1rem;
    }

    circle {
        fill: none;
        stroke-width: 5;
    }

    .track {
        stroke: var(--chance-soft);
    }

    .ring {
        stroke: var(--Chronos);
        stroke-linecap: round;
        transition: stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1);
    }

    /* Une fois dessiné, l'anneau suit les secondes sans à-coups. */
    .ring.settled {
        transition: stroke-dashoffset 1s linear;
    }

    .caption {
        margin-top: 0.4rem;
        font-size: 0.75rem;
        text-align: center;
        max-width: 8rem;
        line-height: 1.2;
    }

    @media (prefers-reduced-motion: reduce) {
        .value,
        .big {
            animation: none;
        }

        .ring,
        .ring.settled {
            transition: none;
        }
    }
</style>
