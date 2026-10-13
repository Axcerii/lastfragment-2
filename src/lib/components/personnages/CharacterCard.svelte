<script lang="ts">
    let {
        href,
        image = "/uploads/personnages/placeholder.png",
        nom = "Erreur",
        emblem = "/pays/Inconnu.svg",
        mort = false,
        titre = "",
        description = "",
        tags = [],
        flags = [],
    }: {
        href: string;
        image?: string;
        nom?: string;
        /** Emblème affiché derrière le portrait (pays ou dragon). */
        emblem?: string;
        mort?: boolean;
        titre?: string | null;
        description?: string;
        tags?: string[];
        /** Mentions réservées au MJ (« Caché », « Censuré »…). */
        flags?: string[];
    } = $props();

    const EXCERPT_LENGTH = 100;

    let excerpt = $derived(
        description.length > EXCERPT_LENGTH
            ? description.slice(0, EXCERPT_LENGTH).split(" ").slice(0, -1).join(" ") + "..."
            : description,
    );

    // Un personnage mort est grisé et son emblème est remplacé par celui de Shizari.
    let emblemUrl = $derived(mort ? "/dragons/normal/Shizari.svg" : emblem);
</script>

<a {href} class="inverter">
    <div class="character-card">
        <div class="absolute character-wrapper">
            <img src={image} alt="Image de {nom}" class="character" class:mort />
        </div>
        <div
            class="absolute pays pays-color"
            class:mort
            style="background-image: url('{encodeURI(emblemUrl)}');"
        ></div>
        <div class="absolute hover"></div>
        {#if flags.length > 0}
            <div class="flags">
                {#each flags as flag}
                    <span>{flag}</span>
                {/each}
            </div>
        {/if}
        <div class="dialogue">
            <img
                src="/personnages/Dialogueboxup.svg"
                alt=""
                class="dialogue-icon secondary-svg"
            />
            <div class="dialogue-background"></div>
            <p class="nom">
                {nom}
                {#if titre}
                    <span class="title-mobile">, {titre}</span>
                {/if}
            </p>

            {#if titre}
                <div class="separateur-card"></div>
                <p class="titre-desktop">{titre}</p>
            {/if}

            {#if tags.length > 0}
                <div class="tags">
                    {#each tags as tag}
                        <div class="tag-container">
                            <img
                                src="/personnages/Plume.svg"
                                alt=""
                                class="plume"
                            />
                            <span class="tag">{tag}</span>
                        </div>
                    {/each}
                </div>
            {/if}
            {#if excerpt}
                <p class="description">
                    {excerpt}
                </p>
            {/if}
        </div>
    </div>
</a>

<style>
    .character-card {
        position: relative;
        width: 16.125rem;
        height: 16.125rem;
        background-color: #101010;
        border-radius: var(--radius);
        border: var(--primary) 3px solid;
        overflow: hidden;
        box-shadow: rgba(0, 0, 0, 0.5) 0px 0px 2rem inset;

        transition: var(--transition);
    }
    .absolute {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
    }
    .character-wrapper {
        width: 100%;
        height: 100%;
    }

    .character {
        position: relative;
        width: 100%;
        object-fit: cover;
        filter: drop-shadow(-10px -10px 0px rgba(0, 0, 0, 0.8));
        z-index: 996;
    }
    .character.mort {
        filter: grayscale(100%) brightness(0.25)
            drop-shadow(-10px -10px 0px rgba(0, 0, 0, 0.8));
    }

    .pays {
        opacity: 0.3;
        z-index: 995;
    }

    .pays-color.mort {
        filter: invert(26%) sepia(100%) saturate(6787%) hue-rotate(358deg)
            brightness(91%) contrast(127%);
    }

    .flags {
        position: absolute;
        top: 0.4rem;
        right: 0.4rem;
        z-index: 1002;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.25rem;
    }

    .flags span {
        font-size: 0.7rem;
        padding: 0.1rem 0.4rem;
        border-radius: var(--radius);
        background-color: var(--accent);
        color: var(--background);
    }

    .pays-color {
        background-size: 95%;
        background-repeat: no-repeat;
        background-position: center;
        filter: invert(90%) sepia(13%) saturate(311%) hue-rotate(52deg)
            brightness(101%) contrast(81%);
    }

    .dialogue {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 30%;
        width: 100%;
        box-sizing: border-box;
        padding: 1rem;
        z-index: 1000;
        color: var(--foreground);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        transition: var(--transition);
    }

    .separateur-card {
        position: relative;
        width: 50%;
        height: 2px;
        background-color: var(--foreground);
        margin: 0 auto;
        z-index: 1001;
        flex-shrink: 0;
    }

    .dialogue p {
        position: relative;
        text-align: center;
        z-index: 1001;
    }

    .dialogue-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(27, 27, 27, 0.9);
        filter: blur(2px);
        overflow: hidden;
        border-radius: var(--radius) var(--radius) 0 0;
        z-index: 999;
        transition: var(--transition);
    }

    .dialogue-icon {
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 40%;
        z-index: 1001;
        transition: var(--transition);
    }

    .character-card:hover {
        transform: rotate(1deg) scale(1.02);
        cursor: pointer;
    }

    .character-card:hover .dialogue {
        filter: blur(0px);
        height: 100%;
    }

    .character-card:hover .dialogue-icon {
        opacity: 0;
    }

    .character-card:hover .tag-container {
        opacity: 1;
    }

    .tags {
        display: flex;
        flex-direction: column;
        justify-content: center;
        margin-left: 1rem;
    }

    .tag-container {
        position: relative;
        justify-content: center;
        gap: 0.5rem;
        z-index: 1001;
        opacity: 0;
        transition: var(--transition);
    }

    .plume {
        width: 1rem;
    }

    .tag {
        color: var(--foreground);
    }

    .description {
        text-align: left !important;
    }

    .title-mobile {
        display: none;
    }

    .nom {
        font-family: var(--titleFont);
        font-weight: bold;
    }

    @media (max-width: 600px) {
        a {
            text-decoration: none;
            width: 100%;
        }
        .character-card {
            width: 90%;
            height: 107px;
            margin: auto;
            border: var(--primary) 2px solid;
            background-color: #131313;
            box-shadow: rgba(210, 182, 116, 0.25) 2px 2px 6px;
        }

        .dialogue-background {
            background-color: transparent;
            filter: blur(0);
        }

        .titre-desktop {
            display: none;
        }

        .separateur-card {
            display: none;
        }

        .title-mobile {
            display: block;
        }

        .dialogue {
            height: 100%;
            padding: 10px 20px;
        }

        .dialogue p {
            text-align: left;
        }

        .dialogue-icon {
            display: none;
        }

        .character {
            width: 30%;
            margin: auto auto 0 auto;

            -webkit-filter: drop-shadow(0px 0px 0px rgba(0, 0, 0, 0));
            filter: drop-shadow(0px 0px 0px rgba(0, 0, 0, 0));
        }

        .pays-color {
            filter: invert(76%) sepia(57%) saturate(281%) hue-rotate(2deg)
                brightness(88%) contrast(87%);
            background-size: 30%;
        }

        .nom {
            display: flex;
        }

        .tags {
            flex-wrap: wrap;
            justify-content: start;
            align-items: start;
            height: 60px;
        }

        .tag-container {
            opacity: 1;
            font-size: 0.875rem;
        }

        .pays {
            opacity: 0.6;
        }

        .pays {
            background-size: 40%;
            background-position-y: 10%;
        }

        .description {
            display: none;
        }

        .inverter:nth-child(odd) .character {
            margin-left: 65%;
        }

        .inverter:nth-child(odd) .pays {
            background-position-x: 100%;
        }

        .inverter:nth-child(even) .pays {
            background-position-x: 0%;
        }

        .inverter:nth-child(even) .tags {
            justify-content: end;
            align-items: end;
        }

        .inverter:nth-child(even) .nom {
            justify-content: flex-end;
        }

        .inverter:nth-child(even) .tag-container {
            display: flex;
            flex-direction: row-reverse;
        }

        .inverter:nth-child(even) .plume {
            transform: rotate(180deg);
        }
    }
</style>
