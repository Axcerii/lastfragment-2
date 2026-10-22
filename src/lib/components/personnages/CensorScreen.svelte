<script lang="ts">
    // Écran de censure d'une fiche « teaser » : tout est brouillé sous le header,
    // avec la citation du personnage en grand au centre.
    let { quote, name }: { quote?: string | null; name: string } = $props();

    // La fiche ne doit pas défiler derrière le brouillage.
    $effect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    });
</script>

<div class="censor" role="region" aria-label="Fiche de {name} censurée">
    <div class="neige" aria-hidden="true"></div>
    <blockquote>
        {quote || "Vous n'en savez pas encore assez sur ce personnage."}
    </blockquote>
    <a href="/personnages">Retour aux personnages</a>
</div>

<style>
    .censor {
        position: fixed;
        /* Le header (91px) reste visible et utilisable au-dessus. */
        inset: 91px 0 0 0;
        z-index: 5000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3rem;
        padding: 2rem;
        box-sizing: border-box;
        background-color: rgba(0, 0, 0, 0.95);
    }

    .neige {
        position: absolute;
        inset: 0;
        opacity: 0.2;
        background-image: url("/accueil/Neige.gif");
        pointer-events: none;
    }

    blockquote {
        position: relative;
        max-width: 60rem;
        font-family: var(--titleFont);
        font-size: 3em;
        line-height: 1.2;
        text-align: center;
        quotes: "« " " »";
    }

    blockquote::before {
        content: open-quote;
    }

    blockquote::after {
        content: close-quote;
    }

    a {
        position: relative;
        color: var(--muted);
        text-decoration: underline;
        text-underline-offset: 4px;
        transition: var(--transition);
    }

    a:hover {
        color: var(--accent);
    }

    /* Le gif animé plein écran est coûteux : on s'en passe si l'utilisateur préfère moins d'animations. */
    @media (prefers-reduced-motion: reduce) {
        .neige {
            display: none;
        }
    }

    @media screen and (max-width: 600px) {
        /* Sur mobile le header est replié : seul le bouton du menu reste au-dessus. */
        .censor {
            inset: 0;
        }

        blockquote {
            font-size: 1.8em;
        }
    }
</style>
