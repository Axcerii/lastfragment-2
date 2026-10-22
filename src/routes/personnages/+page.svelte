<script lang="ts">
    import CharacterCard from "$lib/components/personnages/CharacterCard.svelte";
    import Checkbox from "$lib/components/Checkbox.svelte";
    import PatternBackground from "$lib/components/layout/PatternBackground.svelte";
    import { rememberedFilters } from "$lib/filters.svelte";
    import { countryIcon, parseDragons, splitTags } from "$lib/game/labels";

    let { data } = $props();

    const filters = rememberedFilters("personnages-filtres", {
        view: "personnages",
        currentOnly: false,
        search: "",
    });

    const normalize = (text: string) =>
        text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "");

    // La recherche porte sur le nom, le titre et les tags ; chaque mot tapé doit être trouvé.
    function matches(haystack: (string | null)[], current: number) {
        if (filters.currentOnly && !current) return false;
        const text = normalize(haystack.filter(Boolean).join(" "));
        return normalize(filters.search)
            .split(/\s+/)
            .every((word) => text.includes(word));
    }

    let characters = $derived(
        data.characters.filter((c) => matches([c.name, c.title, c.category], c.current)),
    );
    let monsters = $derived(
        data.monsters.filter((m) => matches([m.name, m.dragon], m.current)),
    );

    // Emblème d'un monstre : le premier dragon de sa descendance.
    function dragonEmblem(descent: string) {
        const [first] = parseDragons(descent);
        return first ? `/dragons/normal/${first}.svg` : "/pays/Inconnu.svg";
    }

    let showMonsters = $derived(filters.view === "bestiaire");
    let count = $derived(showMonsters ? monsters.length : characters.length);
</script>

<svelte:head>
    <title>{showMonsters ? "Bestiaire" : "Personnages"} : Last Fragment</title>
</svelte:head>

<PatternBackground />

<div class="container">
    <div class="filtres">
        <Checkbox
            label="Personnages"
            name="vue"
            value="personnages"
            bind:group={filters.view}
            icon="/dragons/tampons/Artrish.svg"
        />
        <Checkbox
            label="Bestiaire"
            name="vue"
            value="bestiaire"
            bind:group={filters.view}
            icon="/dragons/tampons/Yinva.svg"
        />
        <Checkbox
            label="Arc actuel uniquement"
            type="checkbox"
            bind:checked={filters.currentOnly}
            icon="/personnages/Important.svg"
        />
    </div>
    <div class="search">
        <div class="search-container">
            <input
                type="search"
                placeholder={showMonsters ? "Rechercher un monstre" : "Nom, titre ou tag"}
                aria-label="Rechercher"
                bind:value={filters.search}
            />
        </div>
    </div>
    <div class="card-container">
        {#if showMonsters}
            {#each monsters as monster (monster.id)}
                <CharacterCard
                    href="/bestiaire/{monster.id}"
                    nom={monster.name}
                    image={monster.image}
                    emblem={dragonEmblem(monster.dragon)}
                    tags={[`Danger ${monster.dangerosity}`]}
                    description={monster.description}
                    flags={monster.visibility ? [] : ["Caché"]}
                />
            {/each}
        {:else}
            {#each characters as personnage (personnage.id)}
                <CharacterCard
                    href="/personnages/{personnage.id}"
                    nom={personnage.name}
                    tags={splitTags(personnage.category)}
                    image={personnage.image}
                    titre={personnage.title}
                    emblem={countryIcon(personnage.country)}
                    mort={personnage.dead}
                    description={personnage.description}
                    flags={[
                        ...(personnage.visibility ? [] : ["Caché"]),
                        ...(personnage.censored ? ["Censuré"] : []),
                    ]}
                />
            {/each}
        {/if}
        {#if count === 0}
            <p class="empty">Aucun résultat pour ces filtres.</p>
        {/if}
    </div>
</div>

<style>
    .container {
        display: flex;
        padding: 1rem;
        gap: 1rem;
    }

    .filtres {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 105px;
        margin: 0 auto;
        padding-top: 1rem;
    }

    .search {
        position: relative;
        width: 105px;
    }

    .search-container {
        position: absolute;
        width: 75vh;
        left: 50%;
        transform: rotate(90deg);
        transform-origin: left;
    }

    .search input {
        background-color: var(--accent);
        border: var(--primary) 1px solid;
    }

    .card-container {
        display: flex;
        flex-wrap: wrap;
        align-content: flex-start;
        gap: 1rem;
        width: 80%;
        height: 75vh;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 1rem;

        scrollbar-color: var(--primary) transparent;
    }

    .empty {
        width: 100%;
        text-align: center;
        margin-top: 3rem;
    }

    @media only screen and (max-width: 600px) {
        .container {
            flex-direction: column;
            padding: 0;
        }

        .filtres {
            position: absolute;
            padding: 0 0 0 1rem;
            top: 35px;
            flex-direction: row;
            width: 90%;
            margin: 0 auto 0 0;
        }

        .search {
            width: 95%;
            margin: 120px auto 0 auto;
        }

        .search-container {
            transform: rotate(0deg);
            position: relative;
            left: 0;
            width: 100%;
        }

        .card-container {
            width: 95%;
            height: auto;
            overflow: visible;
            padding: 0 0 2rem 0;
            margin: 0 auto;
        }
    }
</style>
