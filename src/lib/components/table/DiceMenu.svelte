<script lang="ts">
    // Lanceur de dés libres : bouton en haut à gauche du plateau, menu déroulant.
    import Icon from "$lib/components/ui/Icon.svelte";
    import DieShape from "$lib/components/ui/DieShape.svelte";
    import type { TableClient } from "$lib/table/client.svelte";
    import type { DiceResult } from "$lib/table/types";

    let {
        client,
        isAdmin,
        onresult,
    }: {
        client: TableClient;
        isAdmin: boolean;
        /** Résultat du jet, affiché au lanceur en haut du plateau. */
        onresult?: (result: DiceResult) => void;
    } = $props();

    const FACES = [4, 6, 8, 10, 12, 20, 100];

    let open = $state(false);
    let count = $state(1);
    let modifier = $state(0);
    let formula = $state("");
    let reason = $state("");
    let hidden = $state(false);
    let menu: HTMLElement | undefined = $state();

    const build = (faces: number) =>
        `${count > 1 ? count : ""}d${faces}${modifier ? (modifier > 0 ? `+${modifier}` : modifier) : ""}`;

    export function toggle() {
        open = !open;
    }

    export function close() {
        open = false;
    }

    async function roll(f: string) {
        if (!f.trim()) return;
        const result = await client.act<DiceResult>("roll.dice", { formula: f, label: reason, hidden });
        if (result) onresult?.(result);
    }

    // Un clic en dehors du menu le referme.
    function onWindowDown(e: PointerEvent) {
        if (open && menu && !menu.contains(e.target as Node)) open = false;
    }
</script>

<svelte:window onpointerdown={onWindowDown} />

<div class="dice" bind:this={menu}>
    <button
        class="trigger"
        class:open
        onclick={() => (open = !open)}
        aria-expanded={open}
        aria-label="Lancer des dés"
        title="Lancer des dés"
    >
        <Icon src="/table/Dice.svg" color="var(--chance)" size="1.9rem" />
    </button>

    {#if open}
        <div class="menu" role="dialog" aria-label="Dés">
            <div class="row">
                <label>
                    Nombre
                    <input type="number" min="1" max="20" bind:value={count} />
                </label>
                <label>
                    Modificateur
                    <input type="number" min="-100" max="100" bind:value={modifier} />
                </label>
            </div>

            <div class="faces">
                {#each FACES as faces (faces)}
                    <button class="face" onclick={() => roll(build(faces))} title="Lancer {build(faces)}">
                        <DieShape {faces} size="2.4rem" />
                        <span>{build(faces)}</span>
                    </button>
                {/each}
            </div>

            <form
                onsubmit={(e) => {
                    e.preventDefault();
                    roll(formula);
                }}
            >
                <input bind:value={formula} placeholder="Formule libre : 2d6+d4+3" maxlength="60" aria-label="Formule" />
                <button class="btn btn-small btn-chance" type="submit" disabled={!formula.trim()}>Lancer</button>
            </form>

            <input bind:value={reason} placeholder="Raison (facultatif)" maxlength="80" aria-label="Raison du jet" />

            {#if isAdmin}
                <label class="check"><input type="checkbox" bind:checked={hidden} /> Jet caché aux joueurs</label>
            {/if}
        </div>
    {/if}
</div>

<style>
    .dice {
        position: relative;
        pointer-events: auto;
    }

    .trigger {
        display: grid;
        place-items: center;
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        border: 1px solid var(--chance);
        background-color: rgba(20, 20, 20, 0.88);
        transition: var(--transition);
    }

    .trigger:hover,
    .trigger.open {
        background-color: var(--chance-soft);
        box-shadow: 0 0 0 3px var(--chance-glow);
        transform: rotate(-12deg);
    }

    .menu {
        position: absolute;
        top: 0;
        left: calc(100% + 0.5rem);
        z-index: 45;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        width: 18rem;
        padding: 0.8rem;
        background-color: var(--surface);
        border: 1px solid var(--chance);
        border-radius: var(--radius);
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.6);
        font-size: 0.85rem;
    }

    .row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
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
        color: var(--chance);
    }

    input:not([type="checkbox"]) {
        height: 32px;
        font-size: 15px;
        padding: 0 0.5rem;
    }

    .faces {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.35rem;
    }

    .face {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0.35rem 0.2rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: none;
        color: var(--foreground);
    }

    .face:hover {
        border-color: var(--chance);
        background-color: var(--chance-soft);
    }

    .face {
        gap: 0.15rem;
    }

    .face:hover :global(.die) {
        transform: rotate(-10deg) scale(1.08);
    }

    .face :global(.die) {
        transition: transform 0.2s ease-out;
    }

    .face span {
        font-size: 0.65rem;
        color: var(--muted);
    }

    form {
        display: flex;
        gap: 0.35rem;
    }

    @media (prefers-reduced-motion: reduce) {
        .trigger:hover,
        .trigger.open {
            transform: none;
        }
    }
</style>
