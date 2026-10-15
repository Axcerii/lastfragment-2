<script lang="ts" module>
    export interface Shortcut {
        keys: string[];
        label: string;
    }

    // Liste unique des raccourcis : la même sert à l'aide affichée et à la documentation.
    export const PLAYER_SHORTCUTS: { title: string; items: Shortcut[] }[] = [
        {
            title: "Général",
            items: [
                { keys: ["?"], label: "Afficher cette aide" },
                { keys: ["Ctrl", "/"], label: "Afficher / masquer cette aide (même pendant la saisie)" },
                { keys: ["Échap"], label: "Désélectionner, ranger l'outil, fermer les menus" },
                { keys: ["Entrée"], label: "Écrire dans le journal" },
                { keys: ["J"], label: "Réduire / déplier le journal" },
                { keys: ["M"], label: "Couper / rétablir le son" },
            ],
        },
        {
            title: "Plateau",
            items: [
                { keys: ["+", "−"], label: "Zoomer / dézoomer" },
                { keys: ["0"], label: "Cadrer la scène" },
                { keys: ["Flèches"], label: "Déplacer d'une case le jeton sélectionné" },
                { keys: ["Tab"], label: "Sélectionner le jeton suivant" },
            ],
        },
        {
            title: "Dés et dessin",
            items: [
                { keys: ["D"], label: "Ouvrir le menu des dés" },
                { keys: ["Maj", "D"], label: "Lancer un d20 directement" },
                { keys: ["P"], label: "Crayon" },
                { keys: ["E"], label: "Gomme" },
                { keys: ["Ctrl", "Z"], label: "Annuler mon dernier trait" },
            ],
        },
    ];

    export const ADMIN_SHORTCUTS: { title: string; items: Shortcut[] }[] = [
        {
            title: "MJ : panneaux et scènes",
            items: [
                { keys: ["1", "…", "5"], label: "Onglets Jets, Jetons, Scènes, Combat, Médias" },
                { keys: ["Page ↑", "Page ↓"], label: "Scène précédente / suivante (préparation)" },
                { keys: ["A"], label: "Montrer aux joueurs la scène affichée" },
                { keys: ["G"], label: "Afficher / masquer la grille" },
                { keys: ["F"], label: "Pinceau de brouillard : révéler" },
                { keys: ["Maj", "F"], label: "Pinceau de brouillard : cacher" },
                { keys: ["[", "]", "<", ">"], label: "Taille du pinceau de brouillard" },
            ],
        },
        {
            title: "MJ : jeton sélectionné",
            items: [
                { keys: ["H"], label: "Cacher / montrer aux joueurs" },
                { keys: ["N"], label: "Cacher / montrer son nom" },
                { keys: ["S"], label: "Révéler / masquer ses stats" },
                { keys: ["O"], label: "Ajouter à / retirer de l'ordre de passage" },
                { keys: ["Ctrl", "D"], label: "Dupliquer" },
                { keys: ["Suppr"], label: "Retirer du plateau" },
            ],
        },
        {
            title: "MJ : combat",
            items: [
                { keys: ["C"], label: "Lancer / terminer le combat" },
                { keys: ["T"], label: "Au suivant dans l'ordre de passage" },
            ],
        },
    ];
</script>

<script lang="ts">
    import Modal from "$lib/components/ui/Modal.svelte";

    let { open = $bindable(false), isAdmin }: { open: boolean; isAdmin: boolean } = $props();

    let groups = $derived(isAdmin ? [...PLAYER_SHORTCUTS, ...ADMIN_SHORTCUTS] : PLAYER_SHORTCUTS);
</script>

<Modal bind:open title="Raccourcis clavier">
    <div class="groups">
        {#each groups as group (group.title)}
            <section>
                <h3>{group.title}</h3>
                <dl>
                    {#each group.items as item (item.label)}
                        <div>
                            <dt>
                                {#each item.keys as key, i (i)}
                                    {#if key === "…"}<span class="muted">à</span>{:else}<kbd>{key}</kbd>{/if}
                                {/each}
                            </dt>
                            <dd>{item.label}</dd>
                        </div>
                    {/each}
                </dl>
            </section>
        {/each}
    </div>
    <p class="muted small">Les raccourcis sont inactifs pendant la saisie dans un champ.</p>
</Modal>

<style>
    .groups {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
        gap: 1rem 1.5rem;
        max-height: 65dvh;
        overflow-y: auto;
    }

    h3 {
        font-size: 1.1rem;
        margin-bottom: 0.4rem;
        color: var(--accent);
    }

    dl {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        font-size: 0.85rem;
    }

    dl div {
        display: grid;
        grid-template-columns: 7.5rem 1fr;
        gap: 0.5rem;
        align-items: baseline;
    }

    dt {
        display: flex;
        flex-wrap: wrap;
        gap: 0.2rem;
    }

    kbd {
        font-family: monospace;
        font-size: 0.8rem;
        padding: 0.05rem 0.35rem;
        border: 1px solid var(--border);
        border-bottom-width: 2px;
        border-radius: 4px;
        background-color: rgba(255, 255, 255, 0.05);
    }

    .small {
        font-size: 0.8rem;
    }
</style>
