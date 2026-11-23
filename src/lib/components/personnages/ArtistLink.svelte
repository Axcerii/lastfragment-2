<script lang="ts">
    import { artistLabel } from "$lib/artist";

    // Lien vers l'artiste d'une illustration ; `href` vient déjà de `safeArtistLink` (http/https seulement).
    let { href }: { href: string } = $props();
</script>

<a {href} target="_blank" rel="noopener noreferrer nofollow">{artistLabel(href)}</a>

<style>
    a {
        color: var(--accent);
        overflow-wrap: anywhere;
        transition: var(--transition);
    }

    a:hover,
    a:focus-visible {
        text-decoration: underline;
    }
</style>
