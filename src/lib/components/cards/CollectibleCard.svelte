<script lang="ts">
    // Carte à collectionner, recto et verso. Le reflet (finition) et l'inclinaison suivent la souris,
    // le doigt ou le gyroscope du téléphone : leur position passe par des variables CSS mises à jour
    // directement sur l'élément, une fois par image, sans repasser par Svelte.
    //
    //   tilt="none"   carte figée (grilles sur téléphone, aperçus)
    //   tilt="hover"  s'incline au survol de la souris seulement : le doigt fait défiler la page
    //   tilt="full"   se manipule au doigt ; glisser sur le côté la fait tourner sur elle-même,
    //                 un toucher la retourne, glisser vers le haut la jette (si `onswipeup`)
    import { onDestroy, untrack } from "svelte";
    import Icon from "$lib/components/ui/Icon.svelte";
    import { dragonText, parseDragons } from "$lib/game/labels";
    import { cardDamage, damageMask, glitter, shardLines, shardMask } from "$lib/cards/patterns";
    import {
        CARD_TYPES,
        formatSerial,
        inkOn,
        padNumber,
        rarityLabel,
        type CardImage,
        type CardLook,
        type CopyView,
    } from "$lib/cards/types";
    import CardBack from "./CardBack.svelte";
    import WearMarks from "./WearMarks.svelte";

    let {
        card,
        copy = null,
        flipped = $bindable(false),
        tilt = "none",
        lite = false,
        wear: wearOverride,
        gyro = false,
        glow = false,
        label,
        onswipeup,
        ontap,
    }: {
        card: CardLook;
        copy?: CopyView | null;
        flipped?: boolean;
        tilt?: "none" | "hover" | "full";
        /** Grilles : pas de verso, pas de rayures, petites images. */
        lite?: boolean;
        /** Usure imposée (aperçu du créateur) ; sinon celle de l'exemplaire. */
        wear?: number;
        /** Inclinaison au gyroscope (vue détaillée sur téléphone, après autorisation). */
        gyro?: boolean;
        /** Halo de la couleur de la rareté autour de la carte. */
        glow?: boolean;
        label?: string;
        /** La carte jetée vers le haut (pile du booster) : appelé une fois qu'elle est partie. */
        onswipeup?: () => void;
        /** Remplace le retournement au toucher (pile du booster : un toucher passe à la suivante). */
        ontap?: () => void;
    } = $props();

    let face = $derived(card.face);
    let wear = $derived(wearOverride ?? copy?.wear ?? 0);
    let seed = $derived(copy?.id ?? 7);
    let dragons = $derived(parseDragons(face.dragons));
    let ink = $derived(inkOn(face.accent));
    let finish = $derived(face.finish);

    // Motifs propres à la carte : calculés seulement pour les finitions qui en ont besoin.
    let patterns = $derived.by(() => {
        if (finish === "eclat") return `--shards: ${shardMask(seed + 11)}; --cracks: ${shardLines(seed + 11)};`;
        if (finish === "prisme") return `--glitter: ${glitter(seed + 5)};`;
        return "";
    });

    // Coin replié et morceau arraché retirent une partie de la carte, en miroir au verso.
    let frontMask = $derived(damageMask(cardDamage(seed, wear)));
    let backMask = $derived(damageMask(cardDamage(seed, wear, true)));
    const maskStyle = (mask: string | null) =>
        mask ? `-webkit-mask: ${mask} 0 0 / 100% 100% no-repeat; mask: ${mask} 0 0 / 100% 100% no-repeat;` : "";

    const src = (image: CardImage | null) => (image ? (lite ? image.small : image.large) : null);

    // Le cadrage (décalage, zoom) s'applique à une boîte de la taille de la zone ; l'image y est
    // posée dedans. En `cover`, elle n'est pas rognée par `object-fit` mais dimensionnée pour couvrir
    // la zone et dépasser de ses bords : dézoomer révèle alors les côtés au lieu de rétrécir une
    // image déjà coupée. Il faut pour ça son rapport largeur / hauteur, lu une fois chargée.
    function placement(image: CardImage) {
        return `transform: translate(${image.x}%, ${image.y}%) scale(${image.zoom});`;
    }

    // Nom trop long pour le bandeau : la taille estimée d'après sa longueur est affinée en mesurant,
    // et réduite juste assez pour qu'il tienne (les lettres larges, « M » ou « W », prennent plus).
    // Tout reste en unités de la carte : la mesure vaut quelle que soit sa taille à l'écran.
    function fitName(el: HTMLElement) {
        const fit = () => {
            el.style.setProperty("--fit", "1");
            if (el.clientWidth && el.scrollWidth > el.clientWidth) {
                el.style.setProperty("--fit", String(Math.max(0.5, (el.clientWidth / el.scrollWidth) * 0.98)));
            }
        };
        // Remesuré quand la carte change de taille et quand le nom change (une fois le texte en place).
        const resized = new ResizeObserver(fit);
        const renamed = new MutationObserver(fit);
        resized.observe(el);
        renamed.observe(el, { childList: true, characterData: true, subtree: true });
        fit();
        return {
            destroy: () => {
                resized.disconnect();
                renamed.disconnect();
            },
        };
    }

    // Rapport largeur / hauteur de chaque image, rangé sous son adresse (attribut `src`).
    let ratios = $state<Record<string, number>>({});

    function measure(img: HTMLImageElement) {
        const read = () => {
            const url = img.getAttribute("src");
            if (url && img.naturalWidth && img.naturalHeight) ratios[url] = img.naturalWidth / img.naturalHeight;
        };
        if (img.complete) read();
        img.addEventListener("load", read);
        return { destroy: () => img.removeEventListener("load", read) };
    }

    const sized = (image: CardImage) => image.fit === "cover" && !!ratios[src(image) ?? ""];

    function imageStyle(image: CardImage) {
        if (image.fit === "contain") return "object-fit: contain; object-position: 50% 100%;";
        const ratio = ratios[src(image) ?? ""];
        return ratio ? `--r: ${ratio};` : "object-fit: cover;";
    }

    // ─── Inclinaison ───
    let scene: HTMLDivElement | undefined = $state();
    let cardEl: HTMLDivElement | undefined = $state();
    const rest = { x: 0.5, y: 0.5, a: 0 };
    let target = { ...rest };
    let current = { ...rest };
    let frame = 0;
    let reduced = false;
    if (typeof window !== "undefined") {
        reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function paint() {
        if (!scene) return;
        const k = 0.16;
        current.x += (target.x - current.x) * k;
        current.y += (target.y - current.y) * k;
        current.a += (target.a - current.a) * k;
        const s = scene.style;
        s.setProperty("--mx", (current.x * 100).toFixed(2));
        s.setProperty("--my", (current.y * 100).toFixed(2));
        s.setProperty("--active", current.a.toFixed(3));
        s.setProperty("--rx", `${((0.5 - current.y) * 24 * current.a).toFixed(2)}deg`);
        s.setProperty("--ry", `${((current.x - 0.5) * 28 * current.a).toFixed(2)}deg`);
        s.setProperty("--hyp", Math.min(1, Math.hypot(current.x - 0.5, current.y - 0.5) * 2).toFixed(3));
        const moving =
            Math.abs(target.x - current.x) + Math.abs(target.y - current.y) + Math.abs(target.a - current.a) > 0.002;
        frame = moving ? requestAnimationFrame(paint) : 0;
    }

    function kick() {
        if (!frame && !reduced) frame = requestAnimationFrame(paint);
    }

    function aim(clientX: number, clientY: number) {
        if (!scene) return;
        const box = scene.getBoundingClientRect();
        let x = (clientX - box.left) / box.width;
        // Verso visible : le reflet suit le doigt du bon côté.
        if (Math.cos(((angle + drag) * Math.PI) / 180) < 0) x = 1 - x;
        target = {
            x: Math.min(1, Math.max(0, x)),
            y: Math.min(1, Math.max(0, (clientY - box.top) / box.height)),
            a: 1,
        };
        kick();
    }

    function release() {
        target = { ...rest };
        kick();
    }

    // ─── Retournement ───
    // `angle` est l'angle de repos (multiple de 180°) ; pendant un glissé, l'écart suit le doigt
    // (`drag`) sans repasser par Svelte, puis la carte se pose sur la face la plus proche.
    let angle = $state(untrack(() => (flipped ? 180 : 0)));
    let dragging = $state(false);
    let flung = $state(false);
    let drag = 0;
    const isBack = (a: number) => Math.abs(Math.round(a / 180)) % 2 === 1;

    $effect(() => {
        // Retournée de l'extérieur (bouton « Verso ») : un demi-tour de plus.
        if (flipped !== isBack(angle)) untrack(() => (angle += 180));
    });

    function turn(steps: number) {
        angle += steps * 180;
        flipped = isBack(angle);
    }

    let press: { x: number; y: number; t: number; axis: "x" | "y" | null; width: number; height: number } | null = null;
    let last = { x: 0, y: 0, t: 0, vx: 0, vy: 0 };

    function setDrag(degrees: number, lift = 0, lean = 0) {
        drag = degrees;
        const s = cardEl?.style;
        s?.setProperty("--drag", `${degrees.toFixed(1)}deg`);
        s?.setProperty("--lift", `${lift.toFixed(1)}px`);
        s?.setProperty("--lean", `${lean.toFixed(2)}deg`);
    }

    function clearDrag() {
        drag = 0;
        for (const name of ["--drag", "--lift", "--lean"]) cardEl?.style.removeProperty(name);
    }

    function onpointerdown(e: PointerEvent) {
        if (tilt !== "full" || flung) return;
        const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
        press = { x: e.clientX, y: e.clientY, t: performance.now(), axis: null, width: box.width, height: box.height };
        last = { x: e.clientX, y: e.clientY, t: performance.now(), vx: 0, vy: 0 };
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        aim(e.clientX, e.clientY);
    }

    function onpointermove(e: PointerEvent) {
        if (tilt === "none") return;
        if (tilt === "hover" && e.pointerType !== "mouse") return;
        if (tilt === "full" && e.pointerType !== "mouse" && !press) return;
        if (press) {
            const now = performance.now();
            const dt = Math.max(1, now - last.t);
            last = { x: e.clientX, y: e.clientY, t: now, vx: (e.clientX - last.x) / dt, vy: (e.clientY - last.y) / dt };
            const dx = e.clientX - press.x;
            const dy = e.clientY - press.y;
            // Le geste choisit son axe après quelques pixels : sur le côté il fait tourner la carte,
            // vers le haut il la soulève (pile du booster).
            if (!press.axis && Math.hypot(dx, dy) > 10) {
                press.axis = Math.abs(dx) > Math.abs(dy) ? "x" : onswipeup ? "y" : null;
                if (press.axis) dragging = true;
            }
            if (press.axis === "x") setDrag((dx / press.width) * 200);
            else if (press.axis === "y") setDrag(0, dy < 0 ? dy : dy * 0.25, dx * 0.04);
        }
        aim(e.clientX, e.clientY);
    }

    function onpointerup(e: PointerEvent) {
        if (tilt !== "full" || !press) return;
        const { axis, x, y, t, width, height } = press;
        press = null;
        dragging = false;

        if (axis === "x") {
            // La carte se pose sur la face la plus proche ; un glissé court mais vif la retourne
            // quand même. La vitesse n'ajoute jamais de tour : on retombe sur la face visée.
            const projected = drag + last.vx * 150 * (200 / width);
            let steps = Math.round(drag / 180);
            if (steps === 0 && Math.abs(projected) > 60) steps = Math.sign(projected);
            clearDrag();
            turn(Math.max(-2, Math.min(2, steps)));
        } else if (axis === "y") {
            const dy = e.clientY - y;
            if (dy < -height * 0.22 || (last.vy < -0.6 && dy < -20)) {
                flung = true;
                setDrag(0, -window.innerHeight, (e.clientX - x) * 0.08);
                setTimeout(() => onswipeup?.(), 260);
            } else {
                clearDrag();
            }
        } else if (Math.hypot(e.clientX - x, e.clientY - y) < 8 && performance.now() - t < 350) {
            if (ontap) ontap();
            else turn(1);
        }
        if (e.pointerType !== "mouse") release();
    }

    function onpointerleave(e: PointerEvent) {
        if (press && (e.pointerType !== "mouse" || press.axis)) return;
        press = null;
        release();
    }

    function oncancel() {
        press = null;
        dragging = false;
        clearDrag();
        release();
    }

    // ─── Gyroscope ───
    let base: { beta: number; gamma: number } | null = null;

    function onorientation(e: DeviceOrientationEvent) {
        if (e.beta === null || e.gamma === null || press) return;
        base ??= { beta: e.beta, gamma: e.gamma };
        const dx = Math.max(-1, Math.min(1, (e.gamma - base.gamma) / 30));
        const dy = Math.max(-1, Math.min(1, (e.beta - base.beta) / 30));
        target = { x: 0.5 + dx / 2, y: 0.5 + dy / 2, a: Math.min(1, 0.35 + Math.hypot(dx, dy)) };
        kick();
    }

    $effect(() => {
        if (!gyro || tilt !== "full") return;
        base = null;
        window.addEventListener("deviceorientation", onorientation);
        return () => window.removeEventListener("deviceorientation", onorientation);
    });

    onDestroy(() => {
        if (frame) cancelAnimationFrame(frame);
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    bind:this={scene}
    class="scene tilt-{tilt}"
    class:glow
    style="--accent: {face.accent}; --ink: {ink}; --rarity: var(--rarity-{card.rarity}); --wear: {wear}; {patterns}"
    role={label ? "img" : undefined}
    aria-label={label}
    {onpointerdown}
    {onpointermove}
    {onpointerup}
    {onpointerleave}
    onpointercancel={oncancel}
>
    <div bind:this={cardEl} class="card" class:dragging class:flung style="--spin: {angle}deg">
        <div class="face front frame-{face.frame} finish-{finish} r{card.rarity}" style={maskStyle(frontMask)}>
            <div class="art">
                {#if face.background}
                    <div class="layer framing" style={placement(face.background)}>
                        <img class="picture" class:sized={sized(face.background)} src={src(face.background)} alt="" style={imageStyle(face.background)} use:measure loading="lazy" decoding="async" />
                    </div>
                {:else}
                    <div class="layer backdrop backdrop-{face.backdrop}"></div>
                {/if}
                {#if finish === "reverse"}
                    <div class="shine under"></div>
                {/if}
                {#if face.art && !face.popout}
                    <div class="layer framing" style={placement(face.art)}>
                        <img class="picture subject" class:sized={sized(face.art)} src={src(face.art)} alt="" style={imageStyle(face.art)} use:measure loading="lazy" decoding="async" />
                    </div>
                {/if}
            </div>

            <div class="ring"></div>

            {#if face.art && face.popout}
                <div class="pop">
                    <div class="layer framing" style={placement(face.art)}>
                        <img class="picture subject" src={src(face.art)} alt="" style={face.art.fit === "contain" ? imageStyle(face.art) : "object-fit: cover;"} loading="lazy" decoding="async" />
                    </div>
                </div>
            {/if}

            <span class="type">
                <Icon src={CARD_TYPES[card.type].icon} color="currentColor" size="4.2cqw" />
                {CARD_TYPES[card.type].label}
            </span>

            {#if dragons.length}
                <span class="stamps">
                    {#each dragons as dragon (dragon)}
                        <span class="stamp"><Icon src="/icones/dragons/{dragon}.svg" color={dragonText(dragon)} size="5.4cqw" label={dragon} /></span>
                    {/each}
                </span>
            {/if}

            <div class="plate">
                <strong class="name" style:--len={Math.max(8, (card.name || "Sans nom").length)} use:fitName>{card.name || "Sans nom"}</strong>
                {#if face.subtitle}<span class="subtitle">{face.subtitle}</span>{/if}
            </div>

            {#if card.set}
                <span class="corner left">
                    {#if card.set.logo}<img src={card.set.logo} alt="" />{/if}
                    {card.set.code} {padNumber(card.number)}
                </span>
            {/if}
            <span class="corner right">
                <span class="gems" title={rarityLabel(card.rarity)}>
                    {#each Array.from({ length: card.rarity }) as _, i (i)}<i></i>{/each}
                </span>
                {formatSerial(copy?.serial, card.maxPrints)}
            </span>

            <WearMarks {wear} {seed} surface={!lite} />
            <div class="shine"></div>
            {#if finish === "eclat"}<div class="cracks"></div>{/if}
            <div class="glare"></div>
        </div>

        {#if !lite}
            <div class="face back-face" style={maskStyle(backMask)}>
                <CardBack {card} {copy} {wear} {seed} />
                <div class="glare"></div>
            </div>
        {/if}
    </div>
</div>

<style>
    /* ─── Scène et volume ─────────────────────────────────────────────── */

    .scene {
        --mx: 32;
        --my: 26;
        --active: 0;
        --rx: 0deg;
        --ry: 0deg;
        --hyp: 0.4;
        --radius: 4.6cqw;
        container-type: inline-size;
        width: 100%;
        aspect-ratio: 63 / 88;
        perspective: 900px;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
    }

    .tilt-full {
        touch-action: none;
        cursor: grab;
    }

    .card {
        --drag: 0deg;
        --lift: 0px;
        --lean: 0deg;
        position: relative;
        width: 100%;
        height: 100%;
        transform-style: preserve-3d;
        transform: translateY(var(--lift)) rotate(var(--lean)) rotateX(var(--rx))
            rotateY(calc(var(--spin) + var(--drag) + var(--ry)));
        /* Seuls le demi-tour et le retour du doigt sont animés (variables déclarées dans app.css) ;
           l'inclinaison, elle, est lissée image par image en JS. */
        transition:
            --spin 0.6s cubic-bezier(0.2, 0.8, 0.2, 1),
            --drag 0.6s cubic-bezier(0.2, 0.8, 0.2, 1),
            --lift 0.35s ease,
            --lean 0.35s ease;
        border-radius: var(--radius);
    }

    .card.dragging {
        transition: none;
    }

    .card.flung {
        transition:
            --lift 0.3s ease-in,
            --lean 0.3s ease-in;
    }

    .face {
        position: absolute;
        inset: 0;
        border-radius: var(--radius);
        overflow: hidden;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        transform: translateZ(0.1px);
        box-shadow:
            0 calc(1cqw + var(--active) * 3cqw) calc(3cqw + var(--active) * 6cqw) rgba(0, 0, 0, 0.55),
            0 0 0 0.25cqw rgba(255, 255, 255, 0.08);
        background: #111;
    }

    .back-face {
        transform: rotateY(180deg) translateZ(0.1px);
    }

    .glow .face {
        box-shadow:
            0 0 calc(4cqw + var(--active) * 6cqw) color-mix(in srgb, var(--rarity) 55%, transparent),
            0 calc(2cqw + var(--active) * 3cqw) calc(5cqw + var(--active) * 6cqw) rgba(0, 0, 0, 0.6);
    }

    /* ─── Illustration ────────────────────────────────────────────────── */

    .front {
        --b: 2.2cqw;
        --art-top: var(--b);
        --art-side: var(--b);
        --art-bottom: var(--b);
        --frame: var(--rarity);
    }

    .frame-plein {
        --b: 0px;
    }

    .frame-vintage {
        --b: 6cqw;
        --art-bottom: 21cqw;
        --frame: #f1ead7;
    }

    .art,
    .pop {
        position: absolute;
        top: var(--art-top);
        left: var(--art-side);
        right: var(--art-side);
        bottom: var(--art-bottom);
        border-radius: calc(var(--radius) - var(--b) * 0.6);
    }

    .art {
        overflow: hidden;
        background: #151515;
    }

    .frame-vintage .art,
    .frame-vintage .pop {
        border-radius: 2.4cqw;
    }

    .pop {
        z-index: 3;
        pointer-events: none;
    }

    .layer {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        -webkit-user-drag: none;
    }

    /* Boîte de cadrage : la zone de l'illustration, déplacée et zoomée d'un bloc. */
    .framing {
        container-type: size;
    }

    .picture {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        -webkit-user-drag: none;
        filter: saturate(calc(1 - var(--wear) * 0.45)) sepia(calc(var(--wear) * 0.3));
    }

    /* Couvre la zone sans être rognée : la plus petite taille qui la remplit, centrée. */
    .picture.sized {
        inset: auto;
        left: 50%;
        top: 50%;
        width: max(100cqw, calc(100cqh * var(--r)));
        height: max(100cqh, calc(100cqw / var(--r)));
        max-width: none;
        translate: -50% -50%;
    }

    .subject {
        filter: saturate(calc(1 - var(--wear) * 0.45)) sepia(calc(var(--wear) * 0.3))
            drop-shadow(0 1.5cqw 2cqw rgba(0, 0, 0, 0.45));
    }

    .backdrop {
        filter: saturate(calc(1 - var(--wear) * 0.4));
    }

    .backdrop-halo {
        background:
            radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--accent) 85%, #fff) 0%, transparent 55%),
            radial-gradient(circle at 50% 100%, color-mix(in srgb, var(--accent) 50%, #000) 0%, transparent 60%),
            color-mix(in srgb, var(--accent) 35%, #121212);
    }

    .backdrop-degrade {
        background: linear-gradient(
            160deg,
            color-mix(in srgb, var(--accent) 90%, #fff) 0%,
            var(--accent) 35%,
            color-mix(in srgb, var(--accent) 30%, #000) 100%
        );
    }

    .backdrop-fragments {
        background:
            conic-gradient(from 20deg at 30% 30%, rgba(255, 255, 255, 0.18) 0 40deg, transparent 40deg 110deg, rgba(0, 0, 0, 0.25) 110deg 170deg, transparent 170deg),
            conic-gradient(from 200deg at 72% 64%, rgba(255, 255, 255, 0.14) 0 50deg, transparent 50deg 140deg, rgba(0, 0, 0, 0.3) 140deg 220deg, transparent 220deg),
            conic-gradient(from 90deg at 45% 85%, rgba(255, 255, 255, 0.1) 0 70deg, transparent 70deg),
            linear-gradient(180deg, color-mix(in srgb, var(--accent) 70%, #fff), color-mix(in srgb, var(--accent) 40%, #000));
    }

    .backdrop-nuit {
        background:
            radial-gradient(1px 1px at 20% 30%, #fff, transparent),
            radial-gradient(1px 1px at 70% 20%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 40% 60%, #fff, transparent),
            radial-gradient(1px 1px at 85% 75%, #fff, transparent),
            radial-gradient(circle at 50% 120%, color-mix(in srgb, var(--accent) 60%, #000) 0%, transparent 60%),
            #0b0d18;
    }

    /* ─── Cadre ───────────────────────────────────────────────────────── */

    .ring {
        position: absolute;
        inset: 0;
        z-index: 2;
        border-radius: var(--radius);
        padding: var(--b);
        background: var(--frame);
        pointer-events: none;
        -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
        mask-composite: exclude;
    }

    .frame-vintage .ring {
        padding: var(--art-top) var(--art-side) var(--art-bottom);
    }

    /* Bordure claire en carton ; les finitions Or, Reverse et Éclat y posent leur propre fond. */
    .frame-vintage:not(.finish-or, .finish-reverse, .finish-eclat) .ring {
        background:
            repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.03) 0 0.6cqw, transparent 0.6cqw 1.2cqw),
            linear-gradient(var(--frame), color-mix(in srgb, var(--frame) 85%, var(--accent)));
    }

    .frame-plein .ring {
        display: none;
    }

    .type {
        position: absolute;
        z-index: 4;
        top: calc(var(--art-top) + 2cqw);
        left: calc(var(--art-side) + 2cqw);
        display: inline-flex;
        align-items: center;
        gap: 1.2cqw;
        padding: 0.8cqw 2.2cqw 0.8cqw 1.6cqw;
        border-radius: 5cqw;
        background: rgba(0, 0, 0, 0.55);
        color: #fff;
        font-size: 3cqw;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        backdrop-filter: blur(2px);
    }

    .stamps {
        position: absolute;
        z-index: 4;
        top: calc(var(--art-top) + 1.6cqw);
        right: calc(var(--art-side) + 1.6cqw);
        display: flex;
        flex-direction: column;
        gap: 1cqw;
    }

    .stamp {
        display: grid;
        place-items: center;
        width: 8cqw;
        height: 8cqw;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.55);
        box-shadow: 0 0 0 0.4cqw color-mix(in srgb, var(--frame) 70%, transparent);
    }

    /* Bandeau du nom : en biais façon carte de sport. */
    .plate {
        position: absolute;
        z-index: 4;
        left: -1cqw;
        right: 14cqw;
        bottom: calc(var(--art-bottom) + 6cqw);
        display: flex;
        flex-direction: column;
        padding: 1.6cqw 4cqw 1.6cqw 5cqw;
        background: linear-gradient(100deg, var(--accent) 70%, color-mix(in srgb, var(--accent) 70%, #000));
        color: var(--ink);
        transform: skewX(-12deg);
        transform-origin: left bottom;
        box-shadow:
            0 1cqw 2cqw rgba(0, 0, 0, 0.45),
            inset 0 -0.6cqw 0 var(--frame);
    }

    .plate > * {
        transform: skewX(12deg);
    }

    .name {
        font-family: var(--titleFont);
        /* Un nom long rapetisse pour tenir sur le bandeau (l'ellipse reste en dernier recours). */
        font-size: calc(min(7cqw, 118cqw / var(--len, 8)) * var(--fit, 1));
        font-weight: 700;
        line-height: 1.05;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .subtitle {
        font-size: 3.3cqw;
        line-height: 1.2;
        opacity: 0.9;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .frame-plein .plate {
        left: 0;
        right: 0;
        bottom: 0;
        padding: 14cqw 5cqw 7cqw;
        transform: none;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.82) 55%);
        color: #fff;
        box-shadow: none;
    }

    .frame-plein .plate > * {
        transform: none;
    }

    .frame-plein .name {
        color: color-mix(in srgb, var(--accent) 40%, #fff);
        font-size: calc(min(8cqw, 136cqw / var(--len, 8)) * var(--fit, 1));
    }

    .frame-vintage .plate {
        left: var(--art-side);
        right: var(--art-side);
        bottom: 6.5cqw;
        padding: 0.4cqw 3cqw;
        transform: none;
        background: none;
        box-shadow: none;
        color: #2b2620;
        text-align: center;
        align-items: center;
    }

    .frame-vintage .plate > * {
        transform: none;
    }

    .frame-vintage .name {
        font-size: calc(min(7cqw, 124cqw / var(--len, 8)) * var(--fit, 1));
        color: color-mix(in srgb, var(--accent) 50%, #2b2620);
        max-width: 100%;
    }

    .corner {
        position: absolute;
        z-index: 4;
        bottom: calc(var(--art-bottom) + 1.4cqw);
        display: inline-flex;
        align-items: center;
        gap: 1cqw;
        padding: 0.4cqw 1.6cqw;
        border-radius: 2cqw;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        font-size: 2.6cqw;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.05em;
    }

    .corner.left {
        left: calc(var(--art-side) + 1.6cqw);
    }

    .corner.right {
        right: calc(var(--art-side) + 1.6cqw);
    }

    .corner img {
        width: 3.6cqw;
        height: 3.6cqw;
        object-fit: contain;
    }

    .frame-vintage .corner {
        bottom: 1.6cqw;
        background: none;
        color: #2b2620;
    }

    .frame-plein .corner {
        bottom: 1.6cqw;
        background: none;
    }

    .gems {
        display: inline-flex;
        gap: 0.6cqw;
    }

    .gems i {
        width: 1.7cqw;
        height: 1.7cqw;
        transform: rotate(45deg);
        background: var(--rarity);
        box-shadow: 0 0 1cqw var(--rarity);
    }

    /* ─── Reflets ─────────────────────────────────────────────────────── */

    .shine,
    .glare,
    .cracks {
        position: absolute;
        inset: 0;
        z-index: 9;
        pointer-events: none;
        border-radius: inherit;
    }

    .shine.under {
        z-index: auto;
    }

    /* Lumière qui suit le doigt, commune à toutes les finitions. */
    .glare {
        z-index: 10;
        background: radial-gradient(
            farthest-corner circle at calc(var(--mx) * 1%) calc(var(--my) * 1%),
            rgba(255, 255, 255, 0.7) 0%,
            rgba(255, 255, 255, 0.18) 22%,
            rgba(0, 0, 0, 0.35) 95%
        );
        mix-blend-mode: overlay;
        opacity: calc(0.15 + var(--active) * 0.55);
    }

    .finish-mate .glare {
        opacity: calc(0.05 + var(--active) * 0.25);
    }

    .finish-mate .shine {
        display: none;
    }

    /* Brillante : une bande de lumière blanche. */
    .finish-brillante .shine {
        background: linear-gradient(
            115deg,
            transparent 25%,
            rgba(255, 255, 255, 0.55) 47%,
            rgba(255, 255, 255, 0.7) 50%,
            rgba(255, 255, 255, 0.55) 53%,
            transparent 75%
        );
        background-size: 260% 260%;
        background-position: calc(var(--mx) * 1%) calc(var(--my) * 1%);
        mix-blend-mode: soft-light;
        opacity: calc(0.35 + var(--active) * 0.65);
    }

    /* Holo et Reverse : arc-en-ciel strié qui glisse avec l'inclinaison. */
    .finish-holo .shine,
    .finish-reverse .shine,
    .finish-prisme .shine {
        background-image:
            repeating-linear-gradient(
                0deg,
                #ff6b6b 0%,
                #ffd84d 7%,
                #6bff8a 14%,
                #4de8ff 21%,
                #6b7bff 28%,
                #d86bff 35%,
                #ff6b6b 42%
            ),
            repeating-linear-gradient(
                125deg,
                #252a45 0%,
                #8b9a9a 2.6%,
                #c9e9e9 3.2%,
                #8b9a9a 3.8%,
                #252a45 7%,
                #252a45 9%
            );
        background-size:
            100% 250%,
            300% 100%;
        background-position:
            0% calc(var(--my) * 1%),
            calc(var(--mx) * 1%) 50%;
        background-blend-mode: hard-light;
        mix-blend-mode: color-dodge;
        filter: brightness(0.85) contrast(1.35) saturate(1.3);
        opacity: calc(0.15 + var(--active) * 0.35);
    }

    /* Reverse : l'arc-en-ciel passe derrière le sujet, et sur le cadre ; pas sur le sujet. */
    .finish-reverse > .shine:not(.under) {
        display: none;
    }

    .finish-reverse .shine.under {
        opacity: calc(0.35 + var(--active) * 0.55);
    }

    .finish-reverse .ring {
        background: linear-gradient(
            calc(90deg + var(--mx) * 1.8deg),
            #ff9a9a,
            #ffe9a0,
            #a8ffb0,
            #a0eeff,
            #b0a8ff,
            #ffa8e8,
            #ff9a9a
        );
        background-size: 200% 200%;
        background-position: calc(var(--mx) * 1%) calc(var(--my) * 1%);
    }

    /* Or : cadre en feuille d'or et reflet chaud. */
    .finish-or {
        --frame: linear-gradient(
            calc(110deg + var(--mx) * 0.6deg),
            #6e4f16 0%,
            #e9cd7c 18%,
            #a97b28 34%,
            #fff3c4 50%,
            #a1752a 66%,
            #f0d88f 82%,
            #6a4a12 100%
        );
    }

    .finish-or .ring,
    .finish-or .plate {
        background-size: 200% 200%;
        background-position: calc(var(--mx) * 1%) 50%;
    }

    .finish-or .plate {
        background-image: var(--frame);
        color: #2b1d05;
        box-shadow:
            0 1cqw 2cqw rgba(0, 0, 0, 0.45),
            inset 0 -0.6cqw 0 rgba(0, 0, 0, 0.25);
    }

    .finish-or .gems i,
    .finish-or .stamp {
        box-shadow: 0 0 0 0.4cqw #e9cd7c;
    }

    .finish-or .shine {
        background: linear-gradient(
            115deg,
            transparent 20%,
            rgba(255, 214, 130, 0.5) 42%,
            rgba(255, 248, 220, 0.9) 50%,
            rgba(255, 205, 110, 0.5) 58%,
            transparent 80%
        );
        background-size: 250% 250%;
        background-position: calc(var(--mx) * 1%) calc(var(--my) * 1%);
        mix-blend-mode: overlay;
        opacity: calc(0.3 + var(--active) * 0.7);
    }

    /* Prisme : paillettes qui laissent passer l'arc-en-ciel. */
    .finish-prisme .shine {
        -webkit-mask-image: var(--glitter);
        mask-image: var(--glitter);
        -webkit-mask-size: 100% 100%;
        mask-size: 100% 100%;
        filter: brightness(1.3) contrast(1.4) saturate(1.6);
        opacity: calc(0.55 + var(--active) * 0.45);
    }

    .finish-prisme .glare {
        background:
            radial-gradient(
                farthest-corner circle at calc(var(--mx) * 1%) calc(var(--my) * 1%),
                rgba(255, 255, 255, 0.75) 0%,
                rgba(255, 255, 255, 0.15) 25%,
                rgba(0, 0, 0, 0.3) 95%
            ),
            linear-gradient(calc(var(--mx) * 3.6deg), rgba(255, 0, 128, 0.12), rgba(0, 200, 255, 0.12));
    }

    /* Éclat : verre étoilé, chaque morceau s'allume à son tour. */
    .finish-eclat .shine {
        background: linear-gradient(
            calc(100deg + var(--my) * 0.8deg),
            transparent 0%,
            rgba(255, 140, 200, 0.85) calc(var(--mx) * 1% - 22%),
            rgba(255, 255, 255, 0.95) calc(var(--mx) * 1%),
            rgba(130, 220, 255, 0.85) calc(var(--mx) * 1% + 22%),
            transparent 100%
        );
        -webkit-mask-image: var(--shards);
        mask-image: var(--shards);
        -webkit-mask-size: 100% 100%;
        mask-size: 100% 100%;
        mix-blend-mode: color-dodge;
        opacity: calc(0.35 + var(--active) * 0.6);
    }

    .cracks {
        background-image: var(--cracks);
        background-size: 100% 100%;
        mix-blend-mode: overlay;
        opacity: calc(0.45 + var(--active) * 0.4);
    }

    .finish-eclat .ring {
        background: linear-gradient(
            calc(140deg + var(--mx) * 1deg),
            #f2d4e6,
            #ffffff 30%,
            #c9e9f7 55%,
            #e5b8cc 80%,
            #ffffff
        );
    }

    @media (prefers-reduced-motion: reduce) {
        .card {
            transition: none;
        }
    }
</style>
