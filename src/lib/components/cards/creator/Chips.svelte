<script lang="ts" generics="T extends string | number">
    // Choix unique en pastilles (type, rareté, finition…), plus rapide qu'une liste déroulante au doigt.
    import Icon from "$lib/components/ui/Icon.svelte";

    let {
        value = $bindable(),
        options,
        label,
        onchange,
    }: {
        value: T;
        options: { value: T; label: string; hint?: string; color?: string; icon?: string }[];
        label: string;
        onchange?: (value: T) => void;
    } = $props();
</script>

<div class="chips" role="radiogroup" aria-label={label}>
    {#each options as option (option.value)}
        <button
            type="button"
            role="radio"
            aria-checked={value === option.value}
            class:on={value === option.value}
            title={option.hint}
            style={option.color ? `--c: ${option.color}` : undefined}
            onclick={() => {
                value = option.value;
                onchange?.(option.value);
            }}
        >
            {#if option.icon}<Icon src={option.icon} color="currentColor" size="1rem" />{/if}
            {#if option.color && !option.icon}<i></i>{/if}
            {option.label}
        </button>
    {/each}
</div>

<style>
    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
    }

    button {
        --c: var(--accent);
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        min-height: 36px;
        padding: 0 0.8rem;
        border: 1px solid var(--border);
        border-radius: 999px;
        background: transparent;
        color: var(--foreground);
        font-size: 0.8rem;
        transition: var(--transition);
    }

    button:hover {
        border-color: var(--c);
    }

    button.on {
        border-color: var(--c);
        background: color-mix(in srgb, var(--c) 22%, transparent);
        box-shadow: inset 0 0 0 1px var(--c);
    }

    i {
        width: 0.7rem;
        height: 0.7rem;
        border-radius: 50%;
        background: var(--c);
    }
</style>
