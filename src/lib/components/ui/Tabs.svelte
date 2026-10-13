<script lang="ts" generics="T extends string">
    // Onglets : une rangée de boutons dont un seul est actif.
    let {
        value = $bindable(),
        options,
        label,
    }: {
        value: T;
        options: { value: T; label: string; badge?: string | number }[];
        label: string;
    } = $props();
</script>

<div class="tabs" role="tablist" aria-label={label}>
    {#each options as option (option.value)}
        <button
            type="button"
            role="tab"
            aria-selected={value === option.value}
            class:active={value === option.value}
            onclick={() => (value = option.value)}
        >
            {option.label}
            {#if option.badge !== undefined}
                <span class="badge">{option.badge}</span>
            {/if}
        </button>
    {/each}
</div>

<style>
    .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    button {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        min-height: 40px;
        padding: 0 1rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background-color: transparent;
        color: var(--foreground);
        font-size: 18px;
        transition: var(--transition);
    }

    button:hover {
        border-color: var(--accent);
    }

    button.active {
        background-color: var(--accent);
        border-color: var(--accent);
        color: var(--background);
    }

    .badge {
        font-size: 0.8em;
        opacity: 0.75;
        font-variant-numeric: tabular-nums;
    }
</style>
