<script lang="ts">
    import Tabs from "$lib/components/ui/Tabs.svelte";
    import type { TableClient } from "$lib/table/client.svelte";
    import {
        ASSET_KINDS,
        ASSET_LABELS,
        AUDIO_KINDS,
        type Asset,
        type AssetKind,
        type SceneView,
        type TableView,
        isVideo,
        NO_EFFECTS,
    } from "$lib/table/types";

    let {
        client,
        view,
        scene,
        assets = $bindable(),
        obsUrl,
    }: {
        client: TableClient;
        view: TableView;
        /** Scène affichée par le MJ, pour « utiliser comme fond ». */
        scene: SceneView | null;
        assets: Asset[];
        obsUrl: string;
    } = $props();

    let kind = $state<AssetKind>("fond");
    let uploading = $state(false);
    let input: HTMLInputElement | undefined = $state();
    let copied = $state(false);

    let session = $derived(view.session);
    let list = $derived(assets.filter((a) => a.kind === kind));
    let isAudio = $derived(AUDIO_KINDS.includes(kind));

    async function upload() {
        const files = input?.files;
        if (!files?.length) return;
        uploading = true;
        const form = new FormData();
        form.set("kind", kind);
        for (const file of files) form.append("files", file);
        try {
            const response = await fetch("/outils/table/medias", { method: "POST", body: form });
            const body = await response.json();
            if (!response.ok) client.flash(body?.message ?? "Envoi refusé.");
            else assets = [...assets, ...body].sort((a, b) => a.name.localeCompare(b.name));
        } catch {
            client.flash("Envoi interrompu.");
        } finally {
            uploading = false;
            if (input) input.value = "";
        }
    }

    async function remove(asset: Asset) {
        if (!confirm(`Supprimer « ${asset.name} » de la médiathèque ?`)) return;
        const response = await fetch(`/outils/table/medias?id=${asset.id}`, { method: "DELETE" });
        if (response.ok) assets = assets.filter((a) => a.id !== asset.id);
    }

    async function rename(asset: Asset) {
        const name = prompt("Nouveau nom", asset.name)?.trim();
        if (!name || name === asset.name) return;
        const response = await fetch("/outils/table/medias", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: asset.id, name }),
        });
        if (response.ok) assets = assets.map((a) => (a.id === asset.id ? { ...a, name } : a));
    }

    async function copyObs() {
        await navigator.clipboard.writeText(obsUrl);
        copied = true;
        setTimeout(() => (copied = false), 2000);
    }

    let kindOptions = $derived(
        ASSET_KINDS.map((k) => ({
            value: k,
            label: ASSET_LABELS[k],
            badge: assets.filter((a) => a.kind === k).length,
        })),
    );
</script>

