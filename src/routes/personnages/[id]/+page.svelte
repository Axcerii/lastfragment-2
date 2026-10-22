<script lang="ts">
    import MjPanel from "$lib/components/game/MjPanel.svelte";
    import PatternBackground from "$lib/components/layout/PatternBackground.svelte";
    import CensorScreen from "$lib/components/personnages/CensorScreen.svelte";
    import CharacterPlusCountry from "$lib/components/personnages/CharacterPlusCountry.svelte";
    import { COUNTRY_LABELS, RACE_LABELS, parseDragons, splitTags } from "$lib/game/labels";

    let { data, form } = $props();

    let character = $derived(data.character);
    // Pour un joueur, une fiche censurée arrive déjà vidée de son contenu.
    let censored = $derived(character.censored && !data.user?.isAdmin);
    let tags = $derived(splitTags(character.category));
    let dragons = $derived(parseDragons(character.dragon));
</script>

<svelte:head>
    <title>{character.name} : Last Fragment</title>
</svelte:head>

<PatternBackground />

<main>
    <div class="infos">
        <div class="character" class:dead={character.dead}>
            <CharacterPlusCountry
                image={character.image}
                name={character.name}
                title={character.title ?? ""}
                country={character.country}
            />
        </div>
        <div class="secondaire">
            {#if censored}
                <p class="censor">Informations censurées</p>
            {:else}
                {#if character.flux}
                    <p><span>Flux</span> : {character.flux}</p>
                {/if}
                <p><span>Pays</span> : {COUNTRY_LABELS[character.country]}</p>
                <p><span>Race</span> : {RACE_LABELS[character.race]}</p>
                {#if tags.length > 0}
                    <p><span>Tags</span> : {tags.join(", ")}</p>
                {/if}
            {/if}
            {#if character.dead}
                <p class="status">Décédé</p>
            {/if}
        </div>
        {#if dragons.length > 0 && !censored}
            <div class="dragons" class:many={dragons.length > 1} title="Descendance de {dragons.join(', ')}">
                {#each dragons as dragon (dragon)}
                    <img
                        src="/dragons/normal/{dragon}.svg"
                        alt="Descendance de {dragon}"
                        class="primary-svg"
                    />
                {/each}
            </div>
        {/if}
    </div>

    {#if censored}
        <CensorScreen quote={character.quote} name={character.name} />
    {:else}
        <div class="description">
            <p>{character.description}</p>
        </div>
    {/if}

    {#if data.stats}
        <MjPanel
            stats={data.stats}
            editHref="/admin/personnages/{character.id}"
            quote={character.quote}
            message={form?.message}
            flags={[
                { name: "visibility", label: "Visible des joueurs", checked: !!character.visibility },
                { name: "current", label: "Arc actuel", checked: !!character.current },
                { name: "dead", label: "Mort", checked: character.dead },
                { name: "censored", label: "Censuré (teaser)", checked: character.censored },
            ]}
        />
    {/if}
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        gap: 6rem;
        margin: auto;
        padding-bottom: 3rem;
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

    .censor,
    .status {
        color: var(--accent);
        font-family: var(--titleFont);
        font-size: 1.2rem;
    }

    /* Un logo par dragon de la descendance, empilés ; plus petits quand il y en a plusieurs. */
    .dragons {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 5rem;
        z-index: -1;
    }

    .dragons.many {
        width: 4rem;
    }

    .dragons img {
        width: 100%;
    }

    .description {
        width: 65%;
        margin: auto;
        text-align: justify;
        white-space: pre-line;
    }


    .character {
        width: 40%;
    }

    .character.dead {
        filter: grayscale(1);
    }

    @media screen and (max-width: 600px) {
        main {
            gap: 4rem;
        }
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
        .dragons,
        .dragons.many {
            flex-direction: row;
            width: auto;
        }
        .dragons img {
            width: 4rem;
        }
        .description {
            width: 90%;
        }
    }
</style>
