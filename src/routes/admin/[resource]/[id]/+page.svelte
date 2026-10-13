<script lang="ts">
    import { enhance } from "$app/forms";
    import FieldInput from "$lib/components/admin/FieldInput.svelte";
    import Modal from "$lib/components/ui/Modal.svelte";

    let { data, form } = $props();

    let base = $derived(`/admin/${data.resource.slug}`);
    let title = $derived(data.record?.title ?? `Nouveau : ${data.resource.singular}`);
    let confirmDelete = $state(false);
    let saving = $state(false);
</script>

<svelte:head>
    <title>{title} : Espace MJ</title>
</svelte:head>

<main>
    <a class="muted back" href={base}>← {data.resource.label}</a>
    <h1>{title}</h1>

    <!-- La clé recrée le formulaire quand on passe d'un enregistrement à un autre. -->
    {#key data.record?.values.id}
        <form
            method="POST"
            action="?/save"
            enctype="multipart/form-data"
            use:enhance={({ formElement }) => {
                saving = true;
                return async ({ update, result }) => {
                    // Les champs gardent ce qui vient d'être saisi au lieu de revenir à leur valeur d'origine.
                    await update({ reset: false });
                    saving = false;
                    if (result.type !== "success") return;
                    // Sauf les fichiers et mots de passe, qui ne doivent pas repartir au prochain envoi.
                    for (const input of formElement.querySelectorAll<HTMLInputElement>(
                        "input[type=file], input[type=password]",
                    )) {
                        input.value = "";
                    }
                };
            }}
        >
            <div class="fields">
                {#each data.fields as field (field.name)}
                    <FieldInput
                        {field}
                        values={data.record?.values ?? {}}
                        options={data.options[field.name]}
                    />
                {/each}
            </div>

            <div class="bar">
                <button class="btn btn-accent" disabled={saving}>
                    {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
                {#if form?.message}
                    <span class="message-success" role="status">{form.message}</span>
                {/if}
                {#if form?.error}
                    <span class="message-error" role="alert">{form.error}</span>
                {/if}
                {#if data.record}
                    <button type="button" class="btn btn-danger delete" onclick={() => (confirmDelete = true)}>
                        Supprimer
                    </button>
                {/if}
            </div>
        </form>
    {/key}
</main>

<Modal bind:open={confirmDelete} title="Supprimer « {data.record?.title} » ?">
    <p>
        La suppression est définitive et emporte ce qui en dépend (inventaire d'un joueur, passifs
        d'un personnage, exemplaires d'un objet…).
    </p>
    <form method="POST" action="?/delete" use:enhance class="confirm">
        <button type="button" class="btn" onclick={() => (confirmDelete = false)}>Annuler</button>
        <button class="btn btn-danger">Supprimer définitivement</button>
    </form>
</Modal>

<style>
    main {
        width: min(60rem, 94%);
        margin: 0 auto;
        padding: 2rem 0 4rem;
    }

    .back {
        font-size: 0.9rem;
    }

    .back:hover {
        color: var(--accent);
    }

    h1 {
        font-size: 2.2rem;
        margin-bottom: 1.5rem;
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

    .delete {
        margin-left: auto;
    }

    .confirm {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
    }
</style>
