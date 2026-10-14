<script lang="ts">
    // Bouton principal au fond d'un dragon. Avec `href` c'est un lien ; sans `onClick`, il valide le formulaire parent.
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
</script>

{#if href}
    <a class="cta" {href} style="background-color: var(--{dragon}); border-color: var(--{border});">
        <img src="/dragons/normal/{dragon}.svg" alt="" />
        {text}
    </a>
{:else}
    <button
        class="cta"
        type={onClick ? "button" : "submit"}
        style="background-color: var(--{dragon}); border-color: var(--{border});"
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
</style>
