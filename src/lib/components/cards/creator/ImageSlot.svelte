<script lang="ts">
    // Une image de la carte (sujet ou fond) : choix dans la bibliothèque, ajustement de sa place.
    // Le cadrage fin se fait aussi directement sur l'aperçu (bouton « Cadrer sur l'aperçu »).
    import type { CardImage } from "$lib/cards/types";
    import ImageLibrary, { thumbOf } from "./ImageLibrary.svelte";

    let {
        image = $bindable(),
        title,
        framing = false,
        onframe,
    }: {
        image: CardImage | null;
        title: string;
        /** Cadrage à la main en cours sur cette image. */
        framing?: boolean;
        onframe?: () => void;
    } = $props();

    let library = $state(false);

    function pick(url: string) {
        // L'aperçu affiche le fichier d'origine ; le serveur en calcule les copies WebP à l'enregistrement.
        image = image
            ? { ...image, src: url, large: url, small: url }
            : { src: url, large: url, small: url, x: 0, y: 0, zoom: 1, fit: "cover" };
    }

    function reset() {
        if (image) image = { ...image, x: 0, y: 0, zoom: 1 };
    }
</script>

<div class="slot">
    <div class="head">
        {#if image}
            <img src={image.src.startsWith("/uploads/cartes/rendus/") ? image.src : thumbOf(image.src)} alt="" />
        {:else}
            <span class="empty">Aucune image</span>
        {/if}
        <div class="actions">
            <button type="button" class="btn btn-small btn-accent" onclick={() => (library = true)}>
                {image ? "Changer" : "Choisir"}
            </button>
            {#if image}
                <button type="button" class="btn btn-small" class:framing onclick={onframe}>
                    {framing ? "Cadrage en cours…" : "Cadrer sur l’aperçu"}
                </button>
                <button type="button" class="btn btn-small btn-danger" onclick={() => (image = null)}>Retirer</button>
            {/if}
        </div>
    </div>

    {#if image}
        <div class="fit" role="radiogroup" aria-label="Remplissage">
            <button type="button" role="radio" aria-checked={image.fit === "cover"} class:on={image.fit === "cover"} onclick={() => image && (image.fit = "cover")}>
                Remplir
            </button>
            <button type="button" role="radio" aria-checked={image.fit === "contain"} class:on={image.fit === "contain"} onclick={() => image && (image.fit = "contain")}>
                Image entière
            </button>
            <button type="button" class="reset" onclick={reset}>Recentrer</button>
        </div>
        <label>
            <span>Zoom <output>{image.zoom.toFixed(2)}×</output></span>
            <input type="range" min="0.2" max="5" step="0.01" bind:value={image.zoom} />
        </label>
        <label>
            <span>Horizontal <output>{Math.round(image.x)} %</output></span>
            <input type="range" min="-100" max="100" step="0.5" bind:value={image.x} />
        </label>
        <label>
            <span>Vertical <output>{Math.round(image.y)} %</output></span>
            <input type="range" min="-100" max="100" step="0.5" bind:value={image.y} />
        </label>
    {/if}
</div>

<ImageLibrary bind:open={library} {title} current={image?.src ?? null} onpick={pick} />

<style>
    .slot {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }

    .head {
        display: flex;
        gap: 0.75rem;
        align-items: center;
    }

    .head img,
    .empty {
        width: 72px;
        height: 72px;
        flex-shrink: 0;
        object-fit: contain;
        border-radius: var(--radius);
        border: 1px solid var(--border);
        background: repeating-conic-gradient(#2a2a2a 0 25%, #333 0 50%) 0 0 / 12px 12px;
    }

    .empty {
        display: grid;
        place-items: center;
        font-size: 0.65rem;
        color: var(--muted);
        text-align: center;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
    }

    .framing {
        border-color: var(--accent);
        color: var(--accent);
    }

    .fit {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
    }

    .fit button {
        min-height: 32px;
        padding: 0 0.7rem;
        border: 1px solid var(--border);
        border-radius: 999px;
        background: none;
        color: var(--foreground);
        font-size: 0.75rem;
    }

    .fit button.on {
        border-color: var(--accent);
        background: rgba(229, 184, 204, 0.18);
    }

    .fit .reset {
        margin-left: auto;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        font-size: 0.75rem;
    }

    label span {
        display: flex;
        justify-content: space-between;
        color: var(--muted);
    }

    input[type="range"] {
        height: 28px;
        padding: 0;
        background: none;
        border: none;
        accent-color: var(--accent);
    }
</style>
