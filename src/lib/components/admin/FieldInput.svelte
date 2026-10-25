<script lang="ts">
    import DragonPicker from "./DragonPicker.svelte";
    import EffectsEditor from "./EffectsEditor.svelte";
    import StatsEditor from "$lib/components/game/StatsEditor.svelte";
    import Toggle from "$lib/components/ui/Toggle.svelte";
    import type { Field, Option } from "$lib/admin/fields";
    import { parsePair } from "$lib/game/badges";
    import { DRAGONS } from "$lib/game/labels";
    import { emptyStats } from "$lib/game/stats";
    import { BONUS_KINDS, WEAPON_BONUS_KINDS, weaponBonusValue } from "$lib/game/weapons";

    // Champ de formulaire du back-office, choisi d'après le type décrit dans la ressource.
    let {
        field,
        values,
        options = [],
    }: {
        field: Field;
        /** Valeurs actuelles de l'enregistrement ; vide pour une création. */
        values: Record<string, any>;
        options?: Option[];
    } = $props();

    let value = $derived(values[field.name]);
    let id = $derived(`field-${field.name}`);
    let pair = $derived(field.type === "badgePair" ? parsePair(value ?? "") : null);
</script>

<div class="field" class:wide={["textarea", "effects", "stats", "armor", "armorOverride", "dragons"].includes(field.type)}>
    {#if field.type === "flag" || field.type === "boolean"}
        <Toggle name={field.name} label={field.label} checked={Boolean(value)} />
    {:else}
        <label for={id}>
            {field.label}{#if field.required}<span class="required" title="Obligatoire">*</span>{/if}
        </label>

        {#if field.type === "text"}
            <input {id} type="text" name={field.name} value={value ?? ""} required={field.required} />
        {:else if field.type === "number"}
            <input {id} type="number" name={field.name} value={value ?? 0} required={field.required} />
        {:else if field.type === "password"}
            <input {id} type="password" name={field.name} autocomplete="new-password" />
        {:else if field.type === "textarea"}
            <textarea {id} name={field.name} required={field.required}>{value ?? ""}</textarea>
        {:else if field.type === "select"}
            <select {id} name={field.name} required={field.required}>
                {#each field.options as o (o.value)}
                    <option value={o.value} selected={o.value === value}>{o.label}</option>
                {/each}
            </select>
        {:else if field.type === "relation"}
            <select {id} name={field.name} required={!field.nullLabel}>
                {#if field.nullLabel}
                    <option value="">{field.nullLabel}</option>
                {:else if value == null}
                    <option value="" disabled selected>Choisir…</option>
                {/if}
                {#each options as o (o.value)}
                    <option value={o.value} selected={o.value === value}>{o.label}</option>
                {/each}
            </select>
        {:else if field.type === "image"}
            <div class="image">
                {#if value}
                    <img src={value} alt="" />
                    <!-- Reprise de l'image existante quand on crée à partir d'un brouillon. -->
                    <input type="hidden" name="{field.name}_current" value={value} />
                {/if}
                <div>
                    <input
                        {id}
                        type="file"
                        name={field.name}
                        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                        required={field.required && !value}
                    />
                    {#if value && !field.required}
                        <Toggle name="{field.name}_remove" label="Retirer l'image actuelle" />
                    {/if}
                </div>
            </div>
        {:else if field.type === "effects"}
            <EffectsEditor
                statsName={field.name}
                valuesName={field.valuesField}
                inactiveName={field.inactiveField}
                stats={value}
                values={values[field.valuesField]}
                inactive={field.inactiveField ? values[field.inactiveField] : ""}
                bareAs={field.bareAs}
            />
        {:else if field.type === "badgePair"}
            <div class="pair">
                {#each [0, 1] as i}
                    <select name="{field.name}_{i + 1}" aria-label="Badge {i + 1}" required>
                        {#each DRAGONS as dragon}
                            <option value={dragon} selected={pair?.[i] === dragon}>{dragon}</option>
                        {/each}
                    </select>
                {/each}
            </div>
        {:else if field.type === "dragons"}
            <DragonPicker name={field.name} {value} />
        {:else if field.type === "weaponBonus"}
            <!-- Une valeur X par bonus ; vide ou 0 : l'arme n'a pas ce bonus. -->
            <div class="bonuses">
                {#each WEAPON_BONUS_KINDS as kind (kind)}
                    <label class="bonus">
                        {BONUS_KINDS[kind].field}
                        <input
                            type="number"
                            min="0"
                            step="1"
                            name="{field.name}_{kind}"
                            value={weaponBonusValue(value, kind) || ""}
                            placeholder="0 = aucun"
                        />
                    </label>
                {/each}
            </div>
        {:else if field.type === "stats"}
            <StatsEditor stats={value ?? emptyStats()} />
        {:else if field.type === "armor"}
            <EffectsEditor
                statsName="armor_statistics"
                valuesName="armor_values"
                stats={value?.statistics}
                values={value?.values}
                bareAs="flat"
            />
        {:else if field.type === "armorOverride"}
            <div class="override">
                <EffectsEditor
                    statsName="override_statistics"
                    valuesName="override_values"
                    stats={value?.statistics}
                    values={value?.values}
                    bareAs="flat"
                />
                <label for="{id}-description">Description ajoutée</label>
                <input
                    id="{id}-description"
                    type="text"
                    name="override_descriptionAdd"
                    value={value?.descriptionAdd ?? ""}
                    maxlength="255"
                />
                <label for="{id}-notes">Notes du MJ (jamais montrées aux joueurs)</label>
                <textarea id="{id}-notes" name="override_notes">{value?.notes ?? ""}</textarea>
            </div>
        {/if}
    {/if}

    {#if field.help}
        <p class="muted help">{field.help}</p>
    {/if}
</div>

<style>
    .field {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }

    .field.wide {
        grid-column: 1 / -1;
    }

    .bonuses {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }

    .bonus {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        max-width: 20rem;
    }

    .required {
        color: var(--accent);
        margin-left: 0.2rem;
    }

    .help {
        font-size: 0.85rem;
    }

    .image {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .image > div {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
    }

    .image img {
        width: 6rem;
        height: 6rem;
        object-fit: contain;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background-color: #101010;
    }

    .pair {
        display: flex;
        gap: 0.75rem;
    }

    .override {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .override textarea {
        min-height: 5rem;
    }
</style>
