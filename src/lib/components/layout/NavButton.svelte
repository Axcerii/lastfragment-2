<script lang="ts">
    // Lien de navigation, ou bouton d'action (déconnexion) quand `action` est fourni.
    let {
        href = "",
        action = "",
        label,
        active = false,
    }: { href?: string; action?: string; label: string; active?: boolean } =
        $props();
</script>

{#if action}
    <form method="POST" {action} class="nav-link">
        <button type="submit">
            <span class="background"></span>
            <span class="label">{label}</span>
        </button>
    </form>
{:else}
    <a {href} class="nav-link" aria-current={active ? "page" : undefined}>
        <span class="background" class:active></span>
        <span class="label">{label}</span>
    </a>
{/if}

<style>
    .nav-link {
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        position: relative;
        width: 100%;
        height: 100%;
        border-left: 1px solid var(--primary);
        transition: opacity ease-in-out 800ms;
        font-size: 20px;
        z-index: 999;
        background-color: var(--background);
    }

    button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        background: none;
        border: none;
        color: inherit;
        font-size: inherit;
    }

    .background {
        width: 100%;
        height: 100%;
        background-size: cover;
        top: 0;
        left: 0;
        position: absolute;
        background-image: url("/layout/Tampon_Mapping_active.png");
        opacity: 40%;
        z-index: 998;
        transition: all ease-in-out 400ms;
        filter: invert(100%);
    }
    .active {
        filter: invert(0%);
    }

    .nav-link:hover .background {
        filter: invert(0%);
    }

    .label {
        position: relative;
        z-index: 1001;
    }

    @media screen and (max-width: 600px) {
        .nav-link {
            padding: 20px 0;
            border-bottom: 1px solid var(--primary);
            border-left: none;
            box-sizing: border-box;
        }
    }
</style>
