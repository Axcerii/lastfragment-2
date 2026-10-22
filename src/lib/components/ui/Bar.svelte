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
    {#if main > 0}
        <span class="fill" class:full={main >= 100} style="width: {main}%"></span>
    {/if}
    {#if end > main}
        <span
            class="extra"
            class:loss
            class:full={end >= 100}
            style="--from: {main}%; --span: {end - main}%"
        ></span>
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

    /* Bonus et malus : un segment hachuré collé à la valeur de base. Le bonus s'arrondit à droite ;
       le malus (la partie perdue) s'arrondit à gauche et mord sur la base, hachures inversées. */
    .extra {
        --r: calc(var(--height) / 3);
        position: absolute;
        top: 0;
        bottom: 0;
        left: var(--from);
        width: var(--span);
        box-sizing: border-box;
        background-color: var(--color);
        background-image: repeating-linear-gradient(
            -45deg,
            rgba(0, 0, 0, 0.35) 0 4px,
            transparent 4px 8px
        );
        border-radius: 0 var(--r) var(--r) 0;
        transition: var(--transition);
    }

    .extra:not(.full) {
        border-right: 1px solid var(--foreground);
    }

    .extra.loss {
        left: calc(var(--from) - var(--r));
        width: calc(var(--span) + var(--r));
        /* Opaque : il recouvre le bout de la base qu'il mord. */
        background-color: color-mix(in srgb, #ca4444 55%, #131313);
        background-image: repeating-linear-gradient(
            45deg,
            rgba(0, 0, 0, 0.45) 0 4px,
            transparent 4px 8px
        );
        border-left: 1px solid var(--foreground);
        border-radius: var(--r) 0 0 var(--r);
    }

    /* Le logo remplit sa case en largeur et déborde en hauteur : la barre le rogne (overflow: hidden). */
    .icon {
        position: absolute;
        left: 1.63%;
        top: 0;
        bottom: 0;
        width: 17.88%;
        min-width: calc(var(--height) * 1.5);
        opacity: 0.3;
        background-color: #000;
        mask: var(--icon) center / cover no-repeat;
        -webkit-mask: var(--icon) center / cover no-repeat;
        pointer-events: none;
    }
</style>
