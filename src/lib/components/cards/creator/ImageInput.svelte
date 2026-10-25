<script lang="ts">
    // Champ de formulaire pour une image prise dans la bibliothèque (logo, bannière, paquet).
    import ImageLibrary, { thumbOf } from "./ImageLibrary.svelte";

    let { name, value = $bindable(null), label }: { name: string; value?: string | null; label: string } = $props();

    let open = $state(false);
</script>

<div class="image-input">
    <input type="hidden" {name} value={value ?? ""} />
    {#if value}
        <img src={value.startsWith("/uploads/cartes/rendus/") ? value : thumbOf(value)} alt="" />
    {:else}
        <span class="empty">Aucune</span>
    {/if}
    <span class="label">{label}</span>
    <button type="button" class="btn btn-small" onclick={() => (open = true)}>{value ? "Changer" : "Choisir"}</button>
    {#if value}<button type="button" class="btn btn-small btn-danger" onclick={() => (value = null)}>Retirer</button>{/if}
</div>

<ImageLibrary bind:open title={label} current={value} onpick={(u) => (value = u)} />

<style>
    .image-input {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    img,
    .empty {
        width: 48px;
        height: 48px;
        object-fit: contain;
        border-radius: var(--radius);
        border: 1px solid var(--border);
        background: #2a2a2a;
    }

    .empty {
        display: grid;
        place-items: center;
        font-size: 0.6rem;
        color: var(--muted);
    }

    .label {
        font-size: 0.85rem;
        min-width: 5rem;
    }
</style>
