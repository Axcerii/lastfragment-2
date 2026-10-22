<script lang="ts">
    import { onMount } from "svelte";
    import Board from "$lib/components/table/Board.svelte";
    import LogPanel from "$lib/components/table/LogPanel.svelte";
    import OrderStrip from "$lib/components/table/OrderStrip.svelte";
    import { TableClient } from "$lib/table/client.svelte";

    let { data } = $props();

    const client = new TableClient(data.sessionId, data.key);
    onMount(() => {
        client.connect();
        return () => client.disconnect();
    });

    let view = $derived(client.view);
    let scene = $derived(view?.scenes[0] ?? null);
</script>

<svelte:head>
    <title>Vue OBS : Last Fragment</title>
</svelte:head>

<div class="obs" class:both={data.board && data.log}>
    {#if data.board}
        <section class="board">
            {#if view && scene}
                <Board {scene} tokens={view.tokens} readonly turn={view.session.turn} />
                <div class="order">
                    <OrderStrip
                        order={view.session.order}
                        tokens={view.tokens}
                        turn={view.session.turn}
                        combat={view.session.combat}
                    />
                </div>
                {#if view.session.showcase}
                    <img class="showcase" src={view.session.showcase} alt="" />
                {/if}
            {/if}
        </section>
    {/if}
    {#if data.log}
        <section class="log">
            <LogPanel {client} readonly />
        </section>
    {/if}
</div>

<style>
    :global(html:has(.obs)) {
        background: #000;
    }

    .obs {
        display: grid;
        grid-template-columns: 1fr;
        height: 100dvh;
        overflow: hidden;
    }

    .obs.both {
        grid-template-columns: 1fr 22rem;
    }

    .board {
        position: relative;
        overflow: hidden;
    }

    .order {
        position: absolute;
        top: 0.75rem;
        left: 0.75rem;
        right: 0.75rem;
        z-index: 30;
    }

    .showcase {
        position: absolute;
        inset: 0;
        z-index: 40;
        width: 100%;
        height: 100%;
        object-fit: contain;
        background-color: rgba(0, 0, 0, 0.85);
    }

    .log {
        min-height: 0;
        background-color: rgba(20, 20, 20, 0.92);
    }
</style>
