<script lang="ts">
    // Sans `onClick`, le bouton valide le formulaire qui le contient.
    let {
        dragon = "Artrish",
        border = "Yinva",
        text,
        onClick,
        disabled = false,
    }: {
        dragon?: string;
        border?: string;
        text: string;
        onClick?: () => void;
        disabled?: boolean;
    } = $props();
</script>

<button
    type={onClick ? "button" : "submit"}
    style="background-color: var(--{dragon}); border-color: var(--{border});"
    onclick={onClick}
    {disabled}
>
    <img src="/dragons/normal/{dragon}.svg" alt="" />
    {text}
</button>

<style>
    button {
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

    button:hover {
        opacity: 0.8;
    }

    button:disabled {
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
