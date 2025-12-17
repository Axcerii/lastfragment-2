<script lang="ts">
    import CharacterCard from "$lib/components/personnages/CharacterCard.svelte";
    import Checkbox from "$lib/components/Checkbox.svelte";

    const personnages = fetch("http://localhost:5173/api/characters").then(
        (res) => res.json(),
    );

    console.log(personnages);
</script>

<svelte:head>
    <title>Personnages</title>
    <body class="pages-personnages"> </body>
</svelte:head>

<div class="container">
    <div class="filtres">
        <Checkbox id="Personnages" checked={true} name="filtres" />
        <Checkbox id="Monstres" name="filtres" svg="dragons/normal/Yinva.svg" />
        <Checkbox
            id="Important"
            name="Important"
            type="checkbox"
            svg="dragons/normal/Guizamark.svg"
        />
    </div>
    <div class="search">
        <div class="search-container">
            <input type="text" placeholder="Rechercher" />
        </div>
    </div>
    <div class="card-container">
        <CharacterCard
            nom="Test"
            tags={["Humain", "Guerrier", "Soldat"]}
            image="uploads/personnages/1758761239499-Adam-Détouré.png"
            titre="L'épée noir"
            pays="Augeaime"
            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        />
        <CharacterCard
            nom="Test"
            image="uploads/personnages/1758761239499-Adam-Détouré.png"
            tags={["Humain", "Guerrier", "Soldat"]}
            titre="L'épée noir"
            pays="Mudan"
            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        />
        <CharacterCard
            nom="Test"
            image="uploads/personnages/1758761239499-Adam-Détouré.png"
            tags={["Humain", "Guerrier", "Soldat"]}
            titre="L'épée noir"
            pays="Mudan"
            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        />
        <CharacterCard
            nom="Test"
            image="uploads/personnages/1758761239499-Adam-Détouré.png"
            tags={["Humain", "Guerrier", "Soldat"]}
            titre="L'épée noir"
            pays="Mudan"
            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        />
        <CharacterCard
            nom="Test"
            image="uploads/personnages/1758761239499-Adam-Détouré.png"
            tags={["Humain", "Guerrier", "Soldat"]}
            titre="L'épée noir"
            pays="Mudan"
            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        />
        <CharacterCard
            nom="Test"
            image="uploads/personnages/1758761239499-Adam-Détouré.png"
            tags={["Humain", "Guerrier", "Soldat"]}
            titre="L'épée noir"
            pays="Mudan"
            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        />
        <CharacterCard
            nom="Test"
            image="uploads/personnages/1758761239499-Adam-Détouré.png"
            tags={["Humain", "Guerrier", "Soldat"]}
            titre="L'épée noir"
            pays="Mudan"
            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        />
        <CharacterCard
            nom="Test"
            image="uploads/personnages/1758761239499-Adam-Détouré.png"
            tags={["Humain", "Guerrier", "Soldat"]}
            titre="L'épée noir"
            pays="Mudan"
            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        />
        <CharacterCard
            nom="Test"
            image="uploads/personnages/1758761239499-Adam-Détouré.png"
            tags={["Humain", "Guerrier", "Soldat"]}
            titre="L'épée noir"
            pays="Mudan"
            mort={true}
            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        />
        <CharacterCard
            nom="Test"
            image="uploads/personnages/1758761239499-Adam-Détouré.png"
            tags={["Humain", "Guerrier", "Soldat"]}
            titre="L'épée noir"
            pays="Mudan"
            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        />
    </div>
</div>

<style>
    :global(html) {
        background-image: url("personnages/backgroundpattern.png") !important;
        background-size: 50%;
        background-position: 20% 20%;
    }
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
        transform: translateX(-50%);
        transform: rotate(90deg);
        transform-origin: left;
    }

    .search input {
        background-color: var(--accent);
        border: var(--primary) 1px solid;
        font-family: "Aster";
    }

    .card-container {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        width: 80%;
        height: 75vh;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 1rem;

        scrollbar-color: var(--primary) transparent;
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
            margin-top: 120px;
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
            padding: 0;
        }
    }
</style>
