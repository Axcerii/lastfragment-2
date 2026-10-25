<script lang="ts">
    import { onMount, tick as nextTick, untrack } from "svelte";
    import { invalidateAll } from "$app/navigation";
    import DleCountdown from "$lib/components/game/DleCountdown.svelte";
    import { DLE_COLUMNS, dragonIcon, previousDay, type DleRow, type DleStats } from "$lib/game/dle";
    import { portrait } from "$lib/game/labels";

    let { data } = $props();

    // Connecté, la partie du jour vit sur le compte (base de données). Visiteur, elle est gardée
    // dans le navigateur : la liste des essais, rejouée auprès du serveur au chargement.
    // Rien de fiable n'en dépend, d'où les try/catch silencieux.
    const STATS_KEY = "lastdle:stats";
    const gameKey = (date: string) => `lastdle:${date}`;

    function read<T>(key: string, fallback: T): T {
        try {
            const raw = localStorage.getItem(key);
            return raw ? (JSON.parse(raw) as T) : fallback;
        } catch {
            return fallback;
        }
    }

    function write(key: string, value: unknown) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Stockage indisponible (navigation privée) : la partie ne survivra pas au rechargement.
        }
    }

    let mode = $state<"daily" | "infinite">("daily");

    // --- Énigme du jour ---
    // Connecté, la partie est déjà dans les données : la page arrive rendue, sans « Chargement ».
    let dailyRows = $state<DleRow[]>(untrack(() => data.account?.rows ?? []));
    let localStats = $state<DleStats & { lastWin: string | null }>({ wins: 0, streak: 0, best: 0, lastWin: null });
    let stats = $derived<DleStats>(data.account?.stats ?? localStats);

    // --- Mode infini : un personnage au hasard, sans série ni classement ---
    let token = $state<string | null>(null);
    let infiniteRows = $state<DleRow[]>([]);
    let infiniteWins = $state(0);

    let rows = $derived(mode === "daily" ? dailyRows : infiniteRows);
    let answer = $derived(rows.find((r) => r.correct));
    let guessed = $derived(new Set(rows.map((r) => r.id)));

    let ready = $state(untrack(() => Boolean(data.account)));
    let sending = $state(false);
    let message = $state<string | null>(null);
    // Seule la ligne qui vient d'arriver s'anime ; celles rejouées au chargement s'affichent d'un coup.
    let freshId = $state<number | null>(null);

    async function post(body: Record<string, unknown>) {
        const response = await fetch("/outils/lastdle/essai", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            message =
                response.status === 429
                    ? "Doucement : réessaie dans une minute."
                    : "Le serveur n'a pas répondu, réessaie.";
            return null;
        }
        const result = await response.json();
        if (result.expired) {
            // Minuit est passé : on recharge le personnage du nouveau jour.
            await invalidateAll();
            return null;
        }
        return result as { rows?: DleRow[]; token?: string | null };
    }

    async function restore() {
        message = null;
        if (data.account) {
            dailyRows = data.account.rows;
            ready = true;
            return;
        }
        ready = false;
        localStats = read(STATS_KEY, localStats);
        const saved = read<number[]>(gameKey(data.date), []);
        dailyRows = saved.length ? ((await post({ mode: "daily", date: data.date, guesses: saved }))?.rows ?? []) : [];
        ready = true;
    }

    // Nouveau jour, connexion, ou partie rechargée depuis le compte : on reprend la partie.
    $effect(() => {
        void data.date;
        void data.account;
        untrack(restore);
    });

    async function guessDaily(id: number) {
        if (data.account) {
            // Le compte fait foi : le serveur enregistre l'essai et renvoie toute la partie.
            const result = await post({ mode: "daily", date: data.date, guesses: [id] });
            if (!result?.rows) return null;
            dailyRows = result.rows;
            // Victoire : le classement et la série se mettent à jour.
            if (result.rows.some((r) => r.correct)) await invalidateAll();
            return result.rows.find((r) => r.id === id) ?? null;
        }

        const row = (await post({ mode: "daily", date: data.date, guesses: [id] }))?.rows?.[0];
        if (!row) return null;
        dailyRows = [...dailyRows, row];
        write(
            gameKey(data.date),
            dailyRows.map((r) => r.id),
        );
        if (row.correct && localStats.lastWin !== data.date) {
            const streak = localStats.lastWin === previousDay(data.date) ? localStats.streak + 1 : 1;
            localStats = {
                wins: localStats.wins + 1,
                streak,
                best: Math.max(localStats.best, streak),
                lastWin: data.date,
            };
            write(STATS_KEY, localStats);
        }
        return row;
    }

    async function guessInfinite(id: number) {
        const result = await post({ mode: "infinite", token, guesses: [...infiniteRows.map((r) => r.id), id] });
        if (!result) return null;
        if (result.token) {
            // Personnage caché entre-temps : la partie repart sur un autre.
            token = result.token;
            infiniteRows = [];
            message = "Ce personnage n'est plus disponible : en voici un autre.";
            return null;
        }
        infiniteRows = result.rows ?? [];
        const row = infiniteRows.find((r) => r.id === id) ?? null;
        if (row?.correct) infiniteWins += 1;
        return row;
    }

    async function guess(id: number) {
        if (sending || answer || guessed.has(id)) return;
        sending = true;
        message = null;
        query = "";
        const row = mode === "daily" ? await guessDaily(id) : await guessInfinite(id);
        sending = false;
        if (!row) return;
        freshId = row.id;
        if (!row.correct) nextTick().then(() => input?.focus());
    }

    async function newInfinite() {
        sending = true;
        message = null;
        const result = await post({ mode: "infinite" });
        sending = false;
        if (!result?.token) return;
        token = result.token;
        infiniteRows = [];
        freshId = null;
        nextTick().then(() => input?.focus());
    }

    function switchMode(next: "daily" | "infinite") {
        mode = next;
        query = "";
        message = null;
        if (next === "infinite" && !token) newInfinite();
    }

    // --- Recherche du personnage ---
    let query = $state("");
    let highlighted = $state(0);
    let input = $state<HTMLInputElement>();

    const fold = (text: string) =>
        text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "");

    let suggestions = $derived.by(() => {
        const q = fold(query.trim());
        if (!q) return [];
        const open = data.candidates.filter((c) => !guessed.has(c.id));
        // Les noms qui commencent par la saisie passent devant ceux qui la contiennent.
        const starts = open.filter((c) => fold(c.name).startsWith(q));
        const contains = open.filter((c) => !fold(c.name).startsWith(q) && fold(c.name).includes(q));
        return [...starts, ...contains].slice(0, 8);
    });

    $effect(() => {
        void suggestions;
        highlighted = 0;
    });

    function onKeydown(event: KeyboardEvent) {
        if (!suggestions.length) return;
        if (event.key === "ArrowDown") {
            event.preventDefault();
            highlighted = (highlighted + 1) % suggestions.length;
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            highlighted = (highlighted - 1 + suggestions.length) % suggestions.length;
        } else if (event.key === "Enter") {
            event.preventDefault();
            guess(suggestions[highlighted].id);
        } else if (event.key === "Escape") {
            query = "";
        }
    }

    // Secondes restantes avant minuit à Paris, où l'énigme change ; 0 tant que la page n'est pas montée.
    let left = $state(0);

    function tick() {
        const parts = new Intl.DateTimeFormat("fr-FR", {
            timeZone: "Europe/Paris",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hourCycle: "h23",
        }).formatToParts(new Date());
        const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
        left = 86_400 - (get("hour") * 3600 + get("minute") * 60 + get("second"));
        if (left <= 1) setTimeout(() => invalidateAll(), 1500);
    }

    onMount(() => {
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    });
</script>

