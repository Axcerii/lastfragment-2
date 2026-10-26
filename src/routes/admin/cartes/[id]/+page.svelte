<script lang="ts">
    // Créateur de cartes : aperçu en direct (recto, verso, reflet, usure) et réglages en onglets.
    // Tout est gardé dans `draft` et part d'un bloc à l'enregistrement ; le serveur nettoie chaque
    // champ et recalcule les images.
    import { untrack } from "svelte";
    import { beforeNavigate } from "$app/navigation";
    import { enhance } from "$app/forms";
    import { page } from "$app/state";
    import Icon from "$lib/components/ui/Icon.svelte";
    import Tabs from "$lib/components/ui/Tabs.svelte";
    import CollectibleCard from "$lib/components/cards/CollectibleCard.svelte";
    import Chips from "$lib/components/cards/creator/Chips.svelte";
    import ImageSlot from "$lib/components/cards/creator/ImageSlot.svelte";
    import SourcePicker from "$lib/components/cards/creator/SourcePicker.svelte";
    import { DRAGON_HEX, statBars, type Prefill } from "$lib/cards/prefill";
    import {
        BACKDROPS,
        CARD_TYPES,
        DEFAULT_FINISH,
        defaultFace,
        FACE_LIMITS,
        FINISHES,
        formatWear,
        FRAMES,
        RARITIES,
        TEMPLATE_STATUSES,
        wearTier,
        type CardLook,
        type CardType,
        type TemplateStatus,
    } from "$lib/cards/types";
    import { DRAGONS, dragonText, type Dragon } from "$lib/game/labels";

    let { data, form } = $props();

    type Draft = {
        name: string;
        type: CardType;
        rarity: number;
        setId: number | null;
        /** Autres séries dont les boosters donnent aussi cette carte. */
        boosters: number[];
        number: number | null;
        status: TemplateStatus;
        inAll: boolean;
        weight: number;
        limited: boolean;
        maxPrints: number;
        sourceKind: string | null;
        sourceId: number | null;
        face: ReturnType<typeof defaultFace>;
    };

    function initial(): Draft {
        const t = data.template;
        return {
            name: t?.name ?? "",
            type: t?.type ?? "personnage",
            rarity: t?.rarity ?? 1,
            setId: t?.setId ?? null,
            boosters: [...(t?.boosters ?? [])],
            number: t?.number ?? null,
            status: (t?.status as TemplateStatus) ?? "brouillon",
            inAll: t?.inAll ?? true,
            weight: t?.weight ?? 10,
            limited: t?.maxPrints != null,
            maxPrints: t?.maxPrints ?? 100,
            sourceKind: t?.sourceKind ?? null,
            sourceId: t?.sourceId ?? null,
            face: JSON.parse(JSON.stringify(t?.face ?? defaultFace())),
        };
    }

    let draft = $state(initial());
    let saved = $state(JSON.stringify(initial()));
    let dirty = $derived(JSON.stringify(draft) !== saved);

    // Même page pour une autre carte (création, duplication) : on repart de ses données.
    let shownId = untrack(() => data.template?.id ?? null);
    $effect(() => {
        const id = data.template?.id ?? null;
        if (id === shownId) return;
        shownId = id;
        untrack(() => {
            draft = initial();
            saved = JSON.stringify(draft);
            backdropChoice = draft.face.background ? "image" : draft.face.backdrop;
            framing = null;
        });
    });

    let tab = $state<"carte" | "image" | "verso" | "diffusion">("carte");
    let flipped = $state(false);
    let wearPreview = $state(0);
    let framing = $state<"art" | "background" | null>(null);
    let sourcesOpen = $state(false);
    let saving = $state(false);
    let message = $state("");

    let set = $derived(data.sets.find((s) => s.id === draft.setId) ?? null);
    let look = $derived<CardLook>({
        type: draft.type,
        rarity: draft.rarity,
        name: draft.name,
        number: draft.setId ? draft.number : null,
        maxPrints: draft.limited ? draft.maxPrints : null,
        set: set ? { code: set.code, color: set.color, logo: set.logo, total: Math.max(set.total, draft.number ?? 0) } : null,
        face: draft.face,
    });

    // ─── Choix qui en entraînent d'autres ───

    function setRarity(rarity: number) {
        // La finition suit la rareté tant que le MJ ne l'a pas choisie lui-même.
        const previous = Object.entries(DEFAULT_FINISH).find(([, f]) => f === draft.face.finish)?.[0];
        if (previous && Number(previous) !== rarity) draft.face.finish = DEFAULT_FINISH[rarity];
    }

    function setType(type: CardType) {
        const defaults = Object.values(CARD_TYPES).map((t) => t.accent as string);
        if (defaults.includes(draft.face.accent)) draft.face.accent = CARD_TYPES[type].accent;
    }

    function toggleDragon(dragon: Dragon) {
        const list = draft.face.dragons ? draft.face.dragons.split("-") : [];
        const next = list.includes(dragon) ? list.filter((d) => d !== dragon) : [...list, dragon].slice(0, 3);
        draft.face.dragons = next.join("-");
    }

    function applyPrefill(prefill: Prefill) {
        if (draft.name && !confirm(`Remplacer le contenu de la carte par « ${prefill.name} » ?`)) return;
        draft.name = prefill.name;
        draft.type = prefill.type;
        if (prefill.rarity) {
            setRarity(prefill.rarity);
            draft.rarity = prefill.rarity;
        }
        draft.sourceKind = prefill.sourceKind;
        draft.sourceId = prefill.sourceId;
        draft.face = { ...draft.face, accent: CARD_TYPES[prefill.type].accent, ...prefill.face } as Draft["face"];
    }

    let source = $derived.by(() => {
        if (draft.sourceKind === "personnage") return data.sources.characters.find((c) => c.id === draft.sourceId) ?? null;
        if (draft.sourceKind === "monstre") return data.sources.monsters.find((m) => m.id === draft.sourceId) ?? null;
        return null;
    });

    // ─── Cadrage à la main sur l'aperçu ───

    let preview: HTMLDivElement | undefined = $state();
    const pointers = new Map<number, { x: number; y: number }>();
    let grab: { x: number; y: number; ix: number; iy: number; zoom: number; dist: number } | null = null;

    let framed = $derived(framing ? draft.face[framing] : null);

    function artBox() {
        return preview?.querySelector(".front .art")?.getBoundingClientRect() ?? preview?.getBoundingClientRect();
    }

    function spread() {
        const [a, b] = [...pointers.values()];
        return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    }

    function startGrab() {
        if (!framed) return;
        const [first] = [...pointers.values()];
        grab = { x: first.x, y: first.y, ix: framed.x, iy: framed.y, zoom: framed.zoom, dist: spread() };
    }

    function framePointerDown(e: PointerEvent) {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        startGrab();
    }

    function framePointerMove(e: PointerEvent) {
        if (!pointers.has(e.pointerId) || !grab || !framed) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const box = artBox();
        if (!box) return;
        if (pointers.size >= 2 && grab.dist > 0) {
            framed.zoom = clamp(grab.zoom * (spread() / grab.dist), 0.2, 5);
        } else {
            const [p] = [...pointers.values()];
            framed.x = clamp(grab.ix + ((p.x - grab.x) / box.width) * 100, -100, 100);
            framed.y = clamp(grab.iy + ((p.y - grab.y) / box.height) * 100, -100, 100);
        }
    }

    function framePointerUp(e: PointerEvent) {
        pointers.delete(e.pointerId);
        grab = null;
        if (pointers.size) startGrab();
    }

    function frameKey(e: KeyboardEvent) {
        if (!framed) return;
        const step = e.shiftKey ? 5 : 0.5;
        const moves: Record<string, () => void> = {
            ArrowLeft: () => (framed!.x = clamp(framed!.x - step, -100, 100)),
            ArrowRight: () => (framed!.x = clamp(framed!.x + step, -100, 100)),
            ArrowUp: () => (framed!.y = clamp(framed!.y - step, -100, 100)),
            ArrowDown: () => (framed!.y = clamp(framed!.y + step, -100, 100)),
            "+": () => (framed!.zoom = clamp(framed!.zoom * 1.05, 0.2, 5)),
            "-": () => (framed!.zoom = clamp(framed!.zoom / 1.05, 0.2, 5)),
            Escape: () => (framing = null),
            Enter: () => (framing = null),
        };
        if (moves[e.key]) {
            e.preventDefault();
            moves[e.key]();
        }
    }

    let overlay: HTMLDivElement | undefined = $state();
    $effect(() => {
        // La molette zoome : écouteur non passif pour empêcher la page de défiler.
        if (!overlay) return;
        const wheel = (e: WheelEvent) => {
            if (!framed) return;
            e.preventDefault();
            framed.zoom = clamp(framed.zoom * Math.exp(-e.deltaY * 0.0015), 0.2, 5);
        };
        overlay.addEventListener("wheel", wheel, { passive: false });
        overlay.focus();
        return () => overlay?.removeEventListener("wheel", wheel);
    });

    const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

    // ─── Enregistrement ───

    let saveForm: HTMLFormElement | undefined = $state();

    function onkeydown(e: KeyboardEvent) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            e.preventDefault();
            saveForm?.requestSubmit();
        }
    }

    beforeNavigate((navigation) => {
        if (dirty && !saving && navigation.type !== "form" && !confirm("La carte n’est pas enregistrée. Quitter quand même ?")) {
            navigation.cancel();
        }
    });

    let faceJson = $derived(JSON.stringify(draft.face));

    const rarityOptions = RARITIES.map((label, i) => ({ value: i + 1, label, color: `var(--rarity-${i + 1})` }));
    const typeOptions = Object.entries(CARD_TYPES).map(([value, t]) => ({ value: value as CardType, label: t.label, icon: t.icon }));
    const finishOptions = Object.entries(FINISHES).map(([value, f]) => ({ value: value as Draft["face"]["finish"], label: f.label, hint: f.hint }));
    const frameOptions = Object.entries(FRAMES).map(([value, f]) => ({ value: value as Draft["face"]["frame"], label: f.label, hint: f.hint }));
    const backdropOptions = [
        ...Object.entries(BACKDROPS).map(([value, label]) => ({ value, label })),
        { value: "image", label: "Image" },
    ];
    const statusOptions = Object.entries(TEMPLATE_STATUSES).map(([value, label]) => ({ value: value as TemplateStatus, label }));
    const swatches = [...new Set([...Object.values(CARD_TYPES).map((t) => t.accent as string), ...Object.values(DRAGON_HEX)])];

    let backdropChoice = $state(untrack(() => (draft.face.background ? "image" : draft.face.backdrop)));
    function setBackdrop(value: string) {
        if (value !== "image") {
            draft.face.backdrop = value as Draft["face"]["backdrop"];
            draft.face.background = null;
            if (framing === "background") framing = null;
        }
    }
