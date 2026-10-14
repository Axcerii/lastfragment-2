<script lang="ts">
    // Barre de progression de la maquette : fond sombre, contour clair, remplissage coloré
    // et logo en filigrane à gauche. Les valeurs sont en pourcentage et bornées à 0–100.
    let {
        value,
        extra = 0,
        loss = false,
        color = "var(--primary)",
        icon,
        label,
        valueText,
        height = "24px",
    }: {
        /** Remplissage principal. */
        value: number;
        /** Prolongement hachuré au-delà de `value` (bonus), ou partie perdue si `loss`. */
        extra?: number;
        loss?: boolean;
        color?: string;
        /** Logo en filigrane (SVG ou PNG à fond transparent). */
        icon?: string;
        /** Nom lu par les lecteurs d'écran. */
        label: string;
        valueText?: string;
        height?: string;
    } = $props();

    const clamp = (n: number) => Math.max(0, Math.min(100, n));

    let main = $derived(clamp(value));
    let end = $derived(clamp(value + extra));
</script>

<span
    class="bar"
    style="--color: {color}; --height: {height}"
    role="meter"
    aria-label={label}
    aria-valuenow={Math.round(main)}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuetext={valueText}
>
    {#if end > main}
        <span class="fill extra" class:loss class:full={end >= 100} style="width: {end}%"></span>
    {/if}
    {#if main > 0}
        <span class="fill" class:full={main >= 100} style="width: {main}%"></span>
    {/if}
    {#if icon}
        <span class="icon" style="--icon: url('{encodeURI(icon)}')" aria-hidden="true"></span>
    {/if}
</span>

<style>
    .bar {
        position: relative;
        display: block;
        width: 100%;
        height: var(--height);
        box-sizing: border-box;
        background-color: #131313;
        border: 1px solid var(--foreground);
        border-radius: var(--radius);
        overflow: hidden;
    }

    .fill {
        position: absolute;
        inset: 0 auto 0 0;
        background-color: var(--color);
        border-right: 1px solid var(--foreground);
        transition: width 600ms ease-out;
    }

    .fill.full {
        border-right: none;
    }

    /* Bonus : même couleur, hachurée, pour le distinguer de la valeur de base. */
    .extra {
        background-image: repeating-linear-gradient(
            -45deg,
            rgba(0, 0, 0, 0.35) 0 4px,
            transparent 4px 8px
        );
    }

    /* Malus : la partie perdue reste visible en rouge. */
    .extra.loss {
        background-color: rgba(202, 68, 68, 0.55);
    }

    .icon {
        position: absolute;
        left: 1.63%;
        top: 1px;
        bottom: 1px;
        width: 17.88%;
        max-width: calc(var(--height) * 1.2);
        opacity: 0.3;
        background-color: #000;
        mask: var(--icon) left center / contain no-repeat;
        -webkit-mask: var(--icon) left center / contain no-repeat;
        pointer-events: none;
    }
</style>
