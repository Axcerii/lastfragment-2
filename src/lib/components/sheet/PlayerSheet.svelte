<script lang="ts">
    import type { Snippet } from "svelte";
    import BadgesPanel from "./BadgesPanel.svelte";
    import EquipmentPanel from "./EquipmentPanel.svelte";
    import InventoryPanel from "./InventoryPanel.svelte";
    import PassivesPanel from "./PassivesPanel.svelte";
    import SkillsPanel from "./SkillsPanel.svelte";
    import Checkbox from "$lib/components/Checkbox.svelte";
    import Cta from "$lib/components/Cta.svelte";
    import StatsPanel from "$lib/components/game/StatsPanel.svelte";
    import CharacterPlusCountry from "$lib/components/personnages/CharacterPlusCountry.svelte";
    import InfoList from "$lib/components/ui/InfoList.svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import SectionTitle from "$lib/components/ui/SectionTitle.svelte";
    import { formatMoney } from "$lib/game/inventory";
    import { COUNTRY_LABELS, RACE_LABELS, parseDragons } from "$lib/game/labels";
    import { containerLoads, sheetOf } from "$lib/game/sheet";
    import type { SheetData } from "$lib/server/sheet";

    // Fiche de jeu d'un joueur, d'après les maquettes Figma « Profil Desktop » et « Profil Mobile ».
    // Sert à /profil et à la vue MJ d'un joueur. L'armure et l'inventaire s'ouvrent en panneau latéral.
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
    let dragons = $derived(parseDragons(character.dragon));
    let sheet = $derived(sheetOf(data.stats, data.inventory, data.passives));
    let loads = $derived(containerLoads(data.stats, data.inventory));
    let money = $derived(formatMoney(data.player.money, isAdmin));

    let armorOpen = $state(false);
    let bagOpen = $state(false);
</script>

