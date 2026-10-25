<script lang="ts">
    // Usure d'un exemplaire, posée sur une face. Deux familles :
    //
    // · la surface, en textures réelles (static/cartes/usure) : crasse, poussière, bords blanchis,
    //   rayures fines et frottement. Les rayures ne s'allument que sous le reflet, comme sur une vraie
    //   carte. Chaque exemplaire décale et retourne les textures à sa façon : deux cartes ne s'usent
    //   jamais pareil ;
    // · les dégâts du carton, dessinés (cardDamage) : plis à l'encre craquelée, coins cornés, coin
    //   replié, déchirures aux bords fibreux, reportés en miroir au verso.
    //
    // Toujours les mêmes pour un exemplaire donné (graine = id de l'exemplaire).
    import { cardDamage, seeded } from "$lib/cards/patterns";

    let {
        wear,
        seed,
        soft = false,
        mirror = false,
        surface = true,
    }: {
        wear: number;
        seed: number;
        /** Verso : traces plus discrètes. */
        soft?: boolean;
        /** Verso : les dégâts sont vus de l'autre côté. */
        mirror?: boolean;
        /** Faux dans les grilles : ni rayures ni filtres, seulement ce qui se voit de loin. */
        surface?: boolean;
    } = $props();

    let damage = $derived(cardDamage(seed, wear, mirror));
    let uid = $props.id();

    const ramp = (from: number, to: number) => Math.min(1, Math.max(0, (wear - from) / (to - from)));

    // Placement propre à l'exemplaire : taille, décalage et retournement de chaque texture.
    let layers = $derived.by(() => {
        const rand = seeded(seed * 31 + (mirror ? 7 : 0));
        const place = (min: number, max: number) => {
            const size = min + rand() * (max - min);
            return `--size: ${size.toFixed(0)}%; --x: ${(rand() * 100).toFixed(0)}%; --y: ${(rand() * 100).toFixed(0)}%; --fx: ${rand() > 0.5 ? -1 : 1}; --fy: ${rand() > 0.5 ? -1 : 1};`;
        };
        const stain = {
            show: wear >= 0.6 && rand() < 0.35,
            style: `left: ${(rand() * 70 - 10).toFixed(0)}%; top: ${(rand() * 75 - 10).toFixed(0)}%; width: ${(40 + rand() * 25).toFixed(0)}%; transform: rotate(${(rand() * 360).toFixed(0)}deg);`,
        };
        const k = soft ? 0.6 : 1;
        return {
            grime: { style: place(120, 200), alpha: ramp(0.25, 0.9) * 0.75 * k },
            dust: { style: place(45, 75), alpha: ramp(0.05, 0.8) * 0.4 * k },
            edge: { style: place(50, 80), width: 0.5 + wear * 2.2, alpha: ramp(0.02, 0.6) * k },
            fine: { style: place(220, 320), alpha: ramp(0.02, 0.45) * k },
            scuff: { style: place(180, 260), alpha: ramp(0.38, 0.95) * 0.7 * k },
            stain,
        };
    });
</script>