</script>

<svelte:window {onkeydown} />

<svelte:head>
    <title>{data.template ? `Carte : ${data.template.name}` : "Nouvelle carte"} : Last Fragment</title>
</svelte:head>

<main>
    <nav class="crumbs">
        <a href="/admin/cartes">← Cartes</a>
        {#if data.template}<span class="muted">· {data.template.printed} exemplaire{data.template.printed > 1 ? "s" : ""} imprimé{data.template.printed > 1 ? "s" : ""}</span>{/if}
    </nav>

    <div class="layout">
        <section class="stage" aria-label="Aperçu">
            <div class="preview" bind:this={preview}>
                <CollectibleCard card={look} bind:flipped tilt={framing ? "none" : "full"} wear={wearPreview} glow={draft.rarity >= 4} />
                {#if framing && framed}
                    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
                    <div
                        bind:this={overlay}
                        class="framer"
                        role="application"
                        aria-label="Cadrage : glisse pour déplacer, pince ou molette pour zoomer, flèches pour ajuster"
                        tabindex="0"
                        onpointerdown={framePointerDown}
                        onpointermove={framePointerMove}
                        onpointerup={framePointerUp}
                        onpointercancel={framePointerUp}
                        onkeydown={frameKey}
                    >
                        <span>Glisse · pince ou molette pour zoomer</span>
                    </div>
                {/if}
            </div>

            <div class="stage-tools">
                {#if framing}
                    <button type="button" class="btn btn-accent" onclick={() => (framing = null)}>Terminer le cadrage</button>
                {:else}
                    <button type="button" class="btn btn-small" onclick={() => (flipped = !flipped)}>
                        {flipped ? "Voir le recto" : "Voir le verso"}
                    </button>
                {/if}
                <label class="wear">
                    <span>Usure d’aperçu <output>{formatWear(wearPreview)} · {wearTier(wearPreview).label}</output></span>
                    <input type="range" min="0" max="0.999" step="0.001" bind:value={wearPreview} />
                </label>
            </div>
        </section>

        <section class="editor">
            <div class="top">
                <h1>{draft.name || "Nouvelle carte"}</h1>
                <span class="top-actions">
                    {#if data.template}
                        <!-- La copie part de la carte enregistrée : un changement en cours n'y serait pas. -->
                        <form method="POST" action="?/duplicate" use:enhance>
                            <button
                                class="btn btn-small"
                                disabled={dirty}
                                title={dirty ? "Enregistre d’abord la carte" : "Crée une copie en brouillon, à retoucher"}
                            >
                                Dupliquer
                            </button>
                        </form>
                    {/if}
                    <button type="button" class="btn btn-small btn-players" onclick={() => (sourcesOpen = true)}>
                        Partir d’une fiche
                    </button>
                </span>
            </div>

            <div class="tabs">
                <Tabs
                    bind:value={tab}
                    label="Réglages de la carte"
                    options={[
                        { value: "carte", label: "Carte" },
                        { value: "image", label: "Illustration" },
                        { value: "verso", label: "Verso" },
                        { value: "diffusion", label: "Diffusion" },
                    ]}
                />
            </div>

            {#if tab === "carte"}
                <div class="fields">
                    <label class="field">
                        <span>Nom <small>{draft.name.length}/{FACE_LIMITS.name}</small></span>
                        <input bind:value={draft.name} maxlength={FACE_LIMITS.name} placeholder="Lyra" />
                    </label>
                    <label class="field">
                        <span>Sous-titre <small>{draft.face.subtitle.length}/{FACE_LIMITS.subtitle}</small></span>
                        <input bind:value={draft.face.subtitle} maxlength={FACE_LIMITS.subtitle} placeholder="La lame d'Augeaime" />
                    </label>
                    <div class="field">
                        <span>Type</span>
                        <Chips bind:value={draft.type} options={typeOptions} label="Type" onchange={setType} />
                    </div>
                    <div class="field">
                        <span>Rareté</span>
                        <Chips bind:value={draft.rarity} options={rarityOptions} label="Rareté" onchange={setRarity} />
                    </div>
                    <div class="field">
                        <span>Finition <small>{FINISHES[draft.face.finish].hint}</small></span>
                        <Chips bind:value={draft.face.finish} options={finishOptions} label="Finition" />
                    </div>
                    <div class="field">
                        <span>Cadre <small>{FRAMES[draft.face.frame].hint}</small></span>
                        <Chips bind:value={draft.face.frame} options={frameOptions} label="Cadre" />
                    </div>
                    <div class="field">
                        <span>Couleur de la carte</span>
                        <div class="colors">
                            <input type="color" bind:value={draft.face.accent} aria-label="Couleur personnalisée" />
                            {#each swatches as color (color)}
                                <button
                                    type="button"
                                    class="swatch"
                                    class:on={draft.face.accent === color}
                                    style="background: {color}"
                                    aria-label="Couleur {color}"
                                    onclick={() => (draft.face.accent = color)}
                                ></button>
                            {/each}
                        </div>
                    </div>
                    <div class="field">
                        <span>Dragons <small>trois au plus, dans l’ordre d’affichage</small></span>
                        <div class="dragons">
                            {#each DRAGONS as dragon (dragon)}
                                {@const on = draft.face.dragons.split("-").includes(dragon)}
                                <button type="button" class:on aria-pressed={on} onclick={() => toggleDragon(dragon)} style="--c: {dragonText(dragon)}">
                                    <Icon src="/icones/dragons/{dragon}.svg" color={dragonText(dragon)} size="1.1rem" />
                                    {dragon}
                                </button>
                            {/each}
                        </div>
                    </div>
                </div>
            {:else if tab === "image"}
                <div class="fields">
                    <div class="field">
                        <span>Sujet</span>
                        <ImageSlot
                            bind:image={draft.face.art}
                            title="Image du sujet"
                            framing={framing === "art"}
                            onframe={() => (framing = framing === "art" ? null : "art")}
                        />
                        {#if draft.face.art}
                            <label class="check">
                                <input type="checkbox" bind:checked={draft.face.popout} />
                                Sortir du cadre <small class="muted">(portraits détourés : la tête passe devant la bordure)</small>
                            </label>
                        {/if}
                    </div>
                    <div class="field">
                        <span>Fond</span>
                        <Chips
                            bind:value={backdropChoice}
                            options={backdropOptions}
                            label="Fond"
                            onchange={(v) => setBackdrop(String(v))}
                        />
                        {#if backdropChoice === "image"}
                            <ImageSlot
                                bind:image={draft.face.background}
                                title="Image de fond"
                                framing={framing === "background"}
                                onframe={() => (framing = framing === "background" ? null : "background")}
                            />
                        {/if}
                    </div>
                </div>
            {:else if tab === "verso"}
                <div class="fields">
                    <label class="field">
                        <span>Citation <small>{draft.face.flavor.length}/{FACE_LIMITS.flavor}</small></span>
                        <textarea bind:value={draft.face.flavor} maxlength={FACE_LIMITS.flavor} rows="2"></textarea>
                    </label>
                    <label class="field">
                        <span>Texte <small>{draft.face.text.length}/{FACE_LIMITS.text}</small></span>
                        <textarea bind:value={draft.face.text} maxlength={FACE_LIMITS.text} rows="5"></textarea>
                    </label>
                    <label class="field">
                        <span>Taille du texte <output>{draft.face.textSize} %</output></span>
                        <input
                            type="range"
                            min={FACE_LIMITS.textSize[0]}
                            max={FACE_LIMITS.textSize[1]}
                            step="5"
                            bind:value={draft.face.textSize}
                        />
                    </label>

                    <div class="field">
                        <span>Fiche <small>{draft.face.facts.length}/{FACE_LIMITS.facts} lignes</small></span>
                        {#each draft.face.facts as fact, i (i)}
                            <div class="row">
                                <input bind:value={fact.label} maxlength={FACE_LIMITS.factLabel} placeholder="Pays" aria-label="Intitulé" />
                                <input bind:value={fact.value} maxlength={FACE_LIMITS.factValue} placeholder="Augeaime" aria-label="Valeur" />
                                <button type="button" class="btn btn-small btn-danger" aria-label="Retirer la ligne" onclick={() => draft.face.facts.splice(i, 1)}>✕</button>
                            </div>
                        {/each}
                        {#if draft.face.facts.length < FACE_LIMITS.facts}
                            <button type="button" class="btn btn-small" onclick={() => draft.face.facts.push({ label: "", value: "" })}>Ajouter une ligne</button>
                        {/if}
                    </div>

                    <div class="field">
                        <span>Barres <small>{draft.face.bars.length}/{FACE_LIMITS.bars}</small></span>
                        {#each draft.face.bars as bar, i (i)}
                            <div class="row bar">
                                <input bind:value={bar.label} maxlength={FACE_LIMITS.barLabel} placeholder="FOR" aria-label="Nom de la barre" />
                                <input type="range" min="0" max="100" bind:value={bar.value} aria-label="Valeur" />
                                <input type="number" min="0" max="100" bind:value={bar.value} aria-label="Valeur" />
                                <select bind:value={bar.dragon} aria-label="Couleur">
                                    <option value="">Accent</option>
                                    {#each DRAGONS as dragon (dragon)}<option value={dragon}>{dragon}</option>{/each}
                                </select>
                                <button type="button" class="btn btn-small btn-danger" aria-label="Retirer la barre" onclick={() => draft.face.bars.splice(i, 1)}>✕</button>
                            </div>
                        {/each}
                        <div class="row-actions">
                            {#if draft.face.bars.length < FACE_LIMITS.bars}
                                <button type="button" class="btn btn-small" onclick={() => draft.face.bars.push({ label: "", value: 50, dragon: "" })}>Ajouter une barre</button>
                            {/if}
                            {#if source}
                                <button type="button" class="btn btn-small btn-players" onclick={() => source && (draft.face.bars = statBars(source.stats))}>
                                    Reprendre les stats de {source.name}
                                </button>
                            {/if}
                        </div>
                    </div>
                </div>
            {:else}
                <div class="fields">
                    <div class="field">
                        <span>Statut</span>
                        <Chips bind:value={draft.status} options={statusOptions} label="Statut" />
                        <small class="muted">
                            {draft.status === "brouillon"
                                ? "Visible de toi seul, ne tombe d’aucun booster."
                                : draft.status === "publiee"
                                  ? "Tombe des boosters de sa série (et de ceux cochés plus bas)."
                                  : "Ne tombe plus d’aucun booster ; les exemplaires possédés restent."}
                        </small>
                    </div>
                    <label class="field">
                        <span>Série</span>
                        <select
                            value={draft.setId ?? ""}
                            onchange={(e) => {
                                const v = e.currentTarget.value;
                                draft.setId = v ? Number(v) : null;
                                draft.number = null;
                            }}
                        >
                            <option value="">Hors série (booster All seulement)</option>
                            {#each data.sets as s (s.id)}<option value={s.id}>{s.code} · {s.name}</option>{/each}
                        </select>
                        {#if data.sets.length === 0}<small class="muted">Aucune série : <a href="/admin/cartes/series">en créer une</a>.</small>{/if}
                    </label>
                    {#if draft.setId}
                        <label class="field">
                            <span>Numéro dans la série <small>vide = le suivant</small></span>
                            <input
                                type="number"
                                min="1"
                                max="9999"
                                value={draft.number ?? ""}
                                oninput={(e) => (draft.number = e.currentTarget.value ? Number(e.currentTarget.value) : null)}
                            />
                        </label>
                    {/if}
                    <label class="check">
                        <input type="checkbox" bind:checked={draft.inAll} />
                        Tombe aussi du booster All
                    </label>
                    {#if data.sets.some((s) => s.id !== draft.setId)}
                        <div class="field">
                            <span>
                                Tombe aussi des boosters de
                                <small>pour les cartes génériques (« énergies ») : sans numéro ni case dans leur album</small>
                            </span>
                            <div class="boosters">
                                {#each data.sets.filter((s) => s.id !== draft.setId) as s (s.id)}
                                    <label class="check">
                                        <input
                                            type="checkbox"
                                            checked={draft.boosters.includes(s.id)}
                                            onchange={(e) =>
                                                (draft.boosters = e.currentTarget.checked
                                                    ? [...draft.boosters, s.id]
                                                    : draft.boosters.filter((id) => id !== s.id))}
                                        />
                                        <span class="set-dot" style="--c: {s.color}"></span>
                                        {s.code} · {s.name}
                                    </label>
                                {/each}
                            </div>
                        </div>
                    {/if}
                    <label class="field">
                        <span>Poids de tirage <small>parmi les cartes de même rareté ; 10 = normal, 20 = deux fois plus fréquente</small></span>
                        <input type="number" min="1" max="1000" bind:value={draft.weight} />
                    </label>
                    <div class="field">
                        <label class="check">
                            <input type="checkbox" bind:checked={draft.limited} />
                            Tirage limité
                        </label>
                        {#if draft.limited}
                            <label class="inline">
                                <input type="number" min={Math.max(1, data.template?.printed ?? 1)} max="1000000" bind:value={draft.maxPrints} />
                                exemplaires au total
                            </label>
                        {/if}
                    </div>
                </div>

                {#if data.template}
                    <form
                        class="panel give"
                        method="POST"
                        action="?/give"
                        use:enhance={() => async ({ result, update }) => {
                            await update({ reset: false });
                            if (result.type === "success") message = `${result.data?.given} exemplaire(s) donné(s).`;
                        }}
                    >
                        <h2>Donner à un joueur</h2>
                        <div class="row">
                            <select name="playerId" required aria-label="Joueur">
                                <option value="">Joueur…</option>
                                {#each data.players as p (p.id)}<option value={p.id}>{p.login}{p.character ? ` (${p.character})` : ""}</option>{/each}
                            </select>
                            <input name="count" type="number" min="1" max="20" value="1" aria-label="Nombre" />
                            <button class="btn btn-accent" disabled={dirty || draft.status === "brouillon"}>Donner</button>
                        </div>
                        {#if dirty}<small class="muted">Enregistre d’abord la carte.</small>{/if}
                    </form>

                    {#if data.copies.length}
                        <div class="panel copies">
                            <h2>Exemplaires</h2>
                            <ul>
                                {#each data.copies as c (c.id)}
                                    <li>
                                        <a href="/cartes/carte/{c.id}">#{c.serial}</a>
                                        <span>{c.owner ?? "Réserve du MJ"}</span>
                                        <span class="muted">{formatWear(c.wear)} · {wearTier(c.wear).label}</span>
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/if}

                    <div class="danger">
                        {#if data.template.printed === 0}
                            <form
                                method="POST"
                                action="?/delete"
                                use:enhance={({ cancel }) => {
                                    if (!confirm("Supprimer définitivement cette carte ?")) cancel();
                                    saving = true;
                                    return async ({ update }) => {
                                        saving = false;
                                        await update();
                                    };
                                }}
                            >
                                <button class="btn btn-small btn-danger">Supprimer</button>
                            </form>
                        {/if}
                    </div>
                {/if}
            {/if}

            <form
                bind:this={saveForm}
                class="savebar"
                method="POST"
                action="?/save"
                use:enhance={() => {
                    saving = true;
                    message = "";
                    return async ({ result, update }) => {
                        await update({ reset: false });
                        saving = false;
                        if (result.type === "success") {
                            draft = initial();
                            saved = JSON.stringify(draft);
                            message = "Carte enregistrée.";
                        }
                    };
                }}
            >
                <input type="hidden" name="name" value={draft.name} />
                <input type="hidden" name="type" value={draft.type} />
                <input type="hidden" name="rarity" value={draft.rarity} />
                <input type="hidden" name="setId" value={draft.setId ?? ""} />
                <input type="hidden" name="number" value={draft.number ?? ""} />
                <input type="hidden" name="status" value={draft.status} />
                <input type="hidden" name="inAll" value={draft.inAll ? "true" : "false"} />
                {#each draft.boosters.filter((id) => id !== draft.setId) as id (id)}
                    <input type="hidden" name="boosters" value={id} />
                {/each}
                <input type="hidden" name="weight" value={draft.weight} />
                <input type="hidden" name="maxPrints" value={draft.limited ? draft.maxPrints : ""} />
                <input type="hidden" name="sourceKind" value={draft.sourceKind ?? ""} />
                <input type="hidden" name="sourceId" value={draft.sourceId ?? ""} />
                <input type="hidden" name="face" value={faceJson} />

                <span class="state" role="status">
                    {#if form?.error}
                        <span class="message-error">{form.error}</span>
                    {:else if message || page.url.searchParams.has("creee")}
                        <span class="message-success">{message || "Carte créée."}</span>
                    {:else if dirty}
                        <span class="muted">Modifications non enregistrées</span>
                    {/if}
                </span>
                <button class="btn btn-accent" disabled={saving || !draft.name.trim()}>
                    {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
            </form>
        </section>
    </div>
</main>

<SourcePicker bind:open={sourcesOpen} sources={data.sources} onpick={applyPrefill} />

<style>
    select {
        padding-top: 0;
        padding-bottom: 0;
    }

    main {
        width: min(1200px, 94%);
        margin: 0 auto;
        padding: 1.5rem 0 6rem;
    }

    .crumbs {
        display: flex;
        gap: 0.5rem;
        align-items: baseline;
        margin-bottom: 1rem;
        font-size: 0.9rem;
    }

    .crumbs a {
        color: var(--primary);
    }

    .layout {
        display: grid;
        grid-template-columns: minmax(260px, 400px) 1fr;
        gap: 2rem;
        align-items: start;
    }

    .stage {
        position: sticky;
        top: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .preview {
        position: relative;
        width: 100%;
        max-width: 400px;
        margin: 0 auto;
    }

    .framer {
        position: absolute;
        inset: 0;
        z-index: 5;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding-bottom: 0.5rem;
        border-radius: 4.6%;
        outline: 2px dashed var(--accent);
        outline-offset: 4px;
        cursor: move;
        touch-action: none;
    }

    .framer span {
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.7);
        font-size: 0.7rem;
        pointer-events: none;
    }

    .stage-tools {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        align-items: center;
    }

    .wear {
        width: 100%;
        max-width: 400px;
        display: flex;
        flex-direction: column;
        font-size: 0.75rem;
        color: var(--muted);
    }

    .wear span {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
    }

    input[type="range"] {
        height: 28px;
        padding: 0;
        background: none;
        border: none;
        accent-color: var(--accent);
    }

    .editor {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-width: 0;
    }

    .top-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
    }

    h1 {
        font-size: 2rem;
        overflow-wrap: anywhere;
    }

    h2 {
        font-size: 1.1rem;
        margin-bottom: 0.6rem;
    }

    .tabs {
        position: sticky;
        top: 0;
        z-index: 6;
        padding: 0.5rem 0;
        background: var(--background);
    }

    .fields {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .field > span {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        font-size: 0.9rem;
    }

    .field small,
    small {
        font-size: 0.72rem;
        color: var(--muted);
    }

    .field input:not([type]),
    .field input[type="number"],
    .field select,
    .row input,
    .row select {
        height: 42px;
        font-size: 17px;
    }

    textarea {
        min-height: 0;
        font-size: 17px;
    }

    .boosters {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }

    .set-dot {
        width: 0.7rem;
        height: 0.7rem;
        border-radius: 50%;
        background: var(--c);
        flex-shrink: 0;
    }

    .check {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
    }

    .inline {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
    }

    .inline input {
        width: 9rem;
    }

    .colors {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        align-items: center;
    }

    .colors input[type="color"] {
        width: 44px;
        height: 32px;
        padding: 0;
        border-radius: var(--radius);
    }

    .swatch {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.2);
    }

    .swatch.on {
        border-color: var(--foreground);
        box-shadow: 0 0 0 2px var(--accent);
    }

    .dragons {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
    }

    .dragons button {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        min-height: 34px;
        padding: 0 0.7rem;
        border: 1px solid var(--border);
        border-radius: 999px;
        background: none;
        color: var(--foreground);
        font-size: 0.78rem;
    }

    .dragons button.on {
        border-color: var(--c);
        background: color-mix(in srgb, var(--c) 18%, transparent);
    }

    .row {
        display: grid;
        grid-template-columns: 1fr 2fr auto;
        gap: 0.4rem;
        align-items: center;
    }

    .row.bar {
        grid-template-columns: 5.5rem 1fr 4.2rem 7rem auto;
    }

    .row-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
    }

    .give .row {
        grid-template-columns: 1fr 5rem auto;
    }

    .copies ul {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        max-height: 16rem;
        overflow: auto;
        font-size: 0.85rem;
    }

    .copies li {
        display: flex;
        gap: 0.75rem;
    }

    .copies a {
        color: var(--accent);
        font-variant-numeric: tabular-nums;
        min-width: 3rem;
    }

    .danger {
        display: flex;
        gap: 0.5rem;
    }

    .savebar {
        position: sticky;
        bottom: 0;
        z-index: 7;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1rem;
        padding: 0.75rem 0;
        background: linear-gradient(transparent, var(--background) 30%);
    }

    .state {
        font-size: 0.85rem;
    }

    @media (max-width: 860px) {
        .layout {
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .stage {
            position: static;
        }

        .preview {
            max-width: min(78vw, 340px);
        }

        .row.bar {
            grid-template-columns: 4.5rem 1fr 3.8rem auto;
        }

        .row.bar select {
            display: none;
        }
    }
</style>
