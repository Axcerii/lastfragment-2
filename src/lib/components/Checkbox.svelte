<script lang="ts">
    let {
        svg = "dragons/normal/Artrish.svg",
        checked = false,
        id = "",
        type = "radio",
        name = "",
    } = $props();
</script>

<label class="checkbox-container">
    <input {type} {id} {checked} {name} class="checkbox" />
    <img src={svg} alt="" />
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
        object-fit: cover;
        filter: invert(90%) sepia(13%) saturate(311%) hue-rotate(52deg)
            brightness(101%) contrast(81%);
        transition: var(--transition);
    }

    .checkbox {
        display: none;
    }

    .checkbox:checked + img {
        filter: invert(78%) sepia(52%) saturate(214%) hue-rotate(293deg)
            brightness(95%) contrast(88%);
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
