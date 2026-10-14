<script lang="ts">
    let {
        volumes = $bindable(),
        unlocked,
    }: {
        volumes: { music: number; ambience: number; effects: number; muted: boolean };
        unlocked: boolean;
    } = $props();

    let open = $state(false);
</script>

<div class="volume">
    <button
        class="btn btn-small"
        class:pulse={!unlocked}
        onclick={() => (open = !open)}
        aria-expanded={open}
        title={unlocked ? "Volumes" : "Clique n'importe où pour activer le son"}
    >
        {volumes.muted ? "🔇" : "🔊"}
        {#if !unlocked}<span>Activer le son</span>{/if}
    </button>
    {#if open}
        <div class="popover">
            <label>Musique <input type="range" min="0" max="1" step="0.05" bind:value={volumes.music} /></label>
            <label>Ambiances <input type="range" min="0" max="1" step="0.05" bind:value={volumes.ambience} /></label>
            <label>Effets <input type="range" min="0" max="1" step="0.05" bind:value={volumes.effects} /></label>
            <label class="check"><input type="checkbox" bind:checked={volumes.muted} /> Couper le son</label>
        </div>
    {/if}
</div>

<style>
    .volume {
        position: relative;
    }

    .pulse {
        border-color: var(--accent);
        animation: pulse 1.6s ease-in-out infinite;
    }

    @keyframes pulse {
        50% {
            box-shadow: 0 0 0 4px rgba(229, 184, 204, 0.3);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .pulse {
            animation: none;
        }
    }

    .popover {
        position: absolute;
        right: 0;
        top: calc(100% + 0.4rem);
        z-index: 50;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 14rem;
        padding: 0.75rem;
        background-color: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        font-size: 0.85rem;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    label.check {
        flex-direction: row;
        align-items: center;
        gap: 0.35rem;
    }

    input[type="range"] {
        height: auto;
        padding: 0;
        background: none;
        border: none;
    }
</style>
