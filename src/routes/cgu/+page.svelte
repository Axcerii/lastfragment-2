<script lang="ts">
    import PatternBackground from "$lib/components/layout/PatternBackground.svelte";

    let { data } = $props();

    let contact = $derived(data.contact);
    const UPDATED = "22 novembre 2026";
</script>

<svelte:head>
    <title>Conditions générales d'utilisation : Last Fragment</title>
    <meta name="description" content="Conditions générales d'utilisation, données personnelles et cookies du site Last Fragment." />
</svelte:head>

<PatternBackground />

{#snippet mail()}
    {#if contact}
        <a href="mailto:{contact}">{contact}</a>
    {:else}
        <em>adresse bientôt indiquée ici</em>
    {/if}
{/snippet}

<main>
    <header>
        <h1>Conditions générales d'utilisation</h1>
        <p class="updated">Dernière mise à jour : {UPDATED}</p>
    </header>

    <section>
        <h2>1. Objet</h2>
        <p>
            Last Fragment est le site compagnon d'un jeu de rôle amateur : fiches de personnages, bestiaire, outils de
            jeu et contenus de son univers. Il est gratuit, sans publicité et sans abonnement. Les présentes conditions
            encadrent son utilisation ; naviguer sur le site vaut acceptation de ces conditions.
        </p>
    </section>

    <section>
        <h2>2. Contact</h2>
        <p>Pour toute question, demande sur vos données ou signalement d'un contenu : {@render mail()}.</p>
    </section>

    <section>
        <h2>3. Accès au site</h2>
        <p>
            Le site est accessible à tous. Certaines parties (fiche de jeu, inventaire, table de jeu…) demandent un
            compte. Le site est fourni « en l'état » : il peut être modifié, interrompu ou fermé à tout moment,
            notamment pour maintenance, sans préavis.
        </p>
    </section>

    <section>
        <h2>4. Compte</h2>
        <p>
            Vos identifiants sont personnels : gardez votre mot de passe secret, toute action faite depuis votre compte
            est réputée faite par vous. Si vous pensez que votre compte n'est plus sûr, prévenez le maître du jeu (MJ)
            ou écrivez à l'adresse de contact. Le MJ peut suspendre ou supprimer un compte utilisé contrairement aux
            présentes conditions.
        </p>
    </section>

    <section>
        <h2>5. Contenus proposés par les visiteurs</h2>
        <p>
            Le créateur de personnages permet de proposer un personnage ou un monstre (nom, description, image,
            pseudo). En envoyant un contenu, vous garantissez en détenir les droits, ou avoir l'accord de son auteur,
            et qu'il ne porte atteinte à personne (contenu illicite, haineux, diffamatoire ou sexuellement explicite,
            notamment). Vous autorisez gratuitement sa publication et son adaptation sur le site pour les besoins du
            jeu. Le MJ accepte, modifie ou refuse librement chaque proposition et peut retirer à tout moment un contenu
            publié.
        </p>
        <p>
            Un contenu qui vous semble illicite peut être signalé à l'adresse de contact ; il sera examiné et retiré
            rapidement s'il y a lieu.
        </p>
    </section>

    <section>
        <h2>6. Propriété intellectuelle</h2>
        <p>
            L'univers de Last Fragment, ses textes, son code et ses éléments graphiques sont protégés par le droit
            d'auteur. Les illustrations restent la propriété de leurs artistes, crédités sur les fiches lorsqu'ils sont
            connus (ligne « Artiste »). Toute reproduction ou réutilisation en dehors d'un usage personnel demande une
            autorisation préalable. Un artiste qui souhaite être crédité autrement, ou voir son œuvre retirée, peut
            écrire à l'adresse de contact.
        </p>
    </section>

    <section>
        <h2>7. Données personnelles</h2>
        <p>Le site ne collecte que ce dont il a besoin pour fonctionner :</p>
        <ul>
            <li>
                pour un compte : le nom d'utilisateur, le mot de passe (enregistré sous une forme chiffrée
                irréversible : personne ne peut le lire, pas même le MJ) et les données de jeu (fiche, inventaire,
                résultats des mini-jeux, historique de la table de jeu…) ;
            </li>
            <li>pour une proposition faite avec le créateur : le pseudo indiqué et le contenu envoyé ;</li>
            <li>
                l'adresse IP, gardée en mémoire quelques minutes seulement pour limiter les abus (tentatives de
                connexion ou envois répétés) ; le site ne l'enregistre pas dans sa base de données.
            </li>
        </ul>
        <p>
            Ces données servent uniquement au jeu. Elles ne sont ni vendues, ni louées, ni cédées, ni utilisées à des
            fins publicitaires ou de profilage. Elles sont conservées tant que le compte existe et supprimées sur
            simple demande.
        </p>
        <p>
            Les polices d'écriture du site sont chargées depuis Google Fonts : votre navigateur contacte alors les
            serveurs de Google, qui reçoivent votre adresse IP. Aucun autre service extérieur n'est appelé et aucun
            outil de mesure d'audience n'est utilisé. Les liens vers d'autres sites (artistes, histoires…) mènent
            vers des pages qui ont leurs propres règles.
        </p>
        <p>
            Conformément au RGPD et à la loi Informatique et Libertés, vous pouvez accéder à vos données, les faire
            rectifier ou effacer, ou vous opposer à leur traitement en écrivant à {@render mail()}. Vous pouvez aussi
            adresser une réclamation à la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">cnil.fr</a>).
        </p>
    </section>

    <section id="cookies">
        <h2>8. Cookies et stockage local</h2>
        <p>
            Le site n'utilise <strong>aucun cookie publicitaire, de mesure d'audience ou de traçage</strong>. Il ne
            dépose que ce qui est nécessaire à son fonctionnement ou à vos préférences, ce qui ne demande pas de
            consentement (article 82 de la loi Informatique et Libertés) :
        </p>
        <ul>
            <li>un cookie de session, posé seulement quand vous vous connectez, pour vous garder connecté (30 jours) ;</li>
            <li>un cookie qui retient une étape franchie dans le Don de flux (1 an) ;</li>
            {#if data.cardsVisible}
                <li>un cookie qui rouvre le dernier album de cartes consulté (1 an) ;</li>
            {/if}
            <li>
                le stockage local du navigateur, pour vos filtres, votre progression dans le Don de flux et le Lastdle,
                les réglages de la table de jeu (volume, position des fenêtres) et la fermeture du bandeau
                d'information. Ces données restent sur votre appareil.
            </li>
        </ul>
        <p>
            Vous pouvez tout effacer depuis les réglages de votre navigateur : vous serez simplement déconnecté et vos
            préférences reviendront à zéro.
        </p>
    </section>

    <section>
        <h2>9. Responsabilité</h2>
        <p>
            Le site est un projet amateur entretenu bénévolement. Tout est fait pour qu'il fonctionne et que les
            données soient sauvegardées, sans pouvoir garantir l'absence d'erreur, d'interruption ou de perte.
        </p>
    </section>

    <section>
        <h2>10. Modification des conditions</h2>
        <p>
            Ces conditions peuvent évoluer. La version en ligne est celle qui s'applique ; sa date de mise à jour est
            indiquée en haut de page.
        </p>
    </section>

    <section>
        <h2>11. Droit applicable</h2>
        <p>
            Ces conditions sont soumises au droit français. En cas de désaccord, une solution amiable sera recherchée
            avant toute autre démarche.
        </p>
    </section>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        max-width: 46rem;
        margin: 3rem auto 4rem;
        padding: 0 1rem;
        line-height: 1.6;
    }

    h1 {
        font-size: 2.5rem;
        line-height: 1.2;
    }

    .updated {
        margin-top: 0.5rem;
        color: var(--muted);
    }

    section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    h2 {
        font-size: 1.4rem;
        color: var(--primary);
    }

    ul {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        padding-left: 1.25rem;
        list-style: disc;
    }

    a {
        color: var(--accent);
        text-decoration: underline;
        overflow-wrap: anywhere;
    }

    strong {
        font-weight: 700;
    }

    em {
        font-style: italic;
        color: var(--muted);
    }

    @media only screen and (max-width: 600px) {
        /* Le titre passe sous le bouton du menu, fixé en haut à droite. */
        main {
            margin-top: 7rem;
        }

        h1 {
            font-size: 2rem;
        }
    }
</style>
