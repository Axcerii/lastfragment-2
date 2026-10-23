<script lang="ts">
    import { onMount } from "svelte";
    import { enhance } from "$app/forms";
    import StatsPanel from "$lib/components/game/StatsPanel.svelte";
    import Cta from "$lib/components/Cta.svelte";
    import { computeSheet } from "$lib/game/bonus";
    import {
        PRESETS,
        checkOptions,
        generateStats,
        powerRange,
        randomName,
    } from "$lib/game/generator";
    import { emptyStats } from "$lib/game/stats";

    let { data, form } = $props();

    // --- Générateur ---
    let options = $state({ minPower: 300, maxPower: 450, minStat: 5, maxStat: 100 });
    let stats = $state(emptyStats());
    let generatorError = $state<string | null>(null);

    let range = $derived(powerRange(options.minStat, options.maxStat));
    let sheet = $derived(computeSheet(stats));

    // Une couleur de dragon par difficulté, de la plus douce à la plus sombre.
    const PRESET_DRAGONS: Record<keyof typeof PRESETS, string> = {
        Facile: "Guizamark",
        Normal: "Lada",
        Difficile: "Chronos",
        Boss: "Shizari",
    };

    // Les bornes de puissance et celles de chaque stat ont chacune leur fond.
    const OPTION_FIELDS = [
        { key: "minPower", label: "Puissance minimale", power: true },
        { key: "maxPower", label: "Puissance maximale", power: true },
        { key: "minStat", label: "Minimum par stat", power: false },
        { key: "maxStat", label: "Maximum par stat", power: false },
    ] as const;

    function generate() {
        generatorError = checkOptions(options);
        if (generatorError) return;
        const result = generateStats(options);
        if (result) stats = result;
        else generatorError = "Fourchette trop étroite : élargis l'écart entre minimum et maximum.";
    }

    // Entrée dans une borne relance le tirage au lieu d'envoyer la proposition.
    function generateOnEnter(event: KeyboardEvent) {
        if (event.key !== "Enter") return;
        event.preventDefault();
        generate();
    }

    // --- Proposition ---
    let kind = $state("monstre");
    let name = $state("");
    let author = $state("");
    let description = $state("");
    let sending = $state(false);

    // Image choisie, prévisualisée avant l'envoi.
    let fileInput = $state<HTMLInputElement>();
    let preview = $state<string | null>(null);

    function showPreview() {
        if (preview) URL.revokeObjectURL(preview);
        const file = fileInput?.files?.[0];
        preview = file ? URL.createObjectURL(file) : null;
    }

    // Tiré au montage seulement : le hasard du serveur et celui du navigateur ne coïncideraient pas.
    onMount(() => {
        name ||= randomName();
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    });

    // Après un refus du serveur, on retrouve ce qui avait été saisi.
    $effect(() => {
        if (form?.error) {
            kind = form.kind ?? kind;
            name = form.name ?? name;
            author = form.author ?? author;
            description = form.description ?? description;
        }
    });
</script>

<svelte:head>
    <title>Créateur de personnage : Outils</title>
</svelte:head>

