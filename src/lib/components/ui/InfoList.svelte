<script lang="ts">
    // Liste « Libellé : valeur » de la maquette, libellés soulignés. Les valeurs vides sont omises.
    let { items }: { items: { label: string; value: string | null | undefined }[] } = $props();

    let shown = $derived(items.filter((item) => item.value));
</script>

<dl>
    {#each shown as item (item.label)}
        <div>
            <dt>{item.label}</dt>
            <dd>&nbsp;: {item.value}</dd>
        </div>
    {/each}
</dl>

<style>
    dl {
        display: flex;
        flex-direction: column;
        font-size: 20px;
    }

    div {
        display: flex;
        flex-wrap: wrap;
    }

    dt {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
</style>
