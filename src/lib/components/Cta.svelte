<script lang="ts">
    import { dragonVars, isDarkDragon } from "$lib/game/labels";

    // Bouton principal au fond d'un dragon. Avec `href` c'est un lien ; sans `onClick`, il valide le formulaire parent.
    // Le texte et le filigrane prennent l'encre lisible sur la couleur du dragon.
    let {
        dragon = "Artrish",
        border = "Yinva",
        text,
        onClick,
        href,
        disabled = false,
    }: {
        dragon?: string;
        border?: string;
        text: string;
        onClick?: () => void;
        href?: string;
        disabled?: boolean;
    } = $props();

    let style = $derived(`${dragonVars(dragon)}; border-color: var(--${border});`);
    let dark = $derived(isDarkDragon(dragon));
</script>

{#if href}
    <a class="cta" class:dark {href} {style}>
        <img src="/dragons/normal/{dragon}.svg" alt="" />
        {text}
    </a>
{:else}
    <button
        class="cta"
        class:dark
        type={onClick ? "button" : "submit"}
        {style}
        onclick={onClick}
        {disabled}
    >
        <img src="/dragons/normal/{dragon}.svg" alt="" />
        {text}
    </button>
{/if}

<style>
    .cta {
        box-sizing: border-box;
        font-size: 20px;
        text-align: center;
        width: 100%;
        border-radius: var(--radius);
        height: 48px;
        border: 1px solid var(--Yinva);
        background-color: var(--c);
        color: var(--ink);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        position: relative;
        font-family: var(--textFont);
        overflow: hidden;

        transition: all ease-in-out 200ms;
    }

    .cta:hover {
        opacity: 0.8;
    }

    .cta:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    img {
        position: absolute;
        opacity: 0.3;
        height: 100%;
        width: auto;
        top: 0;
        right: 20%;
    }

    /* Les logos sont tracés en noir : on les inverse sur les dragons sombres. */
    .dark img {
        filter: invert(1);
    }
</style>
