<script lang="ts">
    // Index des outils. Chaque outil est une carte ; les suivants s'ajouteront ici.
    const TOOLS = [
        {
            href: "/outils/table",
            title: "Table de jeu",
            text: "Rejoins la partie ouverte par le MJ : plateau, jets de dés, combats et musique en direct.",
            dragon: "Chronos",
        },
        {
            href: "/outils/createur",
            title: "Créateur de personnage",
            text: "Génère des stats à la puissance voulue, imagine un personnage ou un monstre, et propose-le au MJ.",
            dragon: "Guizamark",
        },
    ];
</script>

<svelte:head>
    <title>Outils : Last Fragment</title>
</svelte:head>

<main>
    <h1>Outils</h1>
    <div class="tools">
        {#each TOOLS as tool (tool.href)}
            <a class="tool panel" href={tool.href}>
                <img src="/dragons/tampons/{tool.dragon}.svg" alt="" />
                <span>
                    <strong>{tool.title}</strong>
                    <span class="muted">{tool.text}</span>
                </span>
            </a>
        {/each}
    </div>
</main>

<style>
    main {
        width: min(60rem, 92%);
        margin: 0 auto;
        padding: 3rem 0;
    }

    h1 {
        font-size: 2.6rem;
        margin-bottom: 2rem;
    }

    .tools {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr));
        gap: 1rem;
    }

    .tool {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        transition: var(--transition);
    }

    .tool:hover {
        border-color: var(--accent);
        transform: translateY(-2px);
    }

    img {
        width: 5rem;
        height: 5rem;
        flex-shrink: 0;
        filter: invert(90%) sepia(13%) saturate(311%) hue-rotate(52deg) brightness(101%)
            contrast(81%);
    }

    .tool > span {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    strong {
        font-family: var(--titleFont);
        font-size: 1.5rem;
    }

    @media (max-width: 600px) {
        .tools {
            grid-template-columns: 1fr;
        }
    }
</style>
