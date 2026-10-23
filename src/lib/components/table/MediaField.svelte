<script lang="ts">
    // Champ « média » : montre le choix actuel et ouvre la fenêtre de recherche au clic.
    import { AUDIO_KINDS, isVideo, type Asset, type AssetKind } from "$lib/table/types";
    import MediaPicker from "./MediaPicker.svelte";

    let {
        label,
        kind,
        assets,
        value,
        none,
        bare = false,
        onchange,
    }: {
        /** Libellé du champ et titre de la fenêtre de choix. */
        label: string;
        kind: AssetKind;
        assets: Asset[];
        /** Url choisie, ou null. */
        value: string | null;
        /** Libellé de l'absence de choix (« Aucun »). */
        none: string;
        /** Sans libellé visible, quand un titre le précède déjà. */
        bare?: boolean;
        onchange: (asset: Asset | null) => void;
    } = $props();

    let open = $state(false);
    let asset = $derived(value ? assets.find((a) => a.url === value) : undefined);
    let showImage = $derived(Boolean(value) && !AUDIO_KINDS.includes(kind));
</script>

<div class="field">
    {#if !bare}<span>{label}</span>{/if}
    <div class="value">
        <button class="pick" onclick={() => (open = true)} title="Choisir dans la médiathèque">
            {#if showImage && value}
                {#if isVideo(value)}
                    <video src={value} muted playsinline preload="metadata"></video>
                {:else}
                    <img src={value} alt="" />
                {/if}
            {/if}
            <span class="name" class:muted={!value}>
                {value ? (asset?.name ?? "Média retiré de la médiathèque") : none}
            </span>
            <span class="action">Choisir…</span>
        </button>
        {#if value}
            <button class="btn btn-small clear" onclick={() => onchange(null)} aria-label="Retirer : {label}" title={none}>✕</button>
        {/if}
    </div>
</div>

<MediaPicker bind:open title={label} {kind} {assets} current={value} {none} onpick={onchange} />

<style>
    .field {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        font-size: 0.8rem;
    }

    .value {
        display: flex;
        gap: 0.35rem;
    }

    .pick {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-height: 34px;
        padding: 0.2rem 0.5rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background-color: rgba(255, 255, 255, 0.04);
        color: var(--foreground);
        font-size: 15px;
        text-align: left;
    }

    .pick:hover {
        border-color: var(--primary);
    }

    .pick img,
    .pick video {
        width: 2.6rem;
        height: 1.9rem;
        flex-shrink: 0;
        object-fit: cover;
        border-radius: 3px;
        background-color: #111;
    }

    .name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .action {
        flex-shrink: 0;
        font-size: 0.8rem;
        color: var(--accent);
    }

    .clear {
        min-height: 34px;
        width: 34px;
        padding: 0;
    }
</style>
