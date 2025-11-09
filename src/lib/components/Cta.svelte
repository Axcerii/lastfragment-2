<script lang="ts">
    let {dragon = 'Artrish', border = 'Yinva', text} = $props();
</script>

<button  style="background-color: var(--{dragon}); border-color: var(--{border});">
    <img src="/dragons/normal/{dragon}.svg" alt="">
    {text}
</button>

<style>
    button{
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

        transition: all ease-in-out 200ms;
    }

    button:hover{
        opacity: 0.8;
    }

    img{
        position: absolute;
        opacity: 0.17;
        height: 100%;
        width: auto;
        top: 0;
        right: 20%;
    }
</style>