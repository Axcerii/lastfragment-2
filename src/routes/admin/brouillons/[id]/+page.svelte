<script lang="ts">
    import { enhance } from "$app/forms";
    import FieldInput from "$lib/components/admin/FieldInput.svelte";

    let { data, form } = $props();

    let saving = $state(false);
</script>

<svelte:head>
    <title>Valider « {data.draft.name} » : Espace MJ</title>
</svelte:head>

<main>
    <a class="muted back" href="/admin/brouillons">← Brouillons</a>
    <h1>Valider « {data.draft.name} »</h1>
    <p class="muted">
        Proposé par {data.draft.author ?? "un anonyme"}. Complète les champs manquants : à
        l'enregistrement, la fiche est créée {data.kind === "monstre" ? "dans le bestiaire" : "parmi les personnages"}
        (cachée aux joueurs tant que tu ne la rends pas visible) et le brouillon disparaît.
    </p>

    <nav class="kinds" aria-label="Créer en tant que">
        <a href="?type=personnage" class:active={data.kind === "personnage"} data-sveltekit-replacestate>
            Personnage
        </a>
        <a href="?type=monstre" class:active={data.kind === "monstre"} data-sveltekit-replacestate>
            Monstre
        </a>
    </nav>

    <!-- La clé recrée le formulaire quand on change de type. -->
    {#key data.kind}
        <form
            method="POST"
            action="?/validate&type={data.kind}"
            enctype="multipart/form-data"
            use:enhance={() => {
                saving = true;
                return async ({ update }) => {
                    await update({ reset: false });
                    saving = false;
                };
            }}
        >
            <div class="fields">
                {#each data.fields as field (field.name)}
                    <FieldInput {field} values={data.values} options={data.options[field.name]} />
                {/each}
            </div>

            <div class="bar">
                <button class="btn btn-accent" disabled={saving}>
                    {saving ? "Création…" : `Créer ${data.kind === "monstre" ? "le monstre" : "le personnage"}`}
                </button>
                {#if form?.error}
                    <span class="message-error" role="alert">{form.error}</span>
                {/if}
            </div>
        </form>
    {/key}
</main>

<style>
    main {
        width: min(60rem, 94%);
        margin: 0 auto;
        padding: 2rem 0 4rem;
    }

    .back {
        font-size: 0.9rem;
    }

    h1 {
        font-size: 2.2rem;
        margin-bottom: 0.5rem;
    }

    .kinds {
        display: flex;
        gap: 0.5rem;
        margin: 1.5rem 0;
    }

    .kinds a {
        padding: 0.4rem 1rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        transition: var(--transition);
    }

    .kinds a.active {
        background-color: var(--accent);
        border-color: var(--accent);
        color: var(--background);
    }

    .fields {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
        gap: 1.25rem 1.5rem;
    }

    .bar {
        position: sticky;
        bottom: 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1rem;
        margin-top: 2rem;
        padding: 1rem 0;
        background-color: var(--background);
        border-top: 1px solid var(--border);
    }
</style>
