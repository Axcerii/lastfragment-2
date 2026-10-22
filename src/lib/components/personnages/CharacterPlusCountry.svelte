<script lang="ts">
    import { portrait } from "$lib/game/labels";

    let {
        image,
        name = "Erreur",
        title = "",
        country = "Inconnu",
        compact = false,
    }: {
        /** Sans image, la silhouette par défaut est affichée. */
        image?: string | null;
        name?: string;
        title?: string;
        country?: string;
        /** Format du profil : portrait de 207 px, ornement sous le nom au lieu de chevaucher le portrait. */
        compact?: boolean;
    } = $props();
</script>

<div class="container" class:compact>
    <div class="image">
        <div
            class="background-pays secondary-svg"
            style="background-image: url('/pays/{country}.svg')"
        ></div>
        <img src={portrait(image)} alt="Image de {name},{title}" />
    </div>
    <div class="name">
        <h2>
            {name}{#if title}
                <span class="title">, {title}</span>
            {/if}
        </h2>
    </div>
    <img
        src="/personnages/Dialogueboxup.svg"
        alt=""
        class="secondary-svg dialogue-box"
    />
</div>

<style>
    .container {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        min-width: 25%;
        width: 25rem;
        max-width: 95%;
        aspect-ratio: 1;
    }

    .background-pays {
        width: 100%;
        height: 100%;
        position: absolute;
        opacity: 0.6;
        background-position: center;
        background-size: 80%;
        background-repeat: no-repeat;
        z-index: -1;
    }

    .image {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        margin: auto;
    }

    .image img {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        height: 100%;
        width: auto;
        object-fit: cover;
    }
    .name {
        width: 100%;
        color: var(--foreground);
        text-align: center;
    }
    .secondary-svg {
        width: 100%;
        height: 100%;
        position: absolute;
        z-index: -1;
    }

    h2 {
        font-size: 2rem;
    }

    .compact {
        width: 100%;
        max-width: 100%;
        aspect-ratio: auto;
        gap: 0;
    }

    .compact .image {
        width: 207px;
        height: 214px;
        flex-shrink: 0;
    }

    .compact .image img {
        top: 0;
        height: 205px;
    }

    .compact .background-pays {
        top: 9px;
        height: 205px;
    }

    .compact h2 {
        margin-top: 0.75rem;
        font-size: 32px;
        font-weight: normal;
    }

    .compact .dialogue-box {
        position: static;
        transform: none;
        width: 110px;
    }

    .dialogue-box {
        position: absolute;
        bottom: -3rem;
        left: 50%;
        transform: translateX(-50%);
        width: 200px;
        height: auto;
        z-index: 10;
    }
</style>
