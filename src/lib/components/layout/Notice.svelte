<script lang="ts">
    import type { Snippet } from "svelte";

    // Page d'information centrée : erreur, section à venir, profil sans personnage…
    let {
        title,
        dragon = "Chronos",
        children,
    }: { title: string; dragon?: string; children: Snippet } = $props();
</script>

<main>
    <img src="/dragons/tampons/{dragon}.svg" alt="" />
    <h1>{title}</h1>
    {@render children()}
</main>

<style>
    main {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        max-width: 40rem;
        margin: 6rem auto;
        padding: 0 1rem;
        text-align: center;
    }

    h1 {
        font-size: 3rem;
    }

    img {
        position: absolute;
        top: -4rem;
        left: 50%;
        width: 22rem;
        max-width: 90%;
        transform: translateX(-50%);
        opacity: 0.15;
        z-index: -1;
    }
</style>
