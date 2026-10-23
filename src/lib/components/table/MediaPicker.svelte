<script lang="ts" module>
    /** Minuscules sans accents : « foret » trouve « Forêt ». */
    const fold = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

    /** Chaque mot cherché doit apparaître dans le nom, dans n'importe quel ordre. */
    export function matches(name: string, query: string) {
        const target = fold(name);
        return fold(query)
            .split(/\s+/)
            .every((word) => target.includes(word));
    }
</script>

<script lang="ts">
    // Fenêtre de choix d'un média de la médiathèque, avec recherche : la liste peut compter des
    // centaines de fonds ou de musiques. Les sons peuvent être écoutés ici, pour le MJ seul.
    import { tick } from "svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import { AUDIO_KINDS, isVideo, type Asset, type AssetKind } from "$lib/table/types";

    let {
        open = $bindable(false),
        title,
        kind,
        assets,
        current = null,
        none,
        stay = false,
        onpick,
    }: {
        open?: boolean;
        title: string;
        kind: AssetKind;
        assets: Asset[];
        /** Url du média déjà choisi, mis en avant. */
        current?: string | null;
        /** Libellé du choix « aucun » (renvoie null), s'il est permis. */
        none?: string;
        /** Garde la fenêtre ouverte après un choix (effets sonores joués à la suite). */
        stay?: boolean;
        onpick: (asset: Asset | null) => void;
    } = $props();

    let query = $state("");
    let search: HTMLInputElement | undefined = $state();
    let isAudio = $derived(AUDIO_KINDS.includes(kind));
    let all = $derived(assets.filter((a) => a.kind === kind));
    let list = $derived(all.filter((a) => matches(a.name, query)));

    // ─── Écoute ───
    let preview: HTMLAudioElement | null = null;
    let previewing = $state<number | null>(null);

    function stopPreview() {
        preview?.pause();
        preview = null;
        previewing = null;
    }

    function listen(asset: Asset) {
        const same = previewing === asset.id;
        stopPreview();
        if (same) return;
        preview = new Audio(asset.url);
        preview.volume = 0.6;
        preview.onended = stopPreview;
        preview.play().catch(stopPreview);
        previewing = asset.id;
    }

    // À l'ouverture : recherche vide, curseur dedans. À la fermeture : l'écoute s'arrête.
    $effect(() => {
        if (!open) return;
        query = "";
        tick().then(() => search?.focus());
        return stopPreview;
    });

    function pick(asset: Asset | null) {
        onpick(asset);
        if (!stay) open = false;
    }
</script>

<Modal bind:open {title}>
    {#if open}
        <form
            class="search"
            onsubmit={(e) => {
                e.preventDefault();
                if (list[0]) pick(list[0]);
            }}
        >
            <input bind:this={search} bind:value={query} type="search" placeholder="Rechercher…" aria-label="Rechercher" />
            <span class="muted small count">{list.length} / {all.length}</span>
        </form>
        <p class="muted small">Entrée choisit le premier résultat.{stay ? " La fenêtre reste ouverte : clique plusieurs sons à la suite." : ""}</p>

        {#if none}
            <button class="btn btn-small none" class:current={!current} onclick={() => pick(null)}>{none}</button>
        {/if}

        <ul class:grid={!isAudio}>
            {#each list as asset (asset.id)}
                <li class:current={asset.url === current}>
                    {#if isAudio}
                        <button
                            class="btn btn-small listen"
                            class:on={previewing === asset.id}
                            onclick={() => listen(asset)}
                            aria-label="{previewing === asset.id ? 'Arrêter' : 'Écouter'} {asset.name}"
                            title="Écouter (toi seul)"
                        >
                            {previewing === asset.id ? "■" : "▶"}
                        </button>
                        <button class="name" onclick={() => pick(asset)}>{asset.name}</button>
                    {:else}
                        <button class="thumb" onclick={() => pick(asset)} title={asset.name}>
                            {#if isVideo(asset.url)}
                                <video
                                    src={asset.url}
                                    muted
                                    loop
                                    playsinline
                                    preload="metadata"
                                    onmouseenter={(e) => e.currentTarget.play().catch(() => {})}
                                    onmouseleave={(e) => e.currentTarget.pause()}
                                ></video>
                            {:else}
                                <img src={asset.url} alt="" loading="lazy" />
                            {/if}
                            <span>{asset.name}</span>
                        </button>
                    {/if}
                </li>
            {:else}
                <li class="muted small empty">
                    {all.length ? "Aucun résultat." : "Rien pour l'instant : envoie des fichiers dans l'onglet Médias."}
                </li>
            {/each}
        </ul>
    {/if}
</Modal>

<style>
    .search {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: -0.5rem;
    }

    .search input {
        flex: 1;
        height: 38px;
        font-size: 16px;
        padding: 0 0.6rem;
    }

    .count {
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
    }

    .none {
        align-self: flex-start;
    }

    ul {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        max-height: 60dvh;
        overflow-y: auto;
        scrollbar-color: var(--border) transparent;
        scrollbar-width: thin;
    }

    ul.grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
        align-content: start;
        gap: 0.5rem;
    }

    li {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        border-radius: var(--radius);
    }

    li.current,
    .none.current {
        outline: 2px solid var(--primary);
        outline-offset: -2px;
    }

    .name {
        flex: 1;
        min-height: 32px;
        padding: 0.2rem 0.4rem;
        border: none;
        border-radius: var(--radius);
        background: none;
        color: var(--foreground);
        text-align: left;
        overflow-wrap: anywhere;
    }

    .name:hover,
    .thumb:hover {
        background-color: rgba(229, 184, 204, 0.15);
    }

    .listen {
        width: 32px;
        min-height: 32px;
        padding: 0;
        flex-shrink: 0;
    }

    .listen.on {
        border-color: var(--primary);
        color: var(--primary);
    }

    .thumb {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        width: 100%;
        padding: 0.35rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: none;
        color: var(--foreground);
        text-align: left;
        font-size: 0.8rem;
    }

    .thumb img,
    .thumb video {
        width: 100%;
        aspect-ratio: 4 / 3;
        object-fit: cover;
        border-radius: var(--radius);
        background-color: #111;
    }

    .thumb span {
        overflow-wrap: anywhere;
    }

    .empty {
        padding: 0.5rem 0;
    }

    .small {
        font-size: 0.8rem;
    }
</style>
