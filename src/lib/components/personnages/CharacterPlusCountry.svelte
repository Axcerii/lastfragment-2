<script lang="ts">
    let {
        image = "/uploads/personnages/placeholder.png",
        name = "Erreur",
        title = "",
        country = "Inconnu",
    } = $props();
</script>

<div class="container">
    <div class="image">
        <div
            class="background-pays secondary-svg"
            style="background-image: url('/pays/{country}.svg')"
        ></div>
        <img src={image} alt="Image de {name},{title}" />
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
