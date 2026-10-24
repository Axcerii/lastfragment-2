<script lang="ts">
    import { tick } from "svelte";
    import type { TableClient } from "$lib/table/client.svelte";
    import DieShape from "$lib/components/ui/DieShape.svelte";
    import { parseDieValues } from "$lib/game/combat";
    import type { LogView } from "$lib/table/types";

    let {
        client,
        isAdmin = false,
        readonly = false,
    }: { client: TableClient; isAdmin?: boolean; readonly?: boolean } = $props();

    let list: HTMLOListElement | undefined = $state();
    let message = $state("");
    let hidden = $state(false);
    let stick = true;

    // Reste collé en bas tant que l'on n'est pas remonté lire l'historique.
    $effect(() => {
        void client.logs.length;
        if (!stick || !list) return;
        tick().then(() => list && (list.scrollTop = list.scrollHeight));
    });

    function onScroll() {
        if (!list) return;
        stick = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
    }

    async function send(e: SubmitEvent) {
        e.preventDefault();
        const text = message.trim();
        if (!text) return;
        message = "";
        // « /r 2d6+3 » lance des dés directement depuis le chat ; « /r 2d6+3 = 4 5 » enregistre de vrais dés.
        const roll = /^\/(?:r|roll|d)\s+([^=]+?)\s*(?:=\s*(.+))?$/i.exec(text);
        if (roll) {
            const manual = roll[2] ? parseDieValues(roll[2]) : undefined;
            await client.act("roll.dice", { formula: roll[1], hidden, manual });
        } else await client.act("chat", { text, hidden });
    }

    const time = (log: LogView) =>
        new Date(log.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
</script>

<section class="log" aria-label="Journal de la partie">
    <ol bind:this={list} onscroll={onScroll} aria-live="polite">
        {#each client.logs as log (log.id)}
            <li class="entry kind-{log.kind}" class:hidden={log.hidden} class:undone={log.undone}>
                <div class="meta">
                    <span class="author">{log.author}</span>
                    <time>{time(log)}</time>
                    {#if log.hidden}<span class="tag">MJ seul</span>{/if}
                    {#if log.undone}<span class="tag">annulé</span>{/if}
                    {#if log.manual}
                        <span class="tag manual" title="Résultat de vrais dés, tapé par le lanceur">jet saisi à la main</span>
                    {/if}
                </div>
                {#if log.dice}
                    <div class="dice" aria-hidden="true">
                        {#each log.dice as die, i (i)}
                            {#if die.sign === -1}<span class="op">−</span>{:else if i > 0}<span class="op">+</span>{/if}
                            <DieShape
                                faces={die.faces}
                                label={die.value}
                                size="2rem"
                                filled={die.value === die.faces}
                                dim={die.value === 1}
                            />
                        {/each}
                    </div>
                {/if}
                <p>{log.text}</p>
                {#if log.detail}<p class="detail">{log.detail}</p>{/if}
                {#if log.undoable && !readonly}
                    <button class="undo" onclick={() => client.act("log.undo", { id: log.id })}>
                        Annuler les dégâts
                    </button>
                {/if}
            </li>
        {:else}
            <li class="empty muted">Le journal est vide. Les jets et messages apparaîtront ici.</li>
        {/each}
    </ol>

    {#if !readonly}
        <form onsubmit={send}>
            <input
                id="table-chat"
                bind:value={message}
                maxlength="1000"
                placeholder="Message, /r 2d6+3, ou /r 2d6 = 4 5"
                aria-label="Message"
            />
            {#if isAdmin}
                <label class="secret" title="Visible du MJ seulement">
                    <input type="checkbox" bind:checked={hidden} /> Caché
                </label>
            {/if}
            <button class="btn btn-small" type="submit">Envoyer</button>
        </form>
    {/if}
</section>

<style>
    .log {
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: 100%;
    }

    ol {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        padding: 0.5rem;
        min-height: 0;
    }

    .entry {
        padding: 0.4rem 0.6rem;
        border-left: 3px solid var(--border);
        border-radius: 0 var(--radius) var(--radius) 0;
        background-color: rgba(255, 255, 255, 0.03);
        font-size: 0.85rem;
    }

    .meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.7rem;
        color: var(--muted);
    }

    .author {
        color: var(--foreground);
        font-weight: bold;
    }

    .tag {
        padding: 0 0.3rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
    }

    .tag.manual {
        border-color: var(--chance);
        color: var(--foreground);
    }

    .detail {
        font-size: 0.75rem;
        color: var(--muted);
    }

    .dice {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.2rem;
        margin: 0.25rem 0;
    }

    .op {
        color: var(--muted);
        font-size: 0.8rem;
    }

    /* Tout ce qui sort d'un dé porte la couleur de la chance. */
    .kind-roll,
    .kind-stat,
    .kind-opposed,
    .kind-attack {
        border-left-color: var(--chance);
    }

    .kind-roll .detail,
    .kind-stat .detail,
    .kind-opposed .detail,
    .kind-attack .detail {
        /* Chronos éclairci : lisible en petit sur fond sombre. */
        color: #e58a8a;
    }

    .kind-alert {
        border-left-color: #fbff93;
        color: #fbff93;
    }

    .kind-system {
        border-left-color: transparent;
        background: none;
        color: var(--muted);
        font-style: italic;
    }

    .kind-chat {
        border-left-color: var(--accent);
    }

    .hidden {
        opacity: 0.75;
        background-image: repeating-linear-gradient(
            -45deg,
            transparent 0 8px,
            rgba(255, 255, 255, 0.03) 8px 16px
        );
    }

    .undone p {
        text-decoration: line-through;
        opacity: 0.6;
    }

    .undo {
        margin-top: 0.25rem;
        border: none;
        background: none;
        padding: 0;
        color: var(--accent);
        font-size: 0.75rem;
        text-decoration: underline;
    }

    .empty {
        padding: 1rem;
        font-size: 0.85rem;
    }

    form {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.5rem;
        border-top: 1px solid var(--border);
    }

    form input:not([type="checkbox"]) {
        height: 36px;
        font-size: 16px;
        padding: 0 0.6rem;
    }

    .secret {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.8rem;
        white-space: nowrap;
    }
</style>
