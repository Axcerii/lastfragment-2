<script lang="ts">
    let { open = false, click }: { open?: boolean; click: () => void } = $props();
</script>

<button
    aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
    aria-expanded={open}
    onclick={click}
    class:open
>
    <span class="line"></span>
    <span class="line"></span>
    <span class="line"></span>
</button>

<style>
    button {
        width: 67px;
        height: 67px;
        background-color: var(--background);
        border: 1px solid var(--accent);
        border-radius: var(--radius);
        box-sizing: border-box;
        padding: 10px;

        display: flex;
        flex-direction: column;
        justify-content: space-between;
        transition: all ease-in-out 400ms;
    }

    button.open {
        border: var(--primary) 2px solid;
    }

    .line {
        width: 100%;
        height: 7px;
        background-color: var(--primary);
        border-radius: var(--radius);
        margin: auto;
        transition: all ease-in-out 400ms;
    }

    .open .line {
        background-color: var(--accent);
    }

    .open .line:nth-child(1) {
        transform: rotate(45deg);
        margin-bottom: -25px;
    }

    .open .line:nth-child(2) {
        transform: rotate(-45deg);
    }

    .open .line:nth-child(3) {
        display: none;
    }
</style>
