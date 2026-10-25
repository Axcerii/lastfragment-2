<script lang="ts">
    // Index des outils. Chaque outil est une carte ; les suivants s'ajouteront ici.
    let { data } = $props();

    const ALL_TOOLS = [
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
        {
            href: "/cartes",
            title: "Cartes à collectionner",
            text: "Ouvre un booster toutes les quelques heures, complète l'album des séries et échange tes doubles avec les autres joueurs.",
            dragon: "Pura",
        },
        {
            href: "/outils/lastdle",
            title: "Lastdle",
            text: "Un personnage à deviner chaque jour : flux, race, pays, vivant ou mort, descendance et métier te mettent sur la piste.",
            dragon: "Yinva",
        },
    ];

    // Le jeu de cartes n'apparaît qu'une fois rendu public par le MJ.
    let TOOLS = $derived(ALL_TOOLS.filter((t) => t.href !== "/cartes" || data.cardsVisible));
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
    /* Comme sur la V1 : un bandeau par outil sur toute la largeur, l'image alternant de côté. */
    main {
        width: 92%;
        margin: 0 auto;
        padding: 3rem 0;
    }

    h1 {
        font-size: 2.6rem;
        margin-bottom: 2rem;
    }

    .tools {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .tool {
        display: flex;
        align-items: center;
        gap: 2rem;
        padding: 2rem 3rem;
        transition: var(--transition);
    }

    /* Seule l'image change de côté : le texte reste aligné à gauche, plus facile à lire. */
    .tool:nth-child(even) {
        flex-direction: row-reverse;
    }

    .tool:hover {
        border-color: var(--accent);
        transform: translateY(-2px);
    }

    img {
        width: 10rem;
        height: 10rem;
        flex-shrink: 0;
        filter: invert(90%) sepia(13%) saturate(311%) hue-rotate(52deg) brightness(101%)
            contrast(81%);
    }

    .tool > span {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    strong {
        font-family: var(--titleFont);
        font-size: 2.6rem;
    }

    .muted {
        font-size: 1.15rem;
    }

    @media (max-width: 600px) {
        .tool {
            gap: 1rem;
            padding: 1.25rem;
        }

        img {
            width: 5rem;
            height: 5rem;
        }

        strong {
            font-size: 1.6rem;
        }

        .muted {
            font-size: 1rem;
        }
    }
</style>
