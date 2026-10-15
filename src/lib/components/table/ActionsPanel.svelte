<script lang="ts">
    import {
        ATTACK_COST_STAT,
        MAX_ATTACK_POWER,
        OPPOSED_STAT,
        attackCost,
        powerRollBonus,
        type AttackKind,
    } from "$lib/game/combat";
    import { COMBAT_STATS, SOCIAL_STATS, STATS, type StatKey } from "$lib/game/stats";
    import DieShape from "$lib/components/ui/DieShape.svelte";
    import type { TableClient } from "$lib/table/client.svelte";
    import type { TokenView } from "$lib/table/types";

    let {
        client,
        tokens,
        isAdmin,
        selectedId,
    }: {
        client: TableClient;
        /** Jetons de la scène affichée. */
        tokens: TokenView[];
        isAdmin: boolean;
        /** Jeton sélectionné sur le plateau : cible proposée par défaut. */
        selectedId: number | null;
    } = $props();

    const ROLL_STATS: StatKey[] = [...COMBAT_STATS, ...SOCIAL_STATS];

    // Le joueur agit avec son jeton ; le MJ choisit qui agit.
    let mine = $derived(tokens.filter((t) => t.mine));
    let actors = $derived(isAdmin ? tokens : mine);
    let actorId = $state<number | null>(null);
    $effect(() => {
        if (!actors.some((t) => t.id === actorId)) actorId = actors[0]?.id ?? null;
    });

    let targetId = $state<number | null>(null);
    // La cible suit la sélection sur le plateau, sauf si on sélectionne celui qui agit.
    $effect(() => {
        if (selectedId !== null && selectedId !== actorId) targetId = selectedId;
    });
    // Sans sélection, on propose le premier ennemi visible.
    $effect(() => {
        if (tokens.some((t) => t.id === targetId)) return;
        const others = tokens.filter((t) => t.id !== actorId);
        targetId = (others.find((t) => t.side === "enemy") ?? others[0])?.id ?? null;
    });
    let targets = $derived(tokens);

    // ─── Jet de stat ───
    let stat = $state<StatKey>("perception");
    let targetStat = $state<StatKey>(OPPOSED_STAT.perception);
    let opposed = $state(false);
    let bonus = $state(0);
    let targetBonus = $state(0);
    let hidden = $state(false);

    function pickStat(key: StatKey) {
        stat = key;
        targetStat = OPPOSED_STAT[key];
    }

    function rollStat() {
        client.act("roll.stat", {
            tokenId: actorId,
            stat,
            targetId: opposed ? targetId : undefined,
            targetStat: opposed ? targetStat : undefined,
            bonus,
            targetBonus,
            hidden,
        });
    }

    // ─── Attaque ───
    let kind = $state<AttackKind>("force");
    let power = $state(1);
    let multiplier = $state(1);
    let attackBonus = $state(0);
    let defenseBonus = $state(0);
    let cost = $derived(attackCost(kind, power));
    let costLabel = $derived(STATS[ATTACK_COST_STAT[kind]].abbr);

    function attack() {
        client.act("attack", {
            attackerId: actorId,
            targetId,
            kind,
            power,
            multiplier,
            attackBonus,
            defenseBonus,
            hidden,
        });
    }

    const nameOf = (id: number | null) => tokens.find((t) => t.id === id)?.name ?? "—";
</script>

