<script lang="ts" module>
    export interface LibraryImage {
        url: string;
        folder: string;
        name: string;
        modified: number;
    }

    // Liste gardée entre deux ouvertures : elle peut compter des centaines d'images.
    let cached: LibraryImage[] | null = null;

    const FOLDER_LABELS: Record<string, string> = {
        personnages: "Personnages",
        "personnages/v1": "Personnages V1",
        monsters: "Bestiaire",
        "monsters/v1": "Bestiaire V1",
        "cartes/sources": "Envoyées ici",
        brouillons: "Brouillons",
        "table/fond": "Table · fonds",
        "table/jeton": "Table · jetons",
        "table/image": "Table · images",
        "table/calque": "Table · calques",
        "dragons/normal": "Dragons",
        "dragons/tampons": "Tampons",
        "icones/dragons": "Icônes dragons",
        "icones/pays": "Icônes pays",
        pays: "Emblèmes",
    };

    export function folderLabel(folder: string) {
        return FOLDER_LABELS[folder] ?? folder.replace(/\//g, " · ");
    }

    export const thumbOf = (url: string) => `/admin/cartes/images/miniature?src=${encodeURIComponent(url)}`;
</script>

<script lang="ts">
    // Bibliothèque d'images du créateur : tout ce qui a déjà été envoyé sur le site, rangé par
    // dossier, avec recherche. On peut aussi envoyer des images (bouton, glisser-déposer, ou
    // coller depuis le presse-papiers).
    import Modal from "$lib/components/ui/Modal.svelte";
    import { matches } from "$lib/components/table/MediaPicker.svelte";

    let {
        open = $bindable(false),
        title = "Choisir une image",
        current = null,
        onpick,
    }: {
        open?: boolean;
        title?: string;
        current?: string | null;
        onpick: (url: string) => void;
    } = $props();

    let images = $state<LibraryImage[]>(cached ?? []);
    let loading = $state(false);
    let error = $state("");
    let query = $state("");
    let folder = $state("");
    let uploading = $state(false);
    let dragging = $state(false);
    let input: HTMLInputElement | undefined = $state();

    let folders = $derived.by(() => {
        const counts = new Map<string, number>();
        for (const image of images) counts.set(image.folder, (counts.get(image.folder) ?? 0) + 1);
        return [...counts.entries()].sort((a, b) => folderLabel(a[0]).localeCompare(folderLabel(b[0])));
    });

    let shown = $derived(
        images
            .filter((i) => !folder || i.folder === folder)
            .filter((i) => !query || matches(`${i.name} ${folderLabel(i.folder)}`, query))
            .slice(0, 400),
    );

    async function load(force = false) {
        if (cached && !force) {
            images = cached;
            return;
        }
        loading = true;
        error = "";
        try {
            const response = await fetch("/admin/cartes/images");
            if (!response.ok) throw new Error();
            cached = (await response.json()) as LibraryImage[];
            images = cached;
        } catch {
            error = "La bibliothèque n’a pas pu être chargée.";
        } finally {
            loading = false;
        }
    }

    $effect(() => {
        if (open) load();
    });

    async function upload(files: File[]) {
        const accepted = files.filter((f) => f.type.startsWith("image/"));
        if (!accepted.length) return;
        uploading = true;
        error = "";
        const body = new FormData();
        for (const file of accepted.slice(0, 20)) body.append("files", file);
        try {
            const response = await fetch("/admin/cartes/images", { method: "POST", body });
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message ?? "Envoi refusé.");
            }
            const urls = (await response.json()) as string[];
            await load(true);
            folder = "cartes/sources";
            if (urls.length === 1) pick(urls[0]);
        } catch (e) {
            error = e instanceof Error ? e.message : "Envoi impossible.";
        } finally {
            uploading = false;
        }
    }

    function pick(url: string) {
        onpick(url);
        open = false;
    }

    function onpaste(e: ClipboardEvent) {
        if (!open) return;
        const files = [...(e.clipboardData?.files ?? [])];
        if (files.length) {
            e.preventDefault();
            upload(files);
        }
    }
</script>

<svelte:window {onpaste} />

<Modal bind:open {title} side>
    <div
        class="drop"
        class:dragging
        role="region"
        aria-label="Envoyer des images"
        ondragover={(e) => {
            e.preventDefault();
            dragging = true;
        }}
        ondragleave={() => (dragging = false)}
        ondrop={(e) => {
            e.preventDefault();
            dragging = false;
            upload([...(e.dataTransfer?.files ?? [])]);
        }}
    >
        <button type="button" class="btn btn-accent" disabled={uploading} onclick={() => input?.click()}>
            {uploading ? "Envoi…" : "Envoyer des images"}
        </button>
        <span class="muted">ou glisse-les ici, ou colle-les (Ctrl+V)</span>
        <input
            bind:this={input}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            multiple
            hidden
            onchange={(e) => {
                upload([...(e.currentTarget.files ?? [])]);
                e.currentTarget.value = "";
            }}
        />
    </div>

    <input type="search" placeholder="Chercher une image…" bind:value={query} aria-label="Chercher une image" />

    <div class="folders" role="group" aria-label="Dossiers">
        <button type="button" class:on={folder === ""} onclick={() => (folder = "")}>
            Tout <span>{images.length}</span>
        </button>
        {#each folders as [name, count] (name)}
            <button type="button" class:on={folder === name} onclick={() => (folder = name)}>
                {folderLabel(name)} <span>{count}</span>
            </button>
        {/each}
    </div>

    {#if error}<p class="message-error" role="alert">{error}</p>{/if}
    {#if loading}
        <p class="muted">Chargement…</p>
    {:else if shown.length === 0}
        <p class="muted">Aucune image.</p>
    {:else}
        <div class="grid">
            {#each shown as image (image.url)}
                <button
                    type="button"
                    class="image"
                    class:current={image.url === current}
                    title="{image.name} — {folderLabel(image.folder)}"
                    onclick={() => pick(image.url)}
                >
                    <img src={thumbOf(image.url)} alt="" loading="lazy" decoding="async" />
                    <span>{image.name}</span>
                </button>
            {/each}
        </div>
    {/if}
</Modal>

<style>
    .drop {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        border: 1px dashed var(--border);
        border-radius: var(--radius);
        font-size: 0.85rem;
    }

    .drop.dragging {
        border-color: var(--accent);
        background: rgba(229, 184, 204, 0.08);
    }

    input[type="search"] {
        height: 42px;
        font-size: 18px;
    }

    .folders {
        display: flex;
        gap: 0.4rem;
        overflow-x: auto;
        padding-bottom: 0.3rem;
        scrollbar-width: thin;
    }

    .folders button {
        flex-shrink: 0;
        border: 1px solid var(--border);
        border-radius: 999px;
        background: none;
        color: var(--foreground);
        padding: 0.25rem 0.75rem;
        font-size: 0.8rem;
        white-space: nowrap;
    }

    .folders button.on {
        background: var(--accent);
        border-color: var(--accent);
        color: var(--background);
    }

    .folders span {
        opacity: 0.6;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
        gap: 0.5rem;
    }

    .image {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.3rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-raised);
        color: var(--foreground);
        font-size: 0.65rem;
        text-align: left;
        content-visibility: auto;
        contain-intrinsic-size: 96px 130px;
    }

    .image:hover,
    .image.current {
        border-color: var(--accent);
    }

    .image img {
        width: 100%;
        aspect-ratio: 1;
        object-fit: contain;
        background:
            repeating-conic-gradient(#2a2a2a 0 25%, #333 0 50%) 0 0 / 12px 12px;
        border-radius: 3px;
    }

    .image span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>
