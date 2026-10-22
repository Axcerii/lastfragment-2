<script lang="ts">
    import type { TableClient } from "$lib/table/client.svelte";
    import type { Asset, TableView } from "$lib/table/types";

    // Balera, la chanteuse du lore, tient le son de la table : chacun y règle ses volumes,
    // et le MJ y gère la musique et les ambiances en cours.
    let {
        volumes = $bindable(),
        unlocked,
        client,
        session,
        isAdmin,
        assets = [],
    }: {
        volumes: { music: number; ambience: number; effects: number; muted: boolean; animations: boolean };
        unlocked: boolean;
        client: TableClient;
        session: TableView["session"];
        isAdmin: boolean;
        /** Médiathèque du MJ, pour lancer musiques, ambiances et effets. */
        assets?: Asset[];
    } = $props();

    let open = $state(false);
    let root: HTMLDivElement | undefined = $state();

    const SLIDERS = [
        { key: "music", label: "Musique" },
        { key: "ambience", label: "Ambiances" },
        { key: "effects", label: "Effets" },
    ] as const;

    // Volumes gardés de 0 à 1, réglés de 0 à 100 par pas de 1.
    const percent = (value: number) => Math.round(value * 100);

    let musics = $derived(assets.filter((a) => a.kind === "musique"));
    let ambiences = $derived(assets.filter((a) => a.kind === "ambiance"));
    let effects = $derived(assets.filter((a) => a.kind === "effet"));

    function launch(e: Event, play: (asset: Asset) => void) {
        const select = e.currentTarget as HTMLSelectElement;
        const asset = assets.find((a) => a.id === Number(select.value));
        if (asset) play(asset);
        select.value = "";
    }

    // Un clic en dehors referme la fenêtre.
    function outside(e: PointerEvent) {
        if (open && root && !root.contains(e.target as Node)) open = false;
    }
</script>

<svelte:window onpointerdown={outside} />

<div class="sound" bind:this={root}>
    <button
        class="token"
        class:pulse={!unlocked}
        class:playing={session.music?.playing}
        onclick={() => (open = !open)}
        aria-expanded={open}
        aria-label="Son (Balera)"
        title={unlocked ? "Balera : le son de la table" : "Clique n'importe où pour activer le son"}
    >
        <img src="/table/Balera.png" alt="" />
        {#if volumes.muted}<span class="badge" aria-hidden="true">🔇</span>{/if}
    </button>
    {#if !unlocked}<span class="hint">Activer le son</span>{/if}

    {#if open}
        <div class="popover" class:wide={isAdmin}>
            <header>
                <img src="/table/Balera.png" alt="" />
                <strong>Balera</strong>
            </header>

            {#each SLIDERS as slider (slider.key)}
                <label>
                    <span class="line">{slider.label} <span class="muted">{percent(volumes[slider.key])}</span></span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={percent(volumes[slider.key])}
                        oninput={(e) => (volumes[slider.key] = Number(e.currentTarget.value) / 100)}
                    />
                </label>
            {/each}
            <label class="check"><input type="checkbox" bind:checked={volumes.muted} /> Couper le son</label>
            <label class="check" title="Pluie, neige… À couper sur un ordinateur peu puissant.">
                <input type="checkbox" bind:checked={volumes.animations} /> Météo animée
            </label>

            {#if isAdmin}
                <section>
                    <h4>En cours</h4>
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
                                max="100"
                                step="1"
                                value={percent(ambience.volume)}
                                aria-label="Volume de {ambience.name}"
                                onchange={(e) =>
                                    client.act("ambience.volume", { id: ambience.id, volume: Number(e.currentTarget.value) / 100 })}
                            />
                            <button class="btn btn-small" onclick={() => client.act("ambience.remove", { id: ambience.id })} aria-label="Retirer {ambience.name}">✕</button>
                        </div>
                    {/each}
                </section>

                <section>
                    <h4>Lancer</h4>
                    <select aria-label="Jouer une musique" onchange={(e) => launch(e, (a) => client.act("music.play", { url: a.url, name: a.name, loop: true }))} disabled={!musics.length}>
                        <option value="">♪ Musique…</option>
                        {#each musics as asset (asset.id)}<option value={asset.id}>{asset.name}</option>{/each}
                    </select>
                    <select aria-label="Ajouter une ambiance" onchange={(e) => launch(e, (a) => client.act("ambience.add", { url: a.url, name: a.name }))} disabled={!ambiences.length}>
                        <option value="">≈ Ambiance…</option>
                        {#each ambiences as asset (asset.id)}<option value={asset.id}>{asset.name}</option>{/each}
                    </select>
                    <select aria-label="Jouer un effet" onchange={(e) => launch(e, (a) => client.act("sfx.play", { url: a.url }))} disabled={!effects.length}>
                        <option value="">✦ Effet…</option>
                        {#each effects as asset (asset.id)}<option value={asset.id}>{asset.name}</option>{/each}
                    </select>
                    <p class="muted small">Pour envoyer de nouveaux sons : onglet Médias.</p>
                </section>
            {/if}
        </div>
    {/if}
</div>

<style>
    .sound {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }

    .token {
        position: relative;
        width: 38px;
        height: 38px;
        padding: 0;
        border-radius: 50%;
        border: 2px solid var(--border);
        background-color: var(--surface);
        cursor: pointer;
        transition: border-color 0.2s;
    }

    .token:hover,
    .token[aria-expanded="true"] {
        border-color: var(--accent);
    }

    .token.playing {
        border-color: var(--primary);
    }

    .token img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
    }

    .badge {
        position: absolute;
        right: -6px;
        bottom: -6px;
        font-size: 0.8rem;
    }

    .hint {
        font-size: 0.8rem;
        color: var(--accent);
    }

    .pulse {
        border-color: var(--accent);
        animation: pulse 1.6s ease-in-out infinite;
    }

    @keyframes pulse {
        50% {
            box-shadow: 0 0 0 4px rgba(229, 184, 204, 0.3);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .pulse {
            animation: none;
        }
    }

    .popover {
        position: absolute;
        right: 0;
        top: calc(100% + 0.4rem);
        z-index: 50;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 15rem;
        max-width: calc(100vw - 2rem);
        max-height: 75vh;
        overflow-y: auto;
        padding: 0.75rem;
        background-color: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        font-size: 0.85rem;
    }

    .popover.wide {
        width: 21rem;
    }

    header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    header img {
        width: 2.2rem;
        height: 2.2rem;
        border-radius: 50%;
        object-fit: cover;
    }

    section {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        border-top: 1px solid var(--border);
        padding-top: 0.6rem;
    }

    h4 {
        font-size: 1rem;
        color: var(--primary);
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    .line {
        display: flex;
        justify-content: space-between;
        font-variant-numeric: tabular-nums;
    }

    label.check {
        flex-direction: row;
        align-items: center;
        gap: 0.35rem;
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

    .ambience {
        display: grid;
        grid-template-columns: 1fr 6rem auto;
        align-items: center;
        gap: 0.4rem;
    }

    input[type="range"] {
        height: auto;
        padding: 0;
        background: none;
        border: none;
    }

    select {
        height: 30px;
        font-size: 15px;
        padding: 0 0.4rem;
    }

    .small {
        font-size: 0.8rem;
    }
</style>