<main>
    <header>
        <a class="muted back" href="/outils">← Outils</a>
        <h1>Créateur de personnage</h1>
    </header>

    <form
        method="POST"
        action="?/submit"
        enctype="multipart/form-data"
        use:enhance={() => {
            sending = true;
            return async ({ update, result }) => {
                await update({ reset: false });
                sending = false;
                if (result.type === "success") {
                    name = randomName();
                    description = "";
                    stats = emptyStats();
                    // Le fichier choisi ne doit pas repartir avec la proposition suivante.
                    if (fileInput) fileInput.value = "";
                    showPreview();
                }
            };
        }}
    >
        <section class="panel">
            <div class="layout">
                <div class="generator">
                    <h2>1. Les stats</h2>

                    <div class="presets" role="group" aria-label="Difficulté">
                        {#each Object.entries(PRESETS) as [label, preset] (label)}
                            <Cta
                                text={label}
                                dragon={PRESET_DRAGONS[label as keyof typeof PRESETS]}
                                border="Artrish"
                                onClick={() => {
                                    options.minPower = preset.minPower;
                                    options.maxPower = preset.maxPower;
                                    generate();
                                }}
                            />
                        {/each}
                    </div>

                    <div class="options">
                        {#each OPTION_FIELDS as field (field.key)}
                            <label class:power={field.power}>
                                {field.label}
                                <input
                                    type="number"
                                    min="0"
                                    bind:value={options[field.key]}
                                    oninput={() => (generatorError = null)}
                                    onkeydown={generateOnEnter}
                                />
                            </label>
                        {/each}
                    </div>
                    <p class="muted hint">
                        Avec ces bornes, la puissance va de {range.min} à {range.max}. Les stats sont
                        tirées sur une échelle de 0 à 100 ; QDF et HP sont ensuite multipliés par 30,
                        END par 20.
                    </p>

                    <div class="generate">
                        <Cta text="Générer" dragon="Artrish" onClick={generate} />
                    </div>
                    {#if generatorError}
                        <p class="message-error" role="alert">{generatorError}</p>
                    {/if}
                </div>

                <div class="identity">
                    <label>
                        Nom
                        <input type="text" name="name" maxlength="255" required bind:value={name} />
                    </label>
                    <Cta
                        text="Générer un autre nom"
                        dragon="Artrish"
                        onClick={() => (name = randomName())}
                    />

                    <label class="image" class:filled={!!preview}>
                        {#if preview}
                            <img src={preview} alt="Aperçu du fichier choisi" />
                        {:else}
                            <span>Ajouter une image</span>
                            <span class="muted">Facultative, 8 Mo maximum</span>
                        {/if}
                        <input
                            type="file"
                            name="image"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            bind:this={fileInput}
                            onchange={showPreview}
                        />
                    </label>
                </div>

                <div class="sheet">
                    <StatsPanel {sheet} bind:values={stats} />
                </div>
            </div>
        </section>

        <section class="panel">
            <h2>2. Proposer au MJ</h2>

            <div class="kinds" role="radiogroup" aria-label="Type">
                <label class:active={kind === "personnage"}>
                    <input type="radio" name="kind" value="personnage" bind:group={kind} />
                    <img src="/dragons/tampons/Artrish.svg" alt="" /> Personnage
                </label>
                <label class:active={kind === "monstre"}>
                    <input type="radio" name="kind" value="monstre" bind:group={kind} />
                    <img src="/dragons/tampons/Yinva.svg" alt="" /> Monstre
                </label>
            </div>

            <div class="fields">
                {#if data.user}
                    <p class="author">Proposé par <strong>{data.user.login}</strong></p>
                {:else}
                    <label>
                        Ton pseudo
                        <input
                            type="text"
                            name="author"
                            maxlength="100"
                            placeholder="Anonyme"
                            bind:value={author}
                        />
                    </label>
                {/if}
                <label class="wide">
                    Description
                    <textarea
                        name="description"
                        maxlength="5000"
                        placeholder="Son histoire, son apparence, ses pouvoirs, où on le croise…"
                        bind:value={description}
                    ></textarea>
                </label>
                <!-- Piège à robots : invisible pour les humains. -->
                <label class="trap" aria-hidden="true">
                    Site web
                    <input type="text" name="website" tabindex="-1" autocomplete="off" />
                </label>
            </div>

            <Cta
                text={sending ? "Envoi…" : `Proposer ce ${kind === "monstre" ? "monstre" : "personnage"}`}
                dragon="Artrish"
                disabled={sending}
            />

            {#if form?.submitted}
                <p class="message-success" role="status">
                    Merci ! {form.name ? `« ${form.name} » a été envoyé` : "C'est envoyé"} au MJ, qui
                    décidera de son sort.
                </p>
            {/if}
            {#if form?.error}
                <p class="message-error" role="alert">{form.error}</p>
            {/if}
        </section>
    </form>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        width: min(72rem, 92%);
        margin: 0 auto;
        padding: 2rem 0 4rem;
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .back {
        font-size: 0.9rem;
    }

    .back:hover {
        color: var(--accent);
    }

    h1 {
        font-size: 2.4rem;
        margin-bottom: 0.5rem;
    }

    h2 {
        font-size: 1.5rem;
    }

    section,
    .generator,
    .identity,
    .sheet {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    /* Le tirage juste au-dessus des stats ; le nom et l'image en haut à droite, à la hauteur du tirage. */
    .layout {
        display: grid;
        grid-template-columns: 1fr 17rem;
        grid-template-areas:
            "generator identity"
            "sheet sheet";
        gap: 2rem;
    }

    .generator {
        grid-area: generator;
    }

    .identity {
        grid-area: identity;
    }

    .sheet {
        grid-area: sheet;
    }

    .presets {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
        gap: 0.5rem;
    }

    .options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
        gap: 0.75rem;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.95rem;
    }

    .options input {
        height: 40px;
        padding: 0 0.6rem;
    }

    .options .power input {
        background-color: var(--secondary);
    }

    .hint {
        font-size: 0.85rem;
    }

    .generate {
        max-width: 20rem;
    }

    /* Toute la zone ouvre le choix du fichier ; l'aperçu la remplace une fois l'image choisie.
       Elle remplit la hauteur laissée par le tirage, sans jamais l'agrandir. */
    .image {
        position: relative;
        flex: 1 1 0;
        min-height: 8rem;
        align-items: center;
        justify-content: center;
        border: 1px dashed var(--border);
        border-radius: var(--radius);
        overflow: hidden;
        text-align: center;
        cursor: pointer;
        transition: var(--transition);
    }

    .image:hover,
    .image:has(input:focus-visible) {
        border-color: var(--accent);
    }

    .image.filled {
        border-style: solid;
    }

    .image img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .image .muted {
        font-size: 0.85rem;
    }

    .image input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
    }

    .kinds {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .kinds label {
        flex: 1 1 0;
        min-width: 0;
        justify-content: center;
        flex-direction: row;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 1rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        cursor: pointer;
        transition: var(--transition);
    }

    .kinds label.active {
        border-color: var(--accent);
        background-color: rgba(229, 184, 204, 0.12);
    }

    .kinds input {
        position: absolute;
        opacity: 0;
    }

    .kinds label:has(input:focus-visible) {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
    }

    .kinds img {
        width: 2.5rem;
        height: 2.5rem;
        filter: invert(90%) sepia(13%) saturate(311%) hue-rotate(52deg) brightness(101%)
            contrast(81%);
    }

    .fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .author {
        align-self: end;
        font-size: 1.1rem;
    }

    .wide {
        grid-column: 1 / -1;
    }

    .trap {
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
    }

    @media (max-width: 800px) {
        .layout {
            grid-template-columns: 1fr;
            grid-template-areas:
                "identity"
                "generator"
                "sheet";
        }

        .image {
            min-height: 12rem;
        }
    }

    @media (max-width: 600px) {
        .fields {
            grid-template-columns: 1fr;
        }

        .kinds {
            gap: 0.5rem;
        }

        .kinds label {
            gap: 0.5rem;
            padding: 0.5rem;
        }

        .kinds img {
            width: 2rem;
            height: 2rem;
        }
    }

    /* Trop étroit pour deux boutons côte à côte : ils s'empilent. */
    @media (max-width: 380px) {
        .kinds {
            flex-direction: column;
        }
    }
</style>
