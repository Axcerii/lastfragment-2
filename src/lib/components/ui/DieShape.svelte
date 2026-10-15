<script lang="ts" module>
    // Silhouette de chaque dé, dans un carré de 100 × 100.
    // d4 triangle, d6 carré, d8 losange, d10 cerf-volant, d12 pentagone, d20 hexagone
    // (avec le triangle de la face avant), d100 décagone ; tout autre dé est un cercle.

    function regular(sides: number, radius: number, cx = 50, cy = 50, rotation = -90): string {
        return Array.from({ length: sides }, (_, i) => {
            const angle = ((rotation + (360 / sides) * i) * Math.PI) / 180;
            return `${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`;
        }).join(" ");
    }

    interface Shape {
        points: string | null;
        /** Lignes intérieures (arêtes visibles), facultatives. */
        inner?: string;
        /** Hauteur du centre du chiffre (le triangle du d4 a son centre plus bas). */
        textY: number;
    }

    const SHAPES: Record<number, Shape> = {
        4: { points: "50,7 95,88 5,88", textY: 64 },
        6: { points: "12,12 88,12 88,88 12,88", textY: 50 },
        8: { points: "50,3 95,50 50,97 5,50", inner: "5,50 95,50", textY: 50 },
        10: { points: "50,3 95,42 50,97 5,42", inner: "5,42 50,58 95,42 M50,58 50,97", textY: 40 },
        12: { points: regular(5, 47, 50, 53), textY: 54 },
        20: { points: regular(6, 48), inner: "50,26 79,74 21,74 Z", textY: 57 },
        100: { points: regular(10, 47, 50, 50, -90), textY: 50 },
    };

    export function shapeOf(faces: number): Shape {
        return SHAPES[faces] ?? { points: null, textY: 50 };
    }
</script>

<script lang="ts">
    let {
        faces,
        label = String(faces),
        size = "2.25rem",
        color = "var(--chance)",
        filled = false,
        dim = false,
        title,
    }: {
        faces: number;
        /** Texte au centre : le nombre de faces dans un menu, la valeur tirée dans un résultat. */
        label?: string | number;
        size?: string;
        color?: string;
        /** Dé plein (résultat maximal, par exemple). */
        filled?: boolean;
        /** Dé éteint (résultat minimal, par exemple). */
        dim?: boolean;
        title?: string;
    } = $props();

    let shape = $derived(shapeOf(faces));
    let text = $derived(String(label));
    // Le chiffre rétrécit avec sa longueur pour rester dans la forme.
    let fontSize = $derived(text.length <= 1 ? 40 : text.length === 2 ? 34 : 25);
    // Le triangle du d4 laisse moins de place.
    let scale = $derived(faces === 4 ? 0.82 : 1);
</script>

<svg
    class="die"
    class:filled
    class:dim
    viewBox="0 0 100 100"
    style="width: {size}; height: {size}; --die: {color};"
    role="img"
    aria-label={title ?? `d${faces} : ${text}`}
>
    {#if title}<title>{title}</title>{/if}
    {#if shape.points}
        <polygon class="body" points={shape.points} />
    {:else}
        <circle class="body" cx="50" cy="50" r="46" />
    {/if}
    {#if shape.inner}
        <path class="edge" d="M{shape.inner}" />
    {/if}
    <text x="50" y={shape.textY} font-size={fontSize * scale}>{text}</text>
</svg>

<style>
    .die {
        display: inline-block;
        flex-shrink: 0;
        overflow: visible;
    }

    .body {
        fill: rgba(0, 0, 0, 0.25);
        stroke: var(--die);
        stroke-width: 5;
        stroke-linejoin: round;
    }

    .edge {
        fill: none;
        stroke: var(--die);
        stroke-width: 2.5;
        stroke-linejoin: round;
        opacity: 0.45;
    }

    text {
        fill: var(--foreground);
        font-family: var(--titleFont);
        font-weight: 700;
        text-anchor: middle;
        dominant-baseline: central;
    }

    .filled .body {
        fill: var(--die);
    }

    .filled .edge {
        stroke: var(--background);
    }

    .filled text {
        fill: var(--background);
    }

    .dim {
        opacity: 0.55;
    }
</style>