<div class="profil">
    <aside class="toolbar" aria-label="Accès rapides">
        <p class="money">
            <span class="money-long">{money} Pièces</span>
            <!-- En mobile, le S long (ſ), symbole des sous médiévaux, remplace « Pièces ». -->
            <span class="money-short" title="{money} pièces">
                {money}<span class="long-s" aria-label="pièces">ſ</span>
            </span>
        </p>
        <Checkbox
            type="checkbox"
            label="Armure"
            icon="/profil/armure.png"
            controls="panneau-armure"
            bind:checked={armorOpen}
        />
        <Checkbox
            type="checkbox"
            label="Inventaire"
            icon="/profil/sac.png"
            controls="panneau-inventaire"
            bind:checked={bagOpen}
        />
        <div class="combat">
            <Cta text="Vue de combat" dragon="Goliath" border="Pura" href="{base}/combat" />
        </div>
    </aside>

    <main>
        <div class="identity">
            <div class="portrait">
                <CharacterPlusCountry
                    compact
                    image={character.image}
                    name={character.name}
                    title={character.title ?? ""}
                    country={character.country}
                />
            </div>
            <div class="infos">
                <InfoList
                    items={[
                        { label: "Flux", value: character.flux },
                        { label: "Pays", value: COUNTRY_LABELS[character.country] },
                        { label: "Race", value: RACE_LABELS[character.race] },
                        { label: "Métier", value: character.job },
                    ]}
                />
                {#if dragons.length > 0}
                    <div class="heritage">
                        <p class="heritage-label"><u>Héritages</u> :</p>
                        <div class="dragons" class:many={dragons.length > 1}>
                            {#each dragons as dragon (dragon)}
                                <span
                                    class="dragon"
                                    role="img"
                                    aria-label="Héritage de {dragon}"
                                    title="Héritage de {dragon}"
                                    style="--icon: url('/dragons/normal/{dragon}.svg')"
                                ></span>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        </div>

        {#if error}
            <p class="message-error" role="alert">{error}</p>
        {/if}

        {@render mjTools?.()}

        <StatsPanel {sheet} />

        <section>
            <SectionTitle>Passifs</SectionTitle>
            <PassivesPanel passives={data.passives} {canEdit} />
        </section>

        <section>
            <SectionTitle>Compétences</SectionTitle>
            <SkillsPanel skills={data.skills} stats={data.stats} />
        </section>

        <section>
            <SectionTitle>Badges</SectionTitle>
            <BadgesPanel badges={data.badges} fusions={data.fusions} badgeSkills={data.badgeSkills} />
        </section>

        {#if character.description}
            <section>
                <SectionTitle>Histoire</SectionTitle>
                <p class="lore">{character.description}</p>
            </section>
        {/if}
    </main>
</div>

<Modal side id="panneau-armure" title="Armure" bind:open={armorOpen}>
    <EquipmentPanel inventory={data.inventory} {canEdit} />
</Modal>

<Modal side id="panneau-inventaire" title="Inventaire" bind:open={bagOpen}>
    <InventoryPanel inventory={data.inventory} {loads} {canEdit} {isAdmin} />
    {#if canEdit && showTransfer}
        <a class="btn" href="{base}/inventaire">Déplacer des objets</a>
    {/if}
</Modal>

<style>
    .profil {
        position: relative;
        padding: 38px 1rem 4rem;
    }

    /* Desktop : colonne d'accès rapides à gauche, comme dans la maquette. */
    .toolbar {
        position: absolute;
        top: 33px;
        left: 50px;
        width: 117px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
    }

    .money {
        font-size: 20px;
        text-align: center;
        white-space: nowrap;
    }

    .money-short {
        display: none;
    }

    /* El Messiri dessine le ſ comme un f : EB Garamond italique lui garde sa longue descente. */
    .long-s {
        margin-left: 0.1em;
        font-family: var(--titleFont);
        font-style: italic;
        font-size: 1.35em;
        line-height: 0;
        color: var(--secondary);
    }

    .combat {
        width: 100%;
        margin-top: 0.5rem;
        font-size: 16px;
    }

    .combat :global(.cta) {
        height: auto;
        min-height: 48px;
        padding: 0.4rem;
        font-size: 18px;
        line-height: 1.1;
    }

    main {
        display: flex;
        flex-direction: column;
        gap: 61px;
        width: min(803px, 100%);
        margin: 0 auto;
    }

    .identity {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .portrait {
        flex: 1;
        min-width: 0;
    }

    .infos {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 475px;
        padding-right: 60px;
        box-sizing: border-box;
        flex-shrink: 0;
    }

    .heritage-label {
        display: none;
        font-size: 20px;
    }

    /* Un logo par dragon hérité, empilés ; plus petits quand il y en a plusieurs. */
    .dragons {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
    }

    .dragon {
        display: block;
        width: 87px;
        height: 87px;
        background-color: var(--primary);
        mask: var(--icon) center / contain no-repeat;
        -webkit-mask: var(--icon) center / contain no-repeat;
    }

    .many .dragon {
        width: 64px;
        height: 64px;
    }

    section {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .lore {
        white-space: pre-line;
        text-align: justify;
    }

    /* Écran moyen : la colonne d'accès rapides passe en rangée au-dessus du contenu. */
    @media (max-width: 1150px) {
        .toolbar {
            position: static;
            width: min(803px, 100%);
            margin: 0 auto 2rem;
            flex-direction: row;
            justify-content: flex-start;
        }

        .combat {
            width: auto;
            margin: 0 0 0 auto;
        }

        .combat :global(.cta) {
            padding: 0 1.25rem;
        }
    }

    @media (max-width: 800px) {
        .identity {
            flex-direction: column;
        }

        .infos {
            width: 100%;
            padding: 0;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
        }

        .heritage {
            align-self: stretch;
        }

        .heritage-label {
            display: block;
        }

        .dragons {
            flex-direction: row;
            justify-content: center;
            margin-top: 12px;
        }
    }

    /* Mobile : rangée d'en-tête « argent + cases », le menu burger restant à droite. */
    @media (max-width: 600px) {
        .profil {
            padding: 35px 35px 3rem;
        }

        /* Grille plutôt que rangée : un gros montant rétrécit sa colonne au lieu de faire
           passer l'armure et le sac à la ligne. */
        .toolbar {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto auto;
            align-items: center;
            gap: 1rem;
            margin-bottom: 3rem;
            padding-right: 80px;
            box-sizing: border-box;
        }

        .money {
            font-size: 18px;
            text-align: left;
            white-space: normal;
            overflow-wrap: anywhere;
        }

        .money-long {
            display: none;
        }

        .money-short {
            display: inline;
        }

        /* La vue de combat n'est pas dans la maquette mobile : elle passe sous la rangée. */
        .combat {
            grid-column: 1 / -1;
            margin: 0;
        }

        main {
            gap: 35px;
        }
    }

    /* Très petits écrans : marges et espacements resserrés pour garder l'argent lisible. */
    @media (max-width: 380px) {
        .profil {
            padding-left: 20px;
            padding-right: 20px;
        }

        .toolbar {
            gap: 0.5rem;
        }
    }
</style>
