<script lang="ts">
    import { untrack } from "svelte";

    // Date et heure saisies à l'heure du MJ, envoyées en ISO (UTC) : le serveur, lui, tourne
    // souvent à l'heure UTC et lirait mal une heure locale sans fuseau.
    let { name, value = null }: { name: string; value?: string | null } = $props();

    function local(iso: string | null) {
        if (!iso) return "";
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    let text = $state(untrack(() => local(value)));
    let iso = $derived(text ? new Date(text).toISOString() : "");
</script>

<input type="datetime-local" bind:value={text} />
<input type="hidden" {name} value={iso} />
