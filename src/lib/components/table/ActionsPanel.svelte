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
    import { HAND_LABELS } from "$lib/game/weapons";
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

    // ─── Jets saisis à la main ───
    // Avec de vrais dés : on tape le résultat, la table ne tire rien. Le journal le signale.
    let manualRolls = $state(false);
    let statRoll = $state<number | null>(null);
    let attackRoll = $state<number | null>(null);
    const validRoll = (value: number | null, faces: number) =>
        value !== null && Number.isInteger(value) && value >= 1 && value <= faces;
    let statReady = $derived(!manualRolls || validRoll(statRoll, 100));
    let attackReady = $derived(!manualRolls || validRoll(attackRoll, 20));

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

    async function rollStat() {
        const done = await client.act("roll.stat", {
            tokenId: actorId,
            stat,
            targetId: opposed ? targetId : undefined,
            targetStat: opposed ? targetStat : undefined,
            bonus,
            targetBonus,
            hidden,
            manual: manualRolls ? statRoll : undefined,
        });
        if (done) statRoll = null;
    }

    // ─── Attaque ───
    let kind = $state<AttackKind>("force");
    let power = $state(1);
    let multiplier = $state(1);
    let attackBonus = $state(0);
    let defenseBonus = $state(0);
    // Champ libre : vide ou hors bornes, on retombe sur ce que le serveur appliquera.
    let safePower = $derived(Math.min(MAX_ATTACK_POWER, Math.max(1, Math.trunc(Number(power) || 1))));
    let cost = $derived(attackCost(kind, safePower));
    let costLabel = $derived(STATS[ATTACK_COST_STAT[kind]].abbr);

    // ─── Arme ───
    // Un joueur frappe avec une de ses armes équipées, ou sans arme.
    let weapons = $derived(tokens.find((t) => t.id === actorId)?.weapons ?? []);
    let weaponId = $state<number | null>(null);
    // L'arme reste choisie tant qu'elle est tenue ; sinon on propose la première, faute de quoi « sans arme ».
    let lastActor: number | null = null;
    $effect(() => {
        if (actorId !== lastActor || (weaponId !== null && !weapons.some((w) => w.id === weaponId))) {
            lastActor = actorId;
            weaponId = weapons[0]?.id ?? null;
        }
    });
    let weapon = $derived(weapons.find((w) => w.id === weaponId) ?? null);

    async function attack() {
        const done = await client.act("attack", {
            attackerId: actorId,
            weaponId,
            targetId,
            kind,
            power: safePower,
            multiplier,
            attackBonus,
            defenseBonus,
            hidden,
            manual: manualRolls ? attackRoll : undefined,
        });
        if (done) attackRoll = null;
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

        <label class="check manual" title="Pour lancer de vrais dés : le journal indique que le jet a été saisi">
            <input type="checkbox" bind:checked={manualRolls} /> Saisir les jets à la main (vrais dés)
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
            {#if manualRolls}
                <label>
                    Résultat du d100
                    <input type="number" min="1" max="100" step="1" bind:value={statRoll} placeholder="1 à 100" />
                </label>
            {/if}
            <button
                class="btn btn-chance"
                disabled={(opposed && targetId === null) || !statReady}
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
                    <input type="number" min="1" max={MAX_ATTACK_POWER} step="1" bind:value={power} />
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
            {#if weapons.length > 0}
                <div class="chips" role="radiogroup" aria-label="Arme">
                    <button class="chip" class:on={weaponId === null} onclick={() => (weaponId = null)}>
                        Sans arme
                    </button>
                    {#each weapons as w (w.id)}
                        <button
                            class="chip"
                            class:on={weaponId === w.id}
                            title={HAND_LABELS[w.hand]}
                            onclick={() => (weaponId = w.id)}>Avec {w.name}</button
                        >
                    {/each}
                </div>
                {#if weapon?.bonuses.length}
                    <p class="muted small weapon-bonus">{weapon.bonuses.join(" · ")}</p>
                {/if}
            {/if}
            {#if isAdmin}
                <div class="grid3">
                    <label>Multiplicateur <input type="number" step="0.1" min="0" bind:value={multiplier} /></label>
                    <label>Bonus att. <input type="number" bind:value={attackBonus} /></label>
                    <label>Bonus déf. <input type="number" bind:value={defenseBonus} /></label>
                </div>
            {/if}
            <p class="muted small">
                {#if powerRollBonus(safePower)}+{powerRollBonus(safePower)} au jet · {/if}Coût : {cost}
                {costLabel}. Les dégâts sont appliqués aussitôt.
            </p>
            {#if manualRolls}
                <label>
                    Résultat du d20
                    <input type="number" min="1" max="20" step="1" bind:value={attackRoll} placeholder="1 à 20" />
                </label>
            {/if}
            <button class="btn btn-chance" disabled={targetId === null || !attackReady} onclick={attack}>
                {kind === "force" ? "Attaquer" : "Lancer le sort sur"}
                {nameOf(targetId)}{weapon ? ` avec ${weapon.name}` : ""}
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

    .manual {
        color: var(--chance);
    }

    .weapon-bonus {
        color: var(--foreground);
    }
</style>
