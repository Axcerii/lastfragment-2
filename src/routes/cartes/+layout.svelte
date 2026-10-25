<script lang="ts">
    // Jeu de cartes : navigation entre boosters, collection, échanges et joueurs. Sur ordinateur,
    // un sélecteur collant en haut dont la pastille glisse d'un onglet à l'autre ; sur téléphone,
    // une barre fixe en bas de l'écran, à portée du pouce, avec un trait lumineux qui suit.
    import { page } from "$app/state";
    import { fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";

    let { data, children } = $props();

    const LINKS = [
        { href: "/cartes", label: "Boosters", icon: "◇" },
        { href: "/cartes/collection", label: "Collection", icon: "▦" },
        { href: "/cartes/echanges", label: "Échanges", icon: "⇄" },
        { href: "/cartes/joueurs", label: "Joueurs", icon: "♜" },
    ];

    const isActive = (href: string) =>
        href === "/cartes" ? page.url.pathname === "/cartes" : page.url.pathname.startsWith(href);

    let activeIndex = $derived(LINKS.findIndex((l) => isActive(l.href)));
    // Change à chaque onglet (pas à chaque filtre) : le contenu n'entre en glissant que là.
    let section = $derived(activeIndex < 0 ? page.url.pathname : LINKS[activeIndex].href);
    let previous = 0;
    let direction = $derived.by(() => {
        const dir = activeIndex >= previous ? 1 : -1;
        previous = Math.max(0, activeIndex);
        return dir;
    });

    // ─── Pastille : se place sous l'onglet actif, puis glisse vers le suivant ───
    let tabs: HTMLAnchorElement[] = $state([]);
    let pill = $state<{ x: number; w: number } | null>(null);
    let ready = $state(false);

    function place() {
        const el = tabs[activeIndex];
        pill = el ? { x: el.offsetLeft, w: el.offsetWidth } : null;
    }

    // Pas d'animation au premier placement : la pastille est déjà là au chargement. Ensuite, la
    // transition s'active en même temps que le déplacement, ce qui suffit au navigateur.
    let placed = false;
    $effect(() => {
        void activeIndex;
        if (placed) ready = true;
        place();
        placed = true;
    });

    const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
</script>

<svelte:window onresize={place} />

{#if data.user}
    <nav class="cards-nav" aria-label="Jeu de cartes">
        <div class="tabs">
            {#if pill}
                <span class="pill" class:ready style="--x: {pill.x}px; --w: {pill.w}px" aria-hidden="true"></span>
            {/if}
            {#each LINKS as link, i (link.href)}
                <a
                    bind:this={tabs[i]}
                    href={link.href}
                    class:active={i === activeIndex}
                    aria-current={i === activeIndex ? "page" : undefined}
                >
                    <span class="icon" aria-hidden="true">{link.icon}</span>
                    <span class="label">{link.label}</span>
                    {#if link.href === "/cartes/echanges" && data.pendingTrades > 0}
                        <span class="badge" aria-label="{data.pendingTrades} en attente">{data.pendingTrades}</span>
                    {/if}
                </a>
            {/each}
        </div>
        {#if data.user.isAdmin}
            <a href="/admin/cartes" class="mj">Espace MJ</a>
        {/if}
    </nav>
{/if}

<div class="cards-page">
    {#key section}
        <div class="enter" in:fly={{ x: reduced() ? 0 : 24 * direction, duration: reduced() ? 0 : 320, easing: cubicOut }}>
            {@render children()}
        </div>
    {/key}
</div>

<style>
    .cards-nav {
        position: sticky;
        top: 0;
        z-index: 9000;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        padding: 0.9rem 1rem;
        border-bottom: 1px solid var(--border);
        background: rgba(27, 27, 27, 0.88);
        backdrop-filter: blur(8px);
    }

    .tabs {
        position: relative;
        display: flex;
        gap: 0.25rem;
        padding: 0.3rem;
        border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
        border-radius: 999px;
        background: var(--surface);
        box-shadow: 0 0.4rem 1.6rem rgba(0, 0, 0, 0.35);
    }

    .pill {
        position: absolute;
        top: 0.3rem;
        bottom: 0.3rem;
        left: 0;
        width: var(--w);
        transform: translateX(var(--x));
        border-radius: 999px;
        background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 85%, #fff), var(--accent));
        box-shadow:
            0 0 1.2rem color-mix(in srgb, var(--accent) 45%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
    }

    .pill.ready {
        transition:
            transform 0.45s cubic-bezier(0.34, 1.4, 0.5, 1),
            width 0.45s cubic-bezier(0.34, 1.4, 0.5, 1);
    }

    .tabs a {
        position: relative;
        z-index: 1;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1.4rem;
        border-radius: 999px;
        color: var(--foreground);
        font-size: 1rem;
        letter-spacing: 0.02em;
        transition:
            color 0.3s ease,
            transform 0.2s ease;
    }

    .tabs a:hover:not(.active) {
        color: var(--accent);
    }

    .tabs a:active {
        transform: scale(0.96);
    }

    .tabs a.active {
        color: var(--background);
        font-weight: 700;
    }

    .icon {
        font-size: 1.1rem;
        line-height: 1;
        transition: transform 0.35s cubic-bezier(0.34, 1.6, 0.5, 1);
    }

    .tabs a.active .icon {
        transform: scale(1.2) rotate(-8deg);
    }

    .mj {
        padding: 0.5rem 1rem;
        border: 1px solid var(--border);
        border-radius: 999px;
        color: var(--muted);
        font-size: 0.85rem;
        transition: var(--transition);
    }

    .mj:hover {
        color: var(--foreground);
        border-color: var(--accent);
    }

    .badge {
        min-width: 1.2rem;
        height: 1.2rem;
        padding: 0 0.3rem;
        border-radius: 999px;
        background: var(--chance);
        color: #fff;
        font-size: 0.7rem;
        font-weight: 700;
        display: inline-grid;
        place-items: center;
    }

    .cards-page {
        min-height: 60dvh;
        overflow-x: clip;
    }

    @media (prefers-reduced-motion: reduce) {
        .pill.ready,
        .icon {
            transition: none;
        }
    }

    @media (max-width: 700px) {
        .cards-nav {
            position: fixed;
            top: auto;
            left: 0;
            right: 0;
            bottom: 0;
            padding: 0 0 env(safe-area-inset-bottom);
            border-top: 1px solid var(--border);
            border-bottom: none;
            background: rgba(27, 27, 27, 0.96);
        }

        .tabs {
            flex: 1;
            justify-content: space-around;
            gap: 0;
            padding: 0;
            border: none;
            border-radius: 0;
            background: none;
            box-shadow: none;
        }

        /* Sur téléphone, la pastille devient un trait lumineux en haut de l'onglet. */
        .pill {
            top: 0;
            bottom: auto;
            height: 3px;
            border-radius: 0 0 3px 3px;
            background: var(--accent);
            box-shadow: 0 0 0.8rem var(--accent);
        }

        .tabs a {
            flex: 1;
            flex-direction: column;
            gap: 0.15rem;
            padding: 0.55rem 0.2rem 0.45rem;
            border-radius: 0;
            font-size: 0.68rem;
        }

        .tabs a.active {
            color: var(--accent);
            background: linear-gradient(to bottom, color-mix(in srgb, var(--accent) 14%, transparent), transparent);
        }

        .icon {
            font-size: 1.3rem;
        }

        .tabs a.active .icon {
            transform: translateY(-2px) scale(1.15);
        }

        .badge {
            position: absolute;
            top: 0.25rem;
            right: calc(50% - 1.4rem);
        }

        .mj {
            display: none;
        }

        /* En haut, le bouton du menu du site flotte par-dessus la page. */
        .cards-page {
            padding-top: 3.5rem;
            padding-bottom: 4.5rem;
        }
    }
</style>
