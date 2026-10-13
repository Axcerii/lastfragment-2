<script lang="ts">
    // Case à icône. En radio, `group` porte la valeur choisie ; en checkbox, `checked` l'état.
    let {
        svg = "/dragons/normal/Artrish.svg",
        label,
        type = "radio",
        name = "",
        value = "",
        group = $bindable(),
        checked = $bindable(false),
    }: {
        svg?: string;
        label: string;
        type?: "radio" | "checkbox";
        name?: string;
        value?: string;
        group?: string;
        checked?: boolean;
    } = $props();
</script>

<label class="checkbox-container" title={label}>
    {#if type === "radio"}
        <input type="radio" {name} {value} bind:group class="checkbox" />
    {:else}
        <input type="checkbox" {name} bind:checked class="checkbox" />
    {/if}
    <img src={svg} alt={label} />
</label>

<style>
    .checkbox-container {
        position: relative;
        display: flex;
        border: 1px solid var(--accent);
        border-radius: var(--radius);
        width: 100px;
        height: 100px;
        box-sizing: border-box;
        padding: 2px;

        cursor: pointer;
    }

    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: invert(90%) sepia(13%) saturate(311%) hue-rotate(52deg)
            brightness(101%) contrast(81%);
        transition: var(--transition);
    }

    .checkbox {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }

    .checkbox:checked + img {
        filter: invert(78%) sepia(52%) saturate(214%) hue-rotate(293deg)
            brightness(95%) contrast(88%);
    }

    .checkbox:focus-visible + img {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
    }

    .checkbox-container:hover > img {
        filter: invert(78%) sepia(52%) saturate(214%) hue-rotate(293deg)
            brightness(95%) contrast(88%);
    }

    @media (max-width: 600px) {
        .checkbox-container {
            width: 67px;
            height: 67px;
        }
    }
</style>
