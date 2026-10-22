<script lang="ts">
    import {
        DRAGONS,
        dragonVars,
        formatDescent,
        isUnknownDescent,
        parseDragons,
        type Dragon,
    } from "$lib/game/labels";

    // Descendance d'un personnage ou d'un monstre : un ou plusieurs dragons, dans l'ordre où on les coche,
    // sinon « Aucun » ou « Inconnu ». Le résultat part dans un champ caché, au format de la colonne `dragon`.
    let { name, value = "" }: { name: string; value?: string | null } = $props();

    const initial = () => ({ dragons: parseDragons(value), unknown: isUnknownDescent(value) });
    let descent = $state(initial());

    let serialized = $derived(formatDescent(descent.dragons, descent.unknown));
    let none = $derived(descent.dragons.length === 0);

    function toggle(dragon: Dragon) {
        const rank = descent.dragons.indexOf(dragon);
        if (rank >= 0) {
            descent.dragons.splice(rank, 1);
        } else {
            descent.dragons.push(dragon);
            descent.unknown = false;
        }
    }

    function clear(unknown: boolean) {
        descent.dragons = [];
        descent.unknown = unknown;
    }
</script>

<input type="hidden" {name} value={serialized} />

<div class="picker" role="group" aria-label="Dragons de la descendance">
    {#each DRAGONS as dragon (dragon)}
        {@const rank = descent.dragons.indexOf(dragon)}
        <button
            type="button"
            class="dragon"
            class:on={rank >= 0}
            aria-pressed={rank >= 0}
            style="{dragonVars(dragon)}; --icon: url('/dragons/tampons/{dragon}.svg')"
            onclick={() => toggle(dragon)}
        >
            <span class="stamp"></span>
            {dragon}
            {#if rank >= 0 && descent.dragons.length > 1}
                <span class="rank" title="Position sur la fiche">{rank + 1}</span>
            {/if}
        </button>
    {/each}
</div>

<div class="none" role="group" aria-label="Sans dragon">
    <button
        type="button"
        class="choice"
        class:on={none && !descent.unknown}
        aria-pressed={none && !descent.unknown}
        onclick={() => clear(false)}
    >
        Aucun
    </button>
    <button
        type="button"
        class="choice"
        class:on={none && descent.unknown}
        aria-pressed={none && descent.unknown}
        onclick={() => clear(true)}
    >
        Inconnu
    </button>
    <span class="muted">Valeur : {serialized}</span>
</div>

<style>
    .picker {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .dragon,
    .choice {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        border: 1px solid var(--border);
        border-radius: 999px;
        background-color: transparent;
        color: var(--muted);
        font-size: 0.9rem;
        transition: var(--transition);
    }

    .dragon {
        padding: 0.2rem 0.75rem 0.2rem 0.25rem;
    }

    .dragon:hover,
    .dragon.on {
        border-color: var(--c-text);
        color: var(--c-text);
    }

    .dragon.on {
        background-color: color-mix(in srgb, var(--c) 15%, transparent);
    }

    /* Tampon du dragon, comme sur la fiche de jeu : pâli tant qu'il n'est pas choisi. */
    .stamp {
        position: relative;
        width: 1.7rem;
        height: 1.7rem;
        border: 1px solid var(--foreground);
        border-radius: 50%;
        background-color: var(--c);
        opacity: 0.35;
        transition: var(--transition);
    }

    .stamp::after {
        content: "";
        position: absolute;
        inset: 6%;
        background-color: var(--ink);
        mask: var(--icon) center / contain no-repeat;
        -webkit-mask: var(--icon) center / contain no-repeat;
    }

    .dragon:hover .stamp,
    .on .stamp {
        opacity: 1;
    }

    .rank {
        min-width: 1.1rem;
        border-radius: 999px;
        background-color: var(--c-text);
        color: var(--background);
        font-size: 0.75rem;
        text-align: center;
    }

    .none {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }

    .choice {
        padding: 0.2rem 0.9rem;
    }

    .choice:hover {
        border-color: var(--primary);
        color: var(--primary);
    }

    .choice.on {
        border-color: var(--primary);
        background-color: var(--primary);
        color: var(--background);
    }

    .none .muted {
        font-size: 0.85rem;
    }
</style>