<svelte:head>
    <title>Lastdle : Last Fragment</title>
</svelte:head>

<main>
    <header>
        <a class="muted back" href="/outils">← Outils</a>
        <h1>Lastdle</h1>
    </header>

    <div class="modes" role="tablist" aria-label="Mode de jeu">
        <button role="tab" aria-selected={mode === "daily"} class:on={mode === "daily"} onclick={() => switchMode("daily")}>
            Énigme du jour
        </button>
        <button
            role="tab"
            aria-selected={mode === "infinite"}
            class:on={mode === "infinite"}
            onclick={() => switchMode("infinite")}
        >
            Mode infini
        </button>
    </div>

    <div class="layout" class:with-side={mode === "daily"}>
        <div class="game">
            {#if mode === "daily"}
                <div class="info">
                    <span class="muted">Énigme n°{data.day}</span>
                    {#if !answer && data.cards}
                        <a class="reward" href={data.account ? "/cartes" : "/auth/login"}>
                            <span class="gem" aria-hidden="true"></span>
                            {data.account ? "Trouve-le : un booster de cartes offert" : "Connecte-toi : le trouver rapporte un booster de cartes"}
                        </a>
                    {/if}
                    {#if !answer && left}
                        <span class="next">
                            <span class="muted">Prochain personnage dans</span>
                            <DleCountdown seconds={left} />
                        </span>
                    {/if}
                </div>
            {:else}
                <p class="muted small">
                    Un personnage au hasard, autant de fois que tu veux. Ne compte ni pour la série ni pour le classement.
                    {#if infiniteWins}· {infiniteWins} trouvé{infiniteWins > 1 ? "s" : ""} cette fois-ci{/if}
                </p>
            {/if}

            {#if data.candidates.length === 0}
                <p class="panel muted">Aucun personnage à deviner pour le moment.</p>
            {:else}
                {#if answer}
                    <section class="victory panel">
                        <img src={portrait(answer.image)} alt="" />
                        <div class="victory-text">
                            <p class="muted">Bravo, c'était</p>
                            <strong>{answer.name}</strong>
                            {#if mode === "daily"}
                                <p>
                                    Trouvé en {rows.length} essai{rows.length > 1 ? "s" : ""}.
                                    Série en cours : {stats.streak} jour{stats.streak > 1 ? "s" : ""} (record {stats.best}).
                                </p>
                                {#if data.cards && data.account}
                                    <a class="reward won" href="/cartes">
                                        <span class="gem" aria-hidden="true"></span>
                                        +1 booster de cartes gagné : va l’ouvrir !
                                    </a>
                                {/if}
                                <div class="victory-actions">
                                    <a class="btn btn-accent" href="/personnages/{answer.id}">Voir sa fiche</a>
                                    <button class="btn" onclick={() => switchMode("infinite")}>Continuer en mode infini</button>
                                </div>
                            {:else}
                                <p>Trouvé en {rows.length} essai{rows.length > 1 ? "s" : ""}.</p>
                                <div class="victory-actions">
                                    <button class="btn btn-accent" onclick={newInfinite} disabled={sending}>Un autre !</button>
                                    <a class="btn" href="/personnages/{answer.id}">Voir sa fiche</a>
                                </div>
                            {/if}
                        </div>
                        {#if mode === "daily" && left}
                            <DleCountdown seconds={left} big />
                        {/if}
                    </section>
                {:else}
                    {@const loading = mode === "daily" ? !ready : !token}
                    <div class="search">
                        <input
                            bind:this={input}
                            bind:value={query}
                            onkeydown={onKeydown}
                            placeholder={loading ? "Chargement de ta partie…" : "Tape le nom d'un personnage…"}
                            aria-label="Nom du personnage"
                            role="combobox"
                            aria-expanded={suggestions.length > 0}
                            aria-controls="dle-suggestions"
                            autocomplete="off"
                            disabled={loading || sending}
                        />
                        {#if suggestions.length}
                            <ul id="dle-suggestions" role="listbox" class="suggestions">
                                {#each suggestions as candidate, i (candidate.id)}
                                    <li role="option" aria-selected={i === highlighted}>
                                        <button
                                            type="button"
                                            class:active={i === highlighted}
                                            onmouseenter={() => (highlighted = i)}
                                            onclick={() => guess(candidate.id)}
                                        >
                                            <img src={portrait(candidate.image)} alt="" loading="lazy" />
                                            <span>
                                                <strong>{candidate.name}</strong>
                                                {#if candidate.title}<span class="muted">{candidate.title}</span>{/if}
                                            </span>
                                        </button>
                                    </li>
                                {/each}
                            </ul>
                        {:else if query.trim() && !loading}
                            <p class="suggestions empty muted">Aucun personnage à ce nom (ou déjà proposé).</p>
                        {/if}
                    </div>
                {/if}

                {#if message}
                    <p class="message-error" role="alert">{message}</p>
                {/if}

                {#if rows.length}
                    <div class="board" role="table" aria-label="Tes essais">
                        <div class="line head" role="row">
                            <span role="columnheader">Personnage</span>
                            {#each DLE_COLUMNS as column (column.key)}
                                <span role="columnheader">{column.label}</span>
                            {/each}
                        </div>
                        {#each rows.toReversed() as row (row.id)}
                            <div class="line" class:fresh={row.id === freshId} role="row">
                                <span class="who" role="cell" class:right={row.correct} title={row.name}>
                                    <img src={portrait(row.image)} alt="" />
                                    <span class="name">{row.name}</span>
                                </span>
                                {#each DLE_COLUMNS as column, i (column.key)}
                                    {@const cell = row[column.key]}
                                    <span
                                        class="cell {cell.status}"
                                        role="cell"
                                        style="--delay: {i * 0.25}s"
                                        title={cell.status === "right"
                                            ? "Identique"
                                            : cell.status === "partial"
                                              ? "Au moins un dragon en commun"
                                              : "Différent"}
                                    >
                                        <span class="cell-label" aria-hidden="true">{column.short}</span>
                                        {#if column.key === "dragon" && row.dragon.dragons.length}
                                            <span class="glyphs">
                                                {#each row.dragon.dragons as dragon (dragon)}
                                                    <span class="glyph" title={dragon} style="--icon: url('{dragonIcon(dragon)}')"></span>
                                                {/each}
                                            </span>
                                            <span class="sr-only">{cell.label}</span>
                                        {:else if cell.icon}
                                            <span class="glyph" aria-hidden="true" style="--icon: url('{cell.icon}')"></span>
                                            <span>{cell.label}</span>
                                        {:else}
                                            {cell.label}
                                        {/if}
                                    </span>
                                {/each}
                            </div>
                        {/each}
                    </div>
                    <p class="muted small">{rows.length} essai{rows.length > 1 ? "s" : ""}</p>
                {/if}
            {/if}
        </div>

        {#if mode === "daily"}
            <aside class="side">
                <section class="ranking panel">
                    <h2>Classement du jour</h2>
                    {#if data.account}
                        {#if data.account.ranking.entries.length}
                            <ol>
                                {#each data.account.ranking.entries as entry (entry.rank)}
                                    <li class:me={entry.me}>
                                        <span class="rank">{entry.rank}</span>
                                        <img src={portrait(entry.character?.image)} alt="" />
                                        <span class="who-rank">
                                            <strong>{entry.login}</strong>
                                            {#if entry.character}<span class="muted">{entry.character.name}</span>{/if}
                                        </span>
                                        <span class="score">
                                            <span>{entry.tries} essai{entry.tries > 1 ? "s" : ""}</span>
                                            <span class="muted">{entry.time}</span>
                                        </span>
                                    </li>
                                {/each}
                            </ol>
                        {:else}
                            <p class="muted">Personne n'a encore trouvé aujourd'hui.</p>
                        {/if}
                        {#if data.account.ranking.playing}
                            <p class="muted small">
                                {data.account.ranking.playing} joueur{data.account.ranking.playing > 1 ? "s" : ""} encore en train de chercher.
                            </p>
                        {/if}
                        {#if !data.account.ranked}
                            <p class="muted small">Le MJ connaît toutes les fiches : il joue hors classement.</p>
                        {/if}
                    {:else}
                        <p class="muted small">
                            <a class="link" href="/auth/login">Connecte-toi</a> pour garder ta partie et ta série sur ton
                            compte, et entrer au classement.
                        </p>
                    {/if}
                </section>

                {#if data.yesterday}
                    <p class="yesterday muted">
                        Hier, c'était
                        <a href="/personnages/{data.yesterday.id}">
                            <img src={portrait(data.yesterday.image)} alt="" />
                            {data.yesterday.name}
                        </a>
                    </p>
                {/if}
            </aside>
        {/if}
    </div>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        width: min(96rem, 96%);
        margin: 0 auto;
        padding: 2rem 0 4rem;
    }

    header {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .back {
        font-size: 0.9rem;
    }

    .back:hover {
        color: var(--accent);
    }

    h1 {
        font-size: 2.6rem;
    }

    .small {
        font-size: 0.85rem;
    }

    /* Couleurs des cases, celles des dragons : Guizamark identique, Lada en partie, Chronos rien. */
    .right {
        --tone: var(--Guizamark);
        --tone-ink: var(--background);
    }

    .partial {
        --tone: var(--Lada);
        --tone-ink: var(--background);
    }

    .wrong {
        --tone: var(--Chronos);
        --tone-ink: var(--foreground);
    }

    .cell {
        background-color: var(--tone);
        color: var(--tone-ink);
    }

    .modes {
        display: flex;
        gap: 0.5rem;
    }

    .modes button {
        padding: 0.35rem 1rem;
        border: 1px solid var(--border);
        border-radius: 999px;
        background: none;
        color: var(--muted);
        font-size: 1rem;
        transition: var(--transition);
    }

    .modes button:hover {
        border-color: var(--accent);
        color: var(--foreground);
    }

    .modes button.on {
        border-color: var(--accent);
        background-color: var(--accent);
        color: var(--background);
    }

    .search {
        position: relative;
    }

    .search input {
        color: var(--background);
    }

    .suggestions {
        position: absolute;
        z-index: 5;
        top: calc(100% + 0.25rem);
        left: 0;
        right: 0;
        max-height: 24rem;
        overflow-y: auto;
        background-color: var(--surface-raised);
        border: 1px solid var(--border);
        border-radius: var(--radius);
    }

    .suggestions.empty {
        padding: 0.75rem 1rem;
    }

    .suggestions button {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.4rem 0.75rem;
        border: none;
        background: none;
        color: var(--foreground);
        text-align: left;
        font-size: 1rem;
    }

    .suggestions button.active {
        background-color: rgba(229, 184, 204, 0.15);
    }

    .suggestions img {
        width: 2.5rem;
        height: 2.5rem;
        object-fit: cover;
        object-position: top;
        border-radius: var(--radius);
        background-color: #101010;
    }

    .suggestions button > span {
        display: flex;
        flex-direction: column;
    }

    .suggestions .muted {
        font-size: 0.8rem;
    }

    .board {
        /* Contient aussi les libellés masqués (positionnés en absolu) : sans ça, ils élargissent la page. */
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        overflow-x: auto;
    }

    /* Titre de la case, affiché seulement sur mobile où l'en-tête du tableau disparaît. */
    .cell-label {
        display: none;
    }

    .line {
        display: grid;
        /* Huit colonnes égales : le portrait et chaque case forment des carrés de même taille. */
        grid-template-columns: repeat(8, minmax(4.8rem, 1fr));
        gap: 0.4rem;
        min-width: 42rem;
    }

    .head span {
        color: var(--primary);
        font-size: 0.85rem;
        text-align: center;
        border-bottom: 1px solid var(--border);
        padding-bottom: 0.25rem;
    }

    /* Sur ordinateur, le portrait seul occupe la case ; le nom reste lisible au survol et par les lecteurs d'écran. */
    .who {
        position: relative;
        display: flex;
        /* La case épouse le carré du portrait au lieu de s'étirer sur la hauteur de la ligne. */
        align-self: center;
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background-color: #101010;
    }

    .who.right {
        border: 2px solid var(--Guizamark);
    }

    /* Portrait toujours carré, découpé depuis le haut, quelle que soit la taille de l'image d'origine. */
    .who img {
        display: block;
        width: 100%;
        height: auto;
        aspect-ratio: 1;
        object-fit: cover;
        object-position: top;
    }

    .name {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        line-height: 1.1;
    }

    .cell {
        display: flex;
        align-items: center;
        justify-content: center;
        /* Carré mesuré bordure et marges comprises, comme le portrait. */
        box-sizing: border-box;
        aspect-ratio: 1;
        /* Sans ces deux minimums à 0, le contenu peut agrandir le carré et toute la ligne avec. */
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        padding: 0.3rem 0.25rem;
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: var(--radius);
        font-size: 0.8rem;
        /* Un mot ne se coupe que s'il ne tient vraiment pas sur la ligne. */
        overflow-wrap: break-word;
        text-align: center;
        line-height: 1.15;
    }

    /* La ligne du dernier essai se retourne case par case, comme dans LoLdle. */
    .fresh .cell {
        animation: flip 0.5s ease-out both;
        animation-delay: var(--delay);
    }

    @keyframes flip {
        from {
            transform: rotateX(90deg);
            opacity: 0;
        }
        to {
            transform: rotateX(0);
            opacity: 1;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .fresh .cell {
            animation: none;
        }
    }

    .glyphs {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.3rem;
    }

    /* Symbole (dragon, pays) dessiné dans la couleur du texte de la case. */
    .glyph {
        display: block;
        flex-shrink: 0;
        width: 1.9rem;
        height: 1.9rem;
        background-color: var(--tone-ink);
        mask: var(--icon) center / contain no-repeat;
        -webkit-mask: var(--icon) center / contain no-repeat;
    }

    .cell:has(> .glyph) {
        flex-direction: column;
        gap: 0.25rem;
    }

    .victory {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 1.5rem;
        border-color: var(--Guizamark);
    }

    .victory img {
        width: 7rem;
        height: 7rem;
        object-fit: cover;
        object-position: top;
        border-radius: var(--radius);
        background-color: #101010;
    }

    .victory-text {
        flex: 1;
        min-width: 12rem;
    }

    .victory-text {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .victory strong {
        font-family: var(--titleFont);
        font-size: 2.2rem;
    }

    .victory-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }

    .layout {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .game,
    .side {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        min-width: 0;
    }

    /* Sur ordinateur, le classement passe à gauche du jeu. */
    @media (min-width: 1280px) {
        .layout.with-side {
            display: grid;
            grid-template-columns: 17rem minmax(0, 1fr);
            align-items: start;
        }

        .with-side .side {
            grid-column: 1;
            grid-row: 1;
            position: sticky;
            top: 1rem;
        }

        .with-side .game {
            grid-column: 2;
        }
    }

    .info {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem 1.5rem;
    }

    .next {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
    }

    .ranking h2 {
        font-size: 1.5rem;
        margin-bottom: 0.75rem;
    }

    .ranking ol {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        margin-bottom: 0.5rem;
    }

    .ranking li {
        display: grid;
        grid-template-columns: 1.6rem 2.4rem 1fr auto;
        align-items: center;
        gap: 0.75rem;
        padding: 0.3rem 0.5rem;
        border-radius: var(--radius);
    }

    .ranking li.me {
        background-color: var(--players-soft);
        outline: 1px solid var(--Guizamark);
    }

    .rank {
        font-family: var(--titleFont);
        font-size: 1.3rem;
        color: var(--secondary);
        text-align: center;
    }

    .ranking img {
        width: 2.4rem;
        height: 2.4rem;
        object-fit: cover;
        object-position: top;
        border-radius: 50%;
        background-color: #101010;
    }

    .who-rank {
        display: flex;
        flex-direction: column;
        line-height: 1.15;
    }

    .who-rank .muted,
    .score .muted {
        font-size: 0.8rem;
    }

    .score {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        white-space: nowrap;
        font-size: 0.9rem;
        line-height: 1.15;
    }

    .link {
        color: var(--accent);
        text-decoration: underline;
    }

    .yesterday {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
    }

    .yesterday a {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--foreground);
    }

    .yesterday a:hover {
        color: var(--accent);
    }

    .yesterday img {
        width: 1.8rem;
        height: 1.8rem;
        object-fit: cover;
        object-position: top;
        border-radius: 50%;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
    }

    /* Mobile : chaque essai devient une carte, portrait et nom en haut, puis les cases sur deux lignes. */
    @media (max-width: 700px) {
        .board {
            gap: 0.75rem;
            overflow: visible;
        }

        .line {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 0.3rem;
            min-width: 0;
            padding: 0.4rem;
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background-color: var(--surface);
        }

        .line.head {
            display: none;
        }

        .modes {
            justify-content: center;
        }

        /* Sur mobile, la carte garde le nom à côté du portrait. */
        .who,
        .who.right {
            grid-column: 1 / -1;
            align-items: center;
            gap: 0.6rem;
            border: none;
            background: none;
            overflow: visible;
        }

        .who img {
            width: 2.6rem;
            height: 2.6rem;
            min-height: 0;
            border-radius: var(--radius);
        }

        .who.right img {
            outline: 2px solid var(--Guizamark);
        }

        .name {
            position: static;
            width: auto;
            height: auto;
            overflow: visible;
            clip-path: none;
            font-family: var(--titleFont);
            font-size: 1.15rem;
        }

        /* Titre collé en haut, valeur centrée dans le reste de la case. */
        .cell {
            position: relative;
            flex-direction: column;
            justify-content: center;
            gap: 0.15rem;
            /* Sur mobile, le titre de la case prend de la place : hauteur libre plutôt que carré. */
            aspect-ratio: auto;
            min-height: 4.6rem;
            padding: 1.05rem 0.2rem 0.3rem;
            font-size: 0.72rem;
        }

        /* Le flux exact, souvent long, prend la place de deux cases. */
        .cell:last-child {
            grid-column: span 2;
        }

        .cell-label {
            display: block;
            position: absolute;
            top: 0.25rem;
            left: 0;
            right: 0;
            overflow-wrap: normal;
            font-size: 0.6rem;
            opacity: 0.75;
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }

        .glyph {
            width: 1.5rem;
            height: 1.5rem;
        }

        .info {
            flex-direction: column;
            align-items: flex-start;
        }
    }

    @media (max-width: 600px) {
        h1 {
            font-size: 2rem;
        }

        .victory {
            flex-direction: column;
            text-align: center;
        }

        .victory-actions {
            justify-content: center;
        }
    }

    /* Récompense du jour : un booster de cartes (seulement quand le jeu de cartes est visible). */
    .reward {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0.8rem 0.25rem 0.6rem;
        border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
        border-radius: 999px;
        background: color-mix(in srgb, var(--accent) 10%, transparent);
        color: var(--accent);
        font-size: 0.85rem;
        transition: var(--transition);
    }

    .reward:hover {
        background: color-mix(in srgb, var(--accent) 20%, transparent);
    }

    .reward.won {
        align-self: flex-start;
        margin: 0.25rem 0 0.5rem;
    }

    .reward .gem {
        width: 0.75rem;
        height: 1.15rem;
        flex-shrink: 0;
        clip-path: polygon(50% 0, 100% 17%, 100% 83%, 50% 100%, 0 83%, 0 17%);
        background: linear-gradient(160deg, #fff, var(--accent) 45%, color-mix(in srgb, var(--accent) 40%, #000));
    }
</style>
