<script lang="ts">
    import CharacterPlusCountry from "$lib/components/personnages/CharacterPlusCountry.svelte";
    export let data;

    const character = data.character;
</script>

<main>
    <div class="infos">
        <div class="character">
            <CharacterPlusCountry
                image={character.image}
                name={character.name}
                title={character.title}
                country={character.country}
            />
        </div>
        <div class="secondaire">
            <p><span>Flux</span> : {character.flux}</p>
            <p><span>Pays</span> : {character.country}</p>
            <p><span>Race</span> : {character.race}</p>
            <p><span>Tags</span> : {character.category}</p>
        </div>
        <div class="dragons">
            <img
                src="/dragons/normal/{character.dragon}.svg"
                alt=""
                class="primary-svg"
            />
        </div>
    </div>
    <div class="description">
        <p>{character.description}</p>
    </div>
</main>

<style>
    :global(html) {
        background-image: url("/personnages/backgroundpattern.png") !important;
        background-size: 50%;
        background-position: 20% 20%;
    }

    main {
        display: flex;
        flex-direction: column;
        gap: 6rem;
        margin: auto;
    }

    .infos {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 60%;
        margin: auto;
    }

    .secondaire {
        width: 25%;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .secondaire > p > span {
        text-decoration: underline;
    }

    .dragons {
        width: 5rem;
        z-index: -1;
    }

    .description {
        width: 65%;
        margin: auto;
        text-align: justify;
    }

    .character {
        width: 40%;
    }

    @media screen and (max-width: 600px) {
        .infos {
            flex-direction: column;
            width: 95%;
            gap: 2rem;
        }
        .character {
            width: 100%;
        }
        .secondaire {
            width: 100%;
            margin-top: 2rem;
        }
        .description {
            width: 90%;
        }
    }
</style>
