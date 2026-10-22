<script lang="ts">
    // Affiche un SVG monochrome dans la couleur voulue (les fichiers d'origine sont noirs).
    let {
        src,
        color = "var(--primary)",
        size = "2rem",
        label = "",
    }: { src: string; color?: string; size?: string; label?: string } = $props();

    // Seuls les SVG peuvent servir de masque ; une image envoyée par le MJ est affichée telle quelle.
    let maskable = $derived(src.toLowerCase().endsWith(".svg"));
</script>

{#if maskable}
    <span
        class="icon"
        role={label ? "img" : undefined}
        aria-label={label || undefined}
        aria-hidden={label ? undefined : "true"}
        style="--icon: url('{encodeURI(src)}'); background-color: {color}; width: {size}; height: {size};"
    ></span>
{:else}
    <img {src} alt={label} style="width: {size}; height: {size};" />
{/if}

<style>
    .icon {
        display: inline-block;
        flex-shrink: 0;
        mask: var(--icon) center / contain no-repeat;
        -webkit-mask: var(--icon) center / contain no-repeat;
    }

    img {
        flex-shrink: 0;
        object-fit: contain;
        border-radius: var(--radius);
    }
</style>
