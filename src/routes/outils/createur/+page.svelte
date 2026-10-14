<script lang="ts">
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
    import { STAT_KEYS, STATS, emptyStats, totalPower } from "$lib/game/stats";

    let { data, form } = $props();

    // --- Générateur ---
    let options = $state({ minPower: 300, maxPower: 450, minStat: 5, maxStat: 100 });
    let stats = $state(emptyStats());
    let generatorError = $state<string | null>(null);

    let range = $derived(powerRange(options.minStat, options.maxStat));
    let sheet = $derived(computeSheet(stats));

    function generate() {
        generatorError = checkOptions(options);
        if (generatorError) return;
        const result = generateStats(options);
        if (result) stats = result;
        else generatorError = "Fourchette trop étroite : élargis l'écart entre minimum et maximum.";
    }

    // --- Noms ---
    const NAME_COUNT = 10;
    let names = $state<string[]>([]);
    function rollNames() {
        names = Array.from({ length: NAME_COUNT }, () => randomName());
    }
    // Tirés au montage seulement : le hasard du serveur et celui du navigateur ne coïncideraient pas.
    $effect(() => {
        rollNames();
    });

    // --- Proposition ---
    let kind = $state("monstre");
    let name = $state("");
    let author = $state("");
    let description = $state("");
    let sending = $state(false);

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
        <p class="muted">
            Tire des stats au hasard dans une fourchette de puissance, retouche-les, donne un nom et
            une histoire à ta création, puis propose-la au MJ. S'il l'adopte, elle rejoindra les
            personnages ou le bestiaire.
        </p>
    </header>

    <section class="panel">
        <h2>1. Les stats</h2>

        <div class="presets" role="group" aria-label="Difficulté">
            {#each Object.entries(PRESETS) as [label, preset] (label)}
                <button
                    type="button"
                    class="btn btn-small"
                    class:active={options.minPower === preset.minPower && options.maxPower === preset.maxPower}
                    onclick={() => {
                        options.minPower = preset.minPower;
                        options.maxPower = preset.maxPower;
                        generate();
                    }}
                >
                    {label}
                </button>
            {/each}
        </div>

        <div class="options">
            <label>
                Puissance minimale
                <input type="number" min="0" bind:value={options.minPower} />
            </label>
            <label>
                Puissance maximale
                <input type="number" min="0" bind:value={options.maxPower} />
            </label>
            <label>
                Minimum par stat
                <input type="number" min="0" bind:value={options.minStat} />
            </label>
            <label>
                Maximum par stat
                <input type="number" min="0" bind:value={options.maxStat} />
            </label>
        </div>
        <p class="muted hint">
            Avec ces bornes, la puissance va de {range.min} à {range.max}. Les stats sont tirées sur
            une échelle de 0 à 100 ; QDF et HP sont ensuite multipliés par 30, END par 20.
        </p>

        <div class="generate">
            <Cta text="Générer" dragon="Guizamark" border="Yinva" onClick={generate} />
        </div>
        {#if generatorError}
            <p class="message-error" role="alert">{generatorError}</p>
        {/if}

        <div class="stats">
            <StatsPanel {sheet} />
        </div>
    </section>

    <form
        method="POST"
        action="?/submit"
        enctype="multipart/form-data"
        use:enhance={({ formElement }) => {
            sending = true;
            return async ({ update, result }) => {
                await update({ reset: false });
                sending = false;
                if (result.type === "success") {
                    name = "";
                    description = "";
                    stats = emptyStats();
                    // Le fichier choisi ne doit pas repartir avec la proposition suivante.
                    formElement.querySelector<HTMLInputElement>("input[type=file]")!.value = "";
                }
            };
        }}
    >
        <section class="panel">
            <h2>2. Retouches</h2>
            <p class="muted">Chaque valeur peut être modifiée à la main ; les barres suivent.</p>
            <div class="grid">
                {#each STAT_KEYS as key (key)}
                    <label>
                        <span title={STATS[key].label}>{STATS[key].abbr}</span>
                        <input type="number" name={key} min="0" bind:value={stats[key]} />
                    </label>
                {/each}
            </div>
            <p class="power">Puissance totale : <strong>{totalPower(stats)}</strong></p>
        </section>

        <section class="panel">
            <h2>3. Un nom</h2>
            <div class="names">
                {#each names as suggestion, i (i)}
                    <button type="button" class="btn btn-small" onclick={() => (name = suggestion)}>
                        {suggestion}
                    </button>
                {/each}
                <button type="button" class="btn btn-small btn-accent" onclick={rollNames}>
                    Autres noms
                </button>
            </div>
            <p class="muted">Clique sur un nom pour le reprendre, ou écris le tien plus bas.</p>
        </section>

        <section class="panel">
            <h2>4. Proposer au MJ</h2>

            <div class="kinds" role="radiogroup" aria-label="Type">
                <label class:active={kind === "personnage"}>
                    <input type="radio" name="kind" value="personnage" bind:group={kind} />
                    <img src="/personnages/Personnages.svg" alt="" /> Personnage
                </label>
                <label class:active={kind === "monstre"}>
                    <input type="radio" name="kind" value="monstre" bind:group={kind} />
                    <img src="/personnages/Bestiaire.svg" alt="" /> Monstre
                </label>
            </div>

            <div class="fields">
                <label>
                    Nom *
                    <input type="text" name="name" maxlength="255" required bind:value={name} />
                </label>
                <label>
                    Ton pseudo
                    <input
                        type="text"
                        name="author"
                        maxlength="100"
                        placeholder={data.user?.login ?? "Anonyme"}
                        bind:value={author}
                    />
                </label>
                <label class="wide">
                    Description
                    <textarea
                        name="description"
                        maxlength="5000"
                        placeholder="Son histoire, son apparence, ses pouvoirs, où on le croise…"
                        bind:value={description}
                    ></textarea>
                </label>
                <label class="wide">
                    Image (facultative, 8 Mo maximum)
                    <input
                        type="file"
                        name="image"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                    />
                </label>
                <!-- Piège à robots : invisible pour les humains. -->
                <label class="trap" aria-hidden="true">
                    Site web
                    <input type="text" name="website" tabindex="-1" autocomplete="off" />
                </label>
            </div>

            <Cta
                text={sending ? "Envoi…" : `Proposer ce ${kind === "monstre" ? "monstre" : "personnage"}`}
                dragon="Yinva"
                border="Artrish"
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
        width: min(60rem, 92%);
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
        margin-bottom: 1rem;
    }

    section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .presets,
    .names {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .presets .active {
        background-color: var(--accent);
        border-color: var(--accent);
        color: var(--background);
    }

    .options,
    .grid {
        display: grid;
        gap: 0.75rem;
    }

    .options {
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    }

    .grid {
        grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.95rem;
    }

    .options input,
    .grid input {
        height: 40px;
        padding: 0 0.6rem;
    }

    .hint {
        font-size: 0.85rem;
    }

    .generate {
        max-width: 20rem;
    }

    .stats {
        margin-top: 0.5rem;
    }

    .power {
        font-family: var(--titleFont);
        font-size: 1.2rem;
    }

    .kinds {
        display: flex;
        gap: 1rem;
    }

    .kinds label {
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

    @media (max-width: 600px) {
        .fields {
            grid-template-columns: 1fr;
        }
    }
</style>
