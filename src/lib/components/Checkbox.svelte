<script lang="ts">
    // Case à icône de la maquette : carré bordé, icône en vert (primary) qui passe en rose (accent)
    // une fois cochée ou au survol. En radio, `group` porte la valeur choisie ; en checkbox, `checked` l'état.
    let {
        icon = "/dragons/normal/Artrish.svg",
        label,
        type = "radio",
        name = "",
        value = "",
        group = $bindable(),
        checked = $bindable(false),
        size = "large",
        controls,
    }: {
        /** SVG ou PNG à fond transparent, recoloré par masque. */
        icon?: string;
        label: string;
        type?: "radio" | "checkbox";
        name?: string;
        value?: string;
        group?: string;
        checked?: boolean;
        /** large : 97 px (67 px sur mobile) · small : 67 px. */
        size?: "large" | "small";
        /** Identifiant de l'élément ouvert par cette case (accessibilité). */
        controls?: string;
    } = $props();
</script>

<label class="checkbox-container {size}" title={label}>
    {#if type === "radio"}
        <input type="radio" {name} {value} bind:group class="checkbox" />
    {:else}
        <input
            type="checkbox"
            {name}
            bind:checked
            class="checkbox"
            aria-controls={controls}
            aria-expanded={controls ? checked : undefined}
        />
    {/if}
    <span class="icon" style="--icon: url('{encodeURI(icon)}')"></span>
    <span class="sr-only">{label}</span>
</label>

<style>
    .checkbox-container {
        position: relative;
        display: flex;
        flex-shrink: 0;
        border: 1px solid var(--accent);
        border-radius: var(--radius);
        box-sizing: border-box;
        cursor: pointer;
    }

    .large {
        width: 97px;
        height: 97px;
    }

    .small {
        width: 67px;
        height: 67px;
    }

    .icon {
        width: 100%;
        height: 100%;
        background-color: var(--primary);
        mask: var(--icon) center / 70% no-repeat;
        -webkit-mask: var(--icon) center / 70% no-repeat;
        transition: var(--transition);
    }

    .checkbox {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }

    .checkbox:checked + .icon,
    .checkbox-container:hover > .icon {
        background-color: var(--accent);
    }

    .checkbox:focus-visible + .icon {
        outline: 2px solid var(--accent);
        outline-offset: 4px;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
    }

    @media (max-width: 600px) {
        .large {
            width: 67px;
            height: 67px;
        }
    }
</style>