<div class="panel-body">
    <section>
        <h3>En cours</h3>
        {#if session.music}
            <div class="now">
                <span>♪ <strong>{session.music.name}</strong> {session.music.playing ? "" : "(en pause)"}</span>
                <div class="row">
                    {#if session.music.playing}
                        <button class="btn btn-small" onclick={() => client.act("music.pause")}>Pause</button>
                    {:else}
                        <button class="btn btn-small" onclick={() => client.act("music.resume")}>Reprendre</button>
                    {/if}
                    <button class="btn btn-small" onclick={() => client.act("music.stop")}>Arrêter</button>
                    <label class="check">
                        <input
                            type="checkbox"
                            checked={session.music.loop}
                            onchange={(e) => client.act("music.loop", { loop: e.currentTarget.checked })}
                        />
                        En boucle
                    </label>
                </div>
            </div>
        {:else}
            <p class="muted small">Aucune musique.</p>
        {/if}

        {#each session.ambiences as ambience (ambience.id)}
            <div class="ambience">
                <span>≈ {ambience.name}</span>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ambience.volume}
                    aria-label="Volume de {ambience.name}"
                    onchange={(e) => client.act("ambience.volume", { id: ambience.id, volume: Number(e.currentTarget.value) })}
                />
                <button class="btn btn-small" onclick={() => client.act("ambience.remove", { id: ambience.id })} aria-label="Retirer {ambience.name}">✕</button>
            </div>
        {/each}

        {#if session.showcase}
            <div class="now">
                <span>Image montrée à tous</span>
                <img class="thumb" src={session.showcase} alt="" />
                <button class="btn btn-small" onclick={() => client.act("showcase.set", { url: null })}>
                    Retirer l'image
                </button>
            </div>
        {/if}
    </section>

    <section>
        <h3>Médiathèque</h3>
        <Tabs bind:value={kind} options={kindOptions} label="Type de média" />

        <div class="upload">
            <input
                bind:this={input}
                type="file"
                multiple
                accept={isAudio ? "audio/*" : kind === "calque" ? "image/*,video/webm,video/mp4" : "image/*"}
                aria-label="Fichiers à envoyer"
            />
            <button class="btn btn-small btn-accent" disabled={uploading} onclick={upload}>
                {uploading ? "Envoi…" : "Envoyer"}
            </button>
        </div>
        <p class="muted small">
            {isAudio
                ? "mp3, ogg, wav, m4a, flac · 40 Mo maximum"
                : kind === "calque"
                  ? "gif, webp animé, png (8 Mo) ou vidéo webm / mp4 (40 Mo). Les webm transparents ne le sont pas sur Safari."
                  : "jpg, png, webp, gif, svg · 8 Mo maximum"}
        </p>

        <ul class:grid={!isAudio}>
            {#each list as asset (asset.id)}
                <li>
                    {#if isVideo(asset.url)}
                        <video src={asset.url} muted loop autoplay playsinline></video>
                    {:else if !isAudio}
                        <img src={asset.url} alt="" loading="lazy" />
                    {/if}
                    <button class="asset-name" title="Renommer" onclick={() => rename(asset)}>{asset.name}</button>
                    <div class="row">
                        {#if kind === "fond"}
                            <button class="btn btn-small" disabled={!scene} onclick={() => client.act("scene.update", { id: scene?.id, background: asset.url })}>
                                Fond de la scène
                            </button>
                        {:else if kind === "jeton"}
                            <button class="btn btn-small" disabled={!scene} onclick={() => client.act("token.add", { sceneId: scene?.id, source: "custom", name: asset.name, image: asset.url })}>
                                Placer
                            </button>
                        {:else if kind === "calque"}
                            <button
                                class="btn btn-small"
                                disabled={!scene}
                                onclick={() =>
                                    client.act("scene.update", {
                                        id: scene?.id,
                                        effects: { ...(scene?.effects ?? NO_EFFECTS), overlay: { url: asset.url, opacity: 0.8, blend: "screen" } },
                                    })}
                            >
                                Poser sur la scène
                            </button>
                        {:else if kind === "image"}
                            <button class="btn btn-small" onclick={() => client.act("showcase.set", { url: asset.url })}>
                                Montrer à tous
                            </button>
                        {:else if kind === "musique"}
                            <button class="btn btn-small" onclick={() => client.act("music.play", { url: asset.url, name: asset.name, loop: true })}>
                                Jouer
                            </button>
                        {:else if kind === "ambiance"}
                            <button class="btn btn-small" onclick={() => client.act("ambience.add", { url: asset.url, name: asset.name })}>
                                Ajouter
                            </button>
                        {:else if kind === "effet"}
                            <button class="btn btn-small" onclick={() => client.act("sfx.play", { url: asset.url })}>
                                Jouer
                            </button>
                        {/if}
                        <button class="btn btn-small btn-danger" onclick={() => remove(asset)} aria-label="Supprimer {asset.name}">✕</button>
                    </div>
                </li>
            {:else}
                <li class="muted small">Rien pour l'instant.</li>
            {/each}
        </ul>
    </section>

    <section>
        <h3>Vue OBS</h3>
        <p class="muted small">
            Plateau et journal tels que les joueurs les voient, sans interface. À ajouter comme « source
            navigateur ». Ajoute <code>&amp;journal=0</code> ou <code>&amp;plateau=0</code> pour n'en garder qu'un.
        </p>
        <div class="row">
            <button class="btn btn-small" onclick={copyObs}>{copied ? "Lien copié" : "Copier le lien"}</button>
            <a class="btn btn-small" href={obsUrl} target="_blank" rel="noopener">Ouvrir</a>
        </div>
    </section>
</div>

<style>
    .panel-body {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        font-size: 0.9rem;
    }

    section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    section + section {
        border-top: 1px solid var(--border);
        padding-top: 0.75rem;
    }

    h3 {
        font-size: 1.15rem;
    }

    .now {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.35rem;
    }

    .check {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.85rem;
    }

    .ambience {
        display: grid;
        grid-template-columns: 1fr 7rem auto;
        align-items: center;
        gap: 0.4rem;
    }

    input[type="range"] {
        height: auto;
        padding: 0;
        background: none;
        border: none;
    }

    .thumb {
        max-width: 100%;
        max-height: 8rem;
        object-fit: contain;
        border-radius: var(--radius);
    }

    .upload {
        display: flex;
        gap: 0.4rem;
        align-items: center;
    }

    .upload input {
        font-size: 14px;
        height: auto;
    }

    ul {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    ul.grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
    }

    li {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        padding: 0.4rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
    }

    li img,
    li video {
        width: 100%;
        aspect-ratio: 4 / 3;
        object-fit: cover;
        border-radius: var(--radius);
        background-color: #111;
    }

    .asset-name {
        border: none;
        background: none;
        color: var(--foreground);
        text-align: left;
        font-size: 0.85rem;
        padding: 0;
        overflow-wrap: anywhere;
    }

    .btn-small {
        min-height: 28px;
        padding: 0 0.45rem;
        font-size: 14px;
    }

    .small {
        font-size: 0.8rem;
    }

    code {
        font-family: monospace;
    }
</style>
