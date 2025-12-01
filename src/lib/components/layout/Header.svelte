<script lang="ts">
    import NavButton from "./NavButton.svelte";
    import BurgerMenu from "./BurgerMenu.svelte";

    let { connected } = $props();

    let isMenuOpen = $state(false);

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
    }
</script>

<style>
    header{
        z-index: 1000;
        background-color: var(--background);
        font-family: var(--textFont);
    }
    .header-desktop{
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
        height: 91px;
        align-items: center;
        border-bottom: 2px solid var(--primary);
        background-color: var(--background);
        box-sizing: border-box;
    }

    .logo{
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

    .logo > img{
        width: 100%;
        height: 80%;
        padding: 5px;
        transition: all ease-in-out 800ms;
    }

    .logo:hover > img{
        filter: invert(78%) sepia(52%) saturate(214%) hue-rotate(293deg) brightness(95%) contrast(88%);
    }

    .header-mobile{
        display: none;
    }

    @media screen and (max-width: 600px) {
        .header-desktop{
            display: none;
            flex-direction: column;
            position: fixed;
            top: 0;
            left: 0;
        }

        .header-desktop.visible{
            display: flex;
        }

        .header-mobile{
            display: flex;
            position: fixed;
            right: 25px;
            top: 35px;
        }

        .logo{
            border-bottom: var(--primary) 2px solid;
        }
    }
</style>

<header class="header-desktop" class:visible={isMenuOpen} data-sveltekit-reload>
    <a href="/" class="logo">
        <img src="/layout/Logo.svg" alt="Logo du Tout" class="primary-svg">
    </a>
    <NavButton
        href="/accueil"
        label="Accueil"
        active={false}
    />
    <NavButton
        href="/personnages"
        label="Personnages"
        active={false}
    />
    <NavButton
        href="/histoires"
        label="Histoires"
        active={false}
    />
    <NavButton
        href="/flux"
        label="Don de Flux"
        active={false}
    />
    <NavButton
        href="/outils"
        label="Outils"
        active={false}
    />

    {#if connected}
        <NavButton
            href="/profil"
            label="Profil"
            active={false}
        />
    {:else}    
        <NavButton
        href="/auth/login"
        label="Connexion"
        active={false}
        />
    {/if}
</header>
<header class="header-mobile">
    <BurgerMenu click={toggleMenu} />
</header>