{#if wear > 0.01}
    <div class="wear" class:soft aria-hidden="true">
        <div class="tex grime" style="{layers.grime.style} opacity: {layers.grime.alpha}"></div>
        <div class="tex dust" style="{layers.dust.style} opacity: {layers.dust.alpha}"></div>
        <div class="tex edge" style="{layers.edge.style} --edge: {layers.edge.width}cqw; opacity: {layers.edge.alpha}"></div>
        {#if surface}
            <div class="tex fine lit" style="{layers.fine.style} --k: {layers.fine.alpha}"></div>
            {#if layers.scuff.alpha > 0}
                <div class="tex scuff lit" style="{layers.scuff.style} --k: {layers.scuff.alpha}"></div>
            {/if}
        {/if}
        {#if layers.stain.show}
            <img class="stain" src="/cartes/usure/tache-cafe.webp" alt="" style={layers.stain.style} />
        {/if}

        <svg viewBox="0 0 63 88" preserveAspectRatio="none">
            {#if surface}
                <defs>
                    <!-- Bords fibreux : le tracé est déformé par un bruit fin, comme du carton arraché. -->
                    <filter id="fray-{uid}" x="-5%" y="-5%" width="110%" height="110%">
                        <feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="2" seed={seed % 97} />
                        <feDisplacementMap in="SourceGraphic" scale="0.7" xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                    <!-- Pli : arête et creux adoucis. -->
                    <filter id="soft-{uid}" x="-5%" y="-5%" width="110%" height="110%">
                        <feGaussianBlur stdDeviation="0.35" />
                    </filter>
                    <linearGradient id="flap-{uid}" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stop-color="#f3ecda" />
                        <stop offset="0.6" stop-color="#ddd3ba" />
                        <stop offset="1" stop-color="#bfb498" />
                    </linearGradient>
                </defs>
            {/if}

            {#each damage.corners as corner, i (i)}
                <path class="corner-shade" d={corner.shade} />
                <path class="crease-dark" d={corner.line} filter={surface ? `url(#soft-${uid})` : undefined} />
                <path class="crease-light" d={corner.line} transform="translate(0.3 0.3)" />
            {/each}

            {#each damage.folds as fold, i (i)}
                <path class="fold-shadow" d={fold} transform="translate(0 -0.5)" filter={surface ? `url(#soft-${uid})` : undefined} />
                <path class="fold-light" d={fold} transform="translate(0 0.5)" filter={surface ? `url(#soft-${uid})` : undefined} />
                <path class="crease-dark" d={fold} />
            {/each}
            {#if damage.cracks}
                <path class="cracks" d={damage.cracks} />
            {/if}

            {#each damage.tears as tear, i (i)}
                <g filter={surface ? `url(#fray-${uid})` : undefined}>
                    <path class="tear-core" d={tear.d} stroke-width={tear.width + 0.7} />
                    <path class="tear-gap" d={tear.d} stroke-width={tear.width} />
                </g>
                <path class="tear-lip" d={tear.d} stroke-width={tear.width * 0.5} transform="translate(0.35 0.2)" />
            {/each}
            {#if damage.notchEdge}
                <path class="tear-core" d={damage.notchEdge} stroke-width="0.8" filter={surface ? `url(#fray-${uid})` : undefined} />
            {/if}
            {#if surface && damage.fibers}
                <path class="fibers" d={damage.fibers} />
            {/if}

            {#if damage.flap}
                <path class="flap-shadow" d={damage.flap.shadow} />
                <path d={damage.flap.flap} fill={surface ? `url(#flap-${uid})` : "#e2d9c2"} />
                <path class="flap-crease" d={damage.flap.flap} />
            {/if}
        </svg>
    </div>
{/if}

<style>
    .wear {
        position: absolute;
        inset: 0;
        z-index: 8;
        pointer-events: none;
        overflow: hidden;
        border-radius: inherit;
    }

    /* ─── Textures ─────────────────────────────────────────────── */

    .tex {
        position: absolute;
        inset: 0;
        background-repeat: repeat;
        background-size: var(--size) auto;
        background-position: var(--x) var(--y);
        transform: scale(var(--fx), var(--fy));
    }

    .grime {
        background-image: url("/cartes/usure/crasse.webp");
        mix-blend-mode: multiply;
    }

    .dust {
        background-image: url("/cartes/usure/poussiere.webp");
    }

    /* Bords et coins blanchis par le frottement, écaillés par la texture de frottement. */
    .edge {
        background:
            radial-gradient(circle at 0 0, #f3ecdc 0, transparent calc(var(--edge) * 2.5)),
            radial-gradient(circle at 100% 0, #f3ecdc 0, transparent calc(var(--edge) * 2.5)),
            radial-gradient(circle at 100% 100%, #f3ecdc 0, transparent calc(var(--edge) * 2.5)),
            radial-gradient(circle at 0 100%, #f3ecdc 0, transparent calc(var(--edge) * 2.5));
        box-shadow: inset 0 0 0 var(--edge) #f3ecdc;
        -webkit-mask-image: url("/cartes/usure/rayures-frottement.webp");
        mask-image: url("/cartes/usure/rayures-frottement.webp");
        -webkit-mask-size: var(--size) auto;
        mask-size: var(--size) auto;
        -webkit-mask-position: var(--x) var(--y);
        mask-position: var(--x) var(--y);
    }

    .fine {
        background-image: url("/cartes/usure/rayures-fines.webp");
    }

    .scuff {
        background-image: url("/cartes/usure/rayures-frottement.webp");
    }

    /* Rayures : presque invisibles hors de la lumière, vives là où passe le reflet. */
    .lit {
        mix-blend-mode: screen;
        opacity: calc(var(--k) * (0.35 + var(--active) * 0.9));
        -webkit-mask-image: radial-gradient(
            circle at calc(var(--mx) * 1%) calc(var(--my) * 1%),
            #000 0%,
            rgba(0, 0, 0, 0.45) 30%,
            rgba(0, 0, 0, 0.12) 65%
        );
        mask-image: radial-gradient(
            circle at calc(var(--mx) * 1%) calc(var(--my) * 1%),
            #000 0%,
            rgba(0, 0, 0, 0.45) 30%,
            rgba(0, 0, 0, 0.12) 65%
        );
    }

    .stain {
        position: absolute;
        mix-blend-mode: multiply;
        opacity: 0.6;
    }

    .soft .stain {
        opacity: 0.35;
    }

    /* ─── Dégâts dessinés ──────────────────────────────────────── */

    svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
    }

    path {
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
    }

    /* Pli : une ombre d'un côté, une arête éclairée de l'autre (plus vive sous la lumière),
       le creux net au milieu, et l'encre qui s'est craquelée le long du pli. */
    .fold-shadow {
        stroke: rgba(0, 0, 0, 0.32);
        stroke-width: 1.1;
    }

    .fold-light {
        stroke: rgba(255, 255, 255, 1);
        stroke-width: 0.9;
        opacity: calc(0.18 + var(--active) * 0.3);
    }

    .crease-dark {
        stroke: rgba(20, 14, 8, 0.55);
        stroke-width: 0.22;
    }

    .crease-light {
        stroke: rgba(255, 255, 255, 0.4);
        stroke-width: 0.25;
    }

    .cracks {
        stroke: #f4ede0;
        stroke-width: 0.16;
        opacity: 0.85;
    }

    .corner-shade {
        fill: rgba(255, 255, 255, 0.12);
    }

    /* Déchirure : l'âme claire du carton de part et d'autre, la fente sombre au milieu, un bord
       légèrement soulevé, et des fils de carton qui dépassent. */
    .tear-core {
        stroke: #ebe3d1;
    }

    .tear-gap {
        stroke: rgba(12, 9, 6, 0.9);
    }

    .tear-lip {
        stroke: rgba(255, 255, 255, 0.35);
    }

    .fibers {
        stroke: #f2ead9;
        stroke-width: 0.07;
        opacity: 0.9;
    }

    .flap-shadow {
        fill: rgba(0, 0, 0, 0.45);
    }

    .flap-crease {
        stroke: rgba(0, 0, 0, 0.25);
        stroke-width: 0.3;
    }
</style>
