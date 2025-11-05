<script lang="ts">
    let { click } = $props();

    let line = $state(false);

    function toggleAnimation (){
        click();
        line = !line;
    }
</script>

<style>
    button{
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

    .line{
        width: 100%;
        height: 7px;
        background-color: var(--primary);
        border-radius: var(--radius);
        margin: auto;
        transition: all ease-in-out 400ms;
    }
</style>

<button aria-label="Ouvrir Menu" onclick={toggleAnimation} style="{line ? 'border: var(--primary) 2px solid' : ''}">
    <div class="line" style="{line ? 'transform: rotate(45deg); margin-bottom: -25px; background-color: var(--accent)': ''}"></div>
    <div class="line" style="{line ? 'transform: rotate(-45deg); background-color: var(--accent)': ''}"></div>
    <div class="line" style="{line ? 'display: none': ''}"></div>
</button>


