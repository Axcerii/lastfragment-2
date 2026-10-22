<script lang="ts">
    // Interrupteur. Dans un formulaire, `name` envoie "on" quand il est activé.
    let {
        checked = $bindable(false),
        name,
        label,
        disabled = false,
        autosubmit = false,
        onchange,
    }: {
        checked?: boolean;
        name?: string;
        label: string;
        disabled?: boolean;
        /** Valide le formulaire parent dès que l'interrupteur change. */
        autosubmit?: boolean;
        onchange?: (checked: boolean) => void;
    } = $props();
</script>

<label class:disabled>
    <input
        type="checkbox"
        {name}
        {disabled}
        bind:checked
        onchange={(e) => {
            onchange?.(checked);
            if (autosubmit) e.currentTarget.form?.requestSubmit();
        }}
    />
    <span class="switch" aria-hidden="true"></span>
    <span>{label}</span>
</label>

<style>
    label {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        cursor: pointer;
    }

    label.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }

    .switch {
        position: relative;
        width: 2.6rem;
        height: 1.4rem;
        border-radius: 999px;
        background-color: rgba(255, 255, 255, 0.15);
        border: 1px solid var(--border);
        transition: var(--transition);
        flex-shrink: 0;
    }

    .switch::after {
        content: "";
        position: absolute;
        top: 2px;
        left: 2px;
        width: calc(1.4rem - 4px);
        height: calc(1.4rem - 4px);
        border-radius: 50%;
        background-color: var(--foreground);
        transition: var(--transition);
    }

    input:checked + .switch {
        background-color: var(--primary);
    }

    input:checked + .switch::after {
        left: calc(100% - 1.4rem + 2px);
        background-color: var(--background);
    }

    input:focus-visible + .switch {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
    }
</style>
