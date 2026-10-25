<script lang="ts">
    import { afterNavigate } from "$app/navigation";
    import { page } from "$app/state";
    import NavButton from "./NavButton.svelte";
    import BurgerMenu from "./BurgerMenu.svelte";

    let { user, cardsVisible = false }: { user: App.Locals["user"]; cardsVisible?: boolean } = $props();

    let isMenuOpen = $state(false);

    afterNavigate(() => {
        isMenuOpen = false;
    });

    const isActive = (href: string) =>
        page.url.pathname === href || page.url.pathname.startsWith(href + "/");
</script>

<header class="header-desktop" class:visible={isMenuOpen}>
    <a href="/accueil" class="logo">
        <img src="/layout/Logo.svg" alt="Logo du Tout" class="primary-svg" />
    </a>
    <NavButton
        href="/personnages"
        label="Personnages"
        active={isActive("/personnages") || isActive("/bestiaire")}
    />
    <NavButton href="/outils" label="Outils" active={isActive("/outils")} />
    {#if cardsVisible}
        <NavButton href="/cartes" label="Cartes" active={isActive("/cartes")} />
    {/if}
    <NavButton href="/flux" label="Don de Flux" active={isActive("/flux")} />

    {#if user}
        <NavButton href="/profil" label="Profil" active={isActive("/profil")} />
        {#if user.isAdmin}
            <NavButton href="/admin" label="MJ" active={isActive("/admin")} />
        {/if}
        <NavButton action="/auth/logout" label="Déconnexion" />
    {:else}
        <NavButton
            href="/auth/login"
            label="Connexion"
            active={isActive("/auth/login")}
        />
    {/if}
</header>
<header class="header-mobile">
    <BurgerMenu open={isMenuOpen} click={() => (isMenuOpen = !isMenuOpen)} />
</header>

<style>
    header {
        z-index: 9999;
        background-color: var(--background);
        font-family: var(--textFont);
    }
    .header-desktop {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
        height: 91px;
        align-items: center;
        border-bottom: 2px solid var(--primary);
        background-color: var(--background);
        box-sizing: border-box;
        position: relative;
    }

    .logo {
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        position: relative;
        width: 60%;
        height: 100%;
        transition: all ease-in-out 400ms;
        font-size: 20px;
    }

    .logo > img {
        width: 100%;
        height: 80%;
        padding: 5px;
        transition: all ease-in-out 800ms;
    }

    .logo:hover > img {
        filter: invert(78%) sepia(52%) saturate(214%) hue-rotate(293deg)
            brightness(95%) contrast(88%);
    }

    .header-mobile {
        display: none;
    }

    @media screen and (max-width: 600px) {
        .header-desktop {
            display: none;
            flex-direction: column;
            position: fixed;
            top: 0;
            left: 0;
            height: auto;
            max-height: 100dvh;
            overflow-y: auto;
        }

        .header-desktop.visible {
            display: flex;
        }

        .header-mobile {
            display: flex;
            position: fixed;
            right: 25px;
            top: 35px;
            background-color: transparent;
        }

        .logo {
            border-bottom: var(--primary) 2px solid;
            width: 100%;
            height: 91px;
        }
    }
</style>
