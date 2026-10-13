<script lang="ts">
    import type { Snippet } from "svelte";
    import BadgesPanel from "./BadgesPanel.svelte";
    import EquipmentPanel from "./EquipmentPanel.svelte";
    import InventoryPanel from "./InventoryPanel.svelte";
    import PassivesPanel from "./PassivesPanel.svelte";
    import SkillsPanel from "./SkillsPanel.svelte";
    import StatsPanel from "$lib/components/game/StatsPanel.svelte";
    import CharacterPlusCountry from "$lib/components/personnages/CharacterPlusCountry.svelte";
    import { formatMoney } from "$lib/game/inventory";
    import { COUNTRY_LABELS, RACE_LABELS, isDragon } from "$lib/game/labels";
    import { containerLoads, sheetOf } from "$lib/game/sheet";
    import type { SheetData } from "$lib/server/sheet";

    // Fiche de jeu complète d'un joueur. Sert à /profil et à la vue MJ d'un joueur.
    let {
        data,
        canEdit,
        isAdmin = false,
        base,
        showTransfer = true,
        error,
        mjTools,
    }: {
        data: SheetData;
        canEdit: boolean;
        isAdmin?: boolean;
        /** Préfixe des liens vers l'inventaire et la vue de combat de cette fiche. */
        base: string;
        showTransfer?: boolean;
        error?: string;
        mjTools?: Snippet;
    } = $props();

    let character = $derived(data.character!);
    let sheet = $derived(sheetOf(data.stats, data.inventory, data.passives));
    let loads = $derived(containerLoads(data.stats, data.inventory));
</script>

<main>
    <section class="identity">
        <div class="portrait">
            <CharacterPlusCountry
                image={character.image}
                name={character.name}
                title={character.title ?? ""}
                country={character.country}
            />
        </div>
        <div class="infos">
            {#if character.flux}
                <p><span>Flux</span> : {character.flux}</p>
            {/if}
            <p><span>Pays</span> : {COUNTRY_LABELS[character.country]}</p>
            <p><span>Race</span> : {RACE_LABELS[character.race]}</p>
            <p class="money">
                <span>Argent</span> : <strong>{formatMoney(data.player.money, isAdmin)}</strong> pièces d'or
            </p>
            <div class="links">
                <a class="btn btn-accent" href="{base}/combat">Vue de combat</a>
                {#if canEdit && showTransfer}
                    <a class="btn" href="{base}/inventaire">Gérer l'inventaire</a>
                {/if}
            </div>
        </div>
        {#if isDragon(character.dragon)}
            <img
                class="dragon primary-svg"
                src="/dragons/normal/{character.dragon}.svg"
                alt="Descendance de {character.dragon}"
                title="Descendance de {character.dragon}"
            />
        {/if}
    </section>

    {#if error}
        <p class="message-error" role="alert">{error}</p>
    {/if}

    {@render mjTools?.()}

    <section class="panel">
        <h2>Statistiques</h2>
        <StatsPanel {sheet} />
    </section>

    <section class="panel">
        <h2>Armure</h2>
        <EquipmentPanel inventory={data.inventory} {canEdit} />
    </section>

    <section class="panel">
        <h2>Passifs</h2>
        <PassivesPanel passives={data.passives} {canEdit} />
    </section>

    <section class="panel">
        <h2>Compétences</h2>
        <SkillsPanel skills={data.skills} stats={data.stats} />
    </section>

    <section class="panel">
        <h2>Badges</h2>
        <BadgesPanel badges={data.badges} fusions={data.fusions} badgeSkills={data.badgeSkills} />
    </section>

    <section class="panel">
        <h2>Inventaire</h2>
        <InventoryPanel inventory={data.inventory} {loads} {canEdit} {isAdmin} />
    </section>

    {#if character.description}
        <section class="panel">
            <h2>Histoire</h2>
            <p class="lore">{character.description}</p>
        </section>
    {/if}
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        width: min(70rem, 92%);
        margin: 0 auto;
        padding: 2rem 0 4rem;
    }

    .identity {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 2rem;
        margin-bottom: 4rem;
    }

    .portrait {
        width: 22rem;
        max-width: 40%;
        flex-shrink: 0;
    }

    .infos {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .infos > p > span {
        text-decoration: underline;
    }

    .links {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 1rem;
    }

    .dragon {
        width: 5rem;
        flex-shrink: 0;
    }

    h2 {
        font-size: 1.6rem;
        margin-bottom: 1rem;
    }

    .lore {
        white-space: pre-line;
        text-align: justify;
    }

    @media (max-width: 800px) {
        .identity {
            flex-direction: column;
            gap: 5rem;
            margin-bottom: 1rem;
        }

        .portrait {
            max-width: 100%;
            width: 100%;
        }

        .infos {
            width: 100%;
        }

        .dragon {
            display: none;
        }
    }
</style>
