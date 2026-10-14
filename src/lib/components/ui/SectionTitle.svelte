<script lang="ts">
    import type { Snippet } from "svelte";

    // Titre de section de la maquette : souligné, suivi de « : ».
    let { level = 2, children }: { level?: 2 | 3; children: Snippet } = $props();
</script>

<svelte:element this={`h${level}`} class="section-title">
    <span>{@render children()}</span> :
</svelte:element>

<style>
    .section-title {
        font-family: var(--titleFont);
        font-size: 24px;
        font-weight: normal;
        margin-bottom: 10px;
    }

    span {
        text-decoration: underline;
        text-decoration-thickness: from-font;
        text-underline-offset: 3px;
    }
</style>