<div class="actions">
    {#if actors.length === 0}
        <p class="muted">
            {isAdmin
                ? "Aucun jeton sur cette scène."
                : "Ton jeton n'est pas sur la scène montrée. Demande au MJ de t'y placer."}
        </p>
    {:else}
        <label>
            Qui agit
            {#if isAdmin}
                <select bind:value={actorId}>
                    {#each actors as token (token.id)}
                        <option value={token.id}>{token.name}</option>
                    {/each}
                </select>
            {:else}
                <strong>{nameOf(actorId)}</strong>
            {/if}
        </label>

        <section>
            <h3>Jet de stat <DieShape faces={100} size="1.6rem" /></h3>
            <div class="chips" role="group" aria-label="Statistique">
                {#each ROLL_STATS as key (key)}
                    <button
                        class="chip"
                        class:on={stat === key}
                        title={STATS[key].label}
                        onclick={() => pickStat(key)}>{STATS[key].abbr}</button
                    >
                {/each}
            </div>
            <label class="check">
                <input type="checkbox" bind:checked={opposed} /> Contre une cible
            </label>
            {#if opposed}
                <div class="grid2">
                    <label>
                        Cible
                        <select bind:value={targetId}>
                            {#each targets as token (token.id)}
                                <option value={token.id}>{token.name}</option>
                            {/each}
                        </select>
                    </label>
                    <label>
                        Sa stat
                        <select bind:value={targetStat}>
                            {#each ROLL_STATS as key (key)}
                                <option value={key}>{STATS[key].label}</option>
                            {/each}
                        </select>
                    </label>
                </div>
            {/if}
            {#if isAdmin}
                <div class="grid2">
                    <label>Bonus <input type="number" bind:value={bonus} /></label>
                    {#if opposed}
                        <label>Bonus cible <input type="number" bind:value={targetBonus} /></label>
                    {/if}
                </div>
            {/if}
            <button
                class="btn btn-chance"
                disabled={opposed && targetId === null}
                onclick={rollStat}
            >
                Lancer {STATS[stat].label}{opposed ? ` contre ${nameOf(targetId)}` : ""}
            </button>
        </section>

        <section>
            <h3>Attaque <DieShape faces={20} size="1.6rem" /></h3>
            <div class="chips" role="radiogroup" aria-label="Type d'attaque">
                <button class="chip" class:on={kind === "force"} onclick={() => (kind = "force")}>
                    Force
                </button>
                <button class="chip" class:on={kind === "maitrise"} onclick={() => (kind = "maitrise")}>
                    Maîtrise
                </button>
            </div>
            <div class="grid2">
                <label>
                    Puissance
                    <select bind:value={power}>
                        {#each Array.from({ length: MAX_ATTACK_POWER }, (_, i) => i + 1) as p (p)}
                            <option value={p}>
                                {p}{powerRollBonus(p) ? ` (+${powerRollBonus(p)} au jet)` : ""}
                            </option>
                        {/each}
                    </select>
                </label>
                <label>
                    Cible
                    <select bind:value={targetId}>
                        {#each targets as token (token.id)}
                            <option value={token.id}>{token.name}</option>
                        {/each}
                    </select>
                </label>
            </div>
            {#if isAdmin}
                <div class="grid3">
                    <label>Multiplicateur <input type="number" step="0.1" min="0" bind:value={multiplier} /></label>
                    <label>Bonus att. <input type="number" bind:value={attackBonus} /></label>
                    <label>Bonus déf. <input type="number" bind:value={defenseBonus} /></label>
                </div>
            {/if}
            <p class="muted small">Coût : {cost} {costLabel}. Les dégâts sont appliqués aussitôt.</p>
            <button class="btn btn-chance" disabled={targetId === null} onclick={attack}>
                {kind === "force" ? "Attaquer" : "Lancer le sort sur"}
                {nameOf(targetId)}
            </button>
        </section>
    {/if}

    {#if isAdmin}
        <label class="check secret">
            <input type="checkbox" bind:checked={hidden} /> Jets cachés aux joueurs
        </label>
    {/if}
</div>

<style>
    .actions {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        font-size: 0.9rem;
    }

    section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--border);
    }

    h3 {
        font-size: 1.15rem;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        font-size: 0.8rem;
    }

    label.check {
        flex-direction: row;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.85rem;
    }

    input:not([type="checkbox"]),
    select {
        height: 34px;
        font-size: 15px;
        padding: 0 0.5rem;
    }

    .grid2,
    .grid3 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
    }

    .grid3 {
        grid-template-columns: repeat(3, 1fr);
    }

    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem;
    }

    .chip {
        min-height: 30px;
        padding: 0 0.55rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: none;
        color: var(--foreground);
        font-size: 0.85rem;
    }

    .chip:hover {
        border-color: var(--chance);
    }

    .chip.on {
        background-color: var(--chance);
        border-color: var(--chance);
        color: var(--foreground);
    }

    h3 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .small {
        font-size: 0.8rem;
    }

    .secret {
        color: var(--chance);
    }
</style>
