<script lang="ts">
    import type { TableClient } from "$lib/table/client.svelte";
    import { SIDE_LABELS, type Asset, type SceneView, type TokenView } from "$lib/table/types";

    type Option = { id: number; name: string };

    let {
        client,
        scene,
        tokens,
        sources,
        assets,
        selectedId = $bindable(),
    }: {
        client: TableClient;
        scene: SceneView;
        tokens: TokenView[];
        sources: { players: Option[]; characters: Option[]; monsters: Option[] };
        assets: Asset[];
        selectedId: number | null;
    } = $props();

    type Source = "player" | "character" | "monster" | "custom";
    const SOURCES: { value: Source; label: string }[] = [
        { value: "monster", label: "Monstre" },
        { value: "character", label: "Personnage" },
        { value: "player", label: "Joueur" },
        { value: "custom", label: "Libre" },
    ];

    let source = $state<Source>("monster");
    let refId = $state<number | null>(null);
    let name = $state("");
    let image = $state("");
    let hidden = $state(false);
    let count = $state(1);
    let filter = $state("");

    let options = $derived(
        source === "player"
            ? sources.players
            : source === "character"
              ? sources.characters
              : source === "monster"
                ? sources.monsters
                : [],
    );
    let filtered = $derived(
        options.filter((o) => o.name.toLowerCase().includes(filter.trim().toLowerCase())),
    );
    let tokenImages = $derived(assets.filter((a) => a.kind === "jeton"));

    $effect(() => {
        if (source !== "custom" && !filtered.some((o) => o.id === refId)) refId = filtered[0]?.id ?? null;
    });

    async function add() {
        // Plusieurs exemplaires d'un même monstre d'un coup (une meute de loups…).
        const copies = source === "player" ? 1 : Math.max(1, Math.min(12, count));
        for (let i = 0; i < copies; i++) {
            const result = await client.act<{ id: number }>("token.add", {
                sceneId: scene.id,
                source,
                refId: refId ?? undefined,
                name,
                image,
                hidden,
            });
            if (result && copies === 1) selectedId = result.id;
        }
    }
</script>

<div class="panel-body">
    <section>
        <h3>Ajouter un jeton</h3>
        <div class="chips" role="radiogroup" aria-label="Origine du jeton">
            {#each SOURCES as s (s.value)}
                <button class="chip" class:on={source === s.value} onclick={() => (source = s.value)}>
                    {s.label}
                </button>
            {/each}
        </div>

        {#if source === "custom"}
            <label>Nom <input bind:value={name} maxlength="255" placeholder="Garde, coffre, piège…" /></label>
            <label>
                Image
                <select bind:value={image}>
                    <option value="">Aucune (initiales)</option>
                    {#each tokenImages as asset (asset.id)}
                        <option value={asset.url}>{asset.name}</option>
                    {/each}
                </select>
            </label>
            {#if tokenImages.length === 0}
                <p class="muted small">Envoie des images de jetons dans l'onglet Médias.</p>
            {/if}
        {:else}
            <label>
                Rechercher
                <input bind:value={filter} placeholder="Nom…" />
            </label>
            <select bind:value={refId} size="6" aria-label="Choix">
                {#each filtered as option (option.id)}
                    <option value={option.id}>{option.name}</option>
                {/each}
            </select>
        {/if}

        <div class="row">
            {#if source !== "player"}
                <label class="inline">
                    Nombre <input type="number" min="1" max="12" bind:value={count} />
                </label>
            {/if}
            <label class="check"><input type="checkbox" bind:checked={hidden} /> Caché</label>
        </div>
        <button class="btn btn-accent" disabled={source !== "custom" && refId === null} onclick={add}>
            Placer sur « {scene.name} »
        </button>
    </section>

    <section>
        <h3>Sur cette scène <span class="muted">({tokens.length})</span></h3>
        <ul>
            {#each tokens as token (token.id)}
                <li class:selected={selectedId === token.id}>
                    <button class="name" onclick={() => (selectedId = token.id)}>
                        {token.name}
                        <span class="muted">· {SIDE_LABELS[token.side]}{token.hidden ? " · caché" : ""}</span>
                    </button>
                    <button
                        class="btn btn-small"
                        title={token.hidden ? "Montrer aux joueurs" : "Cacher aux joueurs"}
                        onclick={() => client.act("token.update", { id: token.id, hidden: !token.hidden })}
                    >
                        {token.hidden ? "Montrer" : "Cacher"}
                    </button>
                </li>
            {:else}
                <li class="muted">Aucun jeton.</li>
            {/each}
        </ul>
        <div class="row">
            <button class="btn btn-small" onclick={() => client.act("token.restore")}>
                Tout le monde au max
            </button>
            <button class="btn btn-small" onclick={() => client.act("token.refresh")}>
                Relire toutes les fiches
            </button>
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

    label {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        font-size: 0.8rem;
    }

    label.inline {
        flex-direction: row;
        align-items: center;
        gap: 0.4rem;
    }

    label.inline input {
        width: 4.5rem;
    }

    label.check {
        flex-direction: row;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.85rem;
    }

    input:not([type="checkbox"]),
    select:not([size]) {
        height: 34px;
        font-size: 15px;
        padding: 0 0.5rem;
    }

    select[size] {
        font-size: 15px;
        padding: 0.25rem;
    }

    .chips,
    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.4rem;
    }

    .chip {
        min-height: 30px;
        padding: 0 0.6rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: none;
        color: var(--foreground);
    }

    .chip.on {
        background-color: var(--primary);
        border-color: var(--primary);
        color: var(--background);
    }

    ul {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        max-height: 16rem;
        overflow-y: auto;
    }

    li {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.2rem 0.4rem;
        border-radius: var(--radius);
    }

    li.selected {
        background-color: rgba(229, 184, 204, 0.15);
    }

    .name {
        flex: 1;
        text-align: left;
        border: none;
        background: none;
        color: var(--foreground);
        font-size: 0.9rem;
        padding: 0.2rem 0;
    }

    .small {
        font-size: 0.8rem;
    }
</style>
