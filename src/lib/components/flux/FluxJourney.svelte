<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import * as THREE from "three";
    import { gendered, type Address } from "$lib/flux/address";
    import { LETTER_NAMES, leadingDragon } from "$lib/flux/quiz";
    import { QUESTIONS } from "$lib/flux/quiz-data";
    import { secretComplete, secretTitle } from "$lib/flux/secret";

    // Le test de flux, plein écran. Au loin brille le noyau du flux, étoile aux deux ailes de
    // lumière. Pour chaque question : la question apparaît seule au centre, puis monte, et les
    // réponses flottent autour du noyau. La réponse choisie rejoint le bout d'un chemin de lumière,
    // qui s'allonge d'un pas vers l'étoile ; on avance le long du chemin. À la dernière réponse,
    // le chemin atteint l'étoile, et on entre dedans.
    //
    // La 3D reste peu coûteuse : un champ d'étoiles (points + traînées), le noyau (un plan), ses
    // ailes (une texture dessinée une fois) et le chemin (un ruban, recalculé une fois par
    // réponse). Pas de post-traitement, aucun état Svelte touché pendant le rendu.
    let {
        color,
        address = "il",
        favored = [],
        secret = false,
        onFinish,
        onSecret,
        onTitle,
    }: {
        color: string;
        /** Accord des questions et des réponses (« allongé » / « allongée »…), voir address.ts. */
        address?: Address;
        /** Dragons favorisés par la race (voir races.ts) : ils comptent pour la couleur des ailes. */
        favored?: readonly string[];
        /** Secret éveillé (arrivée par l'accueil, bonne porte) : voir secret.ts. */
        secret?: boolean;
        onFinish: (answers: number[]) => void;
        /** Le chemin secret vient d'être suivi jusqu'au bout (réponses données). */
        onSecret?: (answers: number[]) => void;
        /** Titre de l'onglet le temps d'un survol (le secret), undefined pour le titre normal. */
        onTitle?: (title: string | undefined) => void;
    } = $props();

    // Durées des étapes d'une question (ms). La question suivante naît pendant que la plongée
    // ralentit (WARP_NEXT) : les étapes se chevauchent pour garder le rythme sur toutes les questions.
    const QUESTION_MS = 650;
    const ABSORB_MS = 380;
    const WARP_MS = 1000;
    const WARP_NEXT = 0.55;

    type Phase = "question" | "answers" | "leaving" | "warp" | "ending";
    let index = $state(0);
    let phase = $state<Phase>("question");
    let chosen = $state<number | null>(null);
    let pull = $state({ x: 0, y: 0 });
    let flash = $state(false);
    // Hauteur de la question : les réponses commencent juste en dessous.
    let questionHeight = $state(0);
    let answers: number[] = [];
    let answered = $state(0);
    // Segment de la barre qui vient de s'allumer.
    let lit = $state(-1);

    let question = $derived(QUESTIONS[index]);
    // Les réponses se partagent les deux côtés du noyau.
    let split = $derived(Math.ceil(question.answers.length / 2));
    let showAnswers = $derived(phase === "answers" || phase === "leaving");

    let canvas: HTMLCanvasElement;
    let reduced = false;

    // Branché par la scène 3D si WebGL est disponible.
    let scene3d: {
        focus(x: number, y: number): void;
        unfocus(): void;
        absorb(): void;
        warp(ms: number, last: boolean): Promise<void>;
        progress(p: number): void;
        /** Position du noyau à l'écran, en pixels. */
        star(): { x: number; y: number };
        /** Bout du chemin de lumière à l'écran, en pixels. */
        head(): { x: number; y: number };
        /** Écran étroit : hauteur (px) de la bande réservée au noyau, sous la question. */
        anchor(y: number): void;
        /** Couleur de l'ange, son Œil et ses ailes (CSS) ; blanc pour null. */
        wing(color: string | null): void;
        /** Dragons de la réponse choisie : ils apparaissent parmi les étoiles, sur le vol qui suit. */
        dragons(names: string[], last: boolean): void;
    } | null = null;

    // Couleur d'un dragon (variables du site). Shizari a celle du fond : éclairci pour se lire.
    const dragonColor = (name: string) =>
        name === "Shizari" ? "#bdbdbd" : getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim() || "#ffffff";

    // L'ange prend la couleur du dragon en tête des réponses ; blanc à égalité (et au départ).
    function wingColor() {
        const leader = leadingDragon(answers, favored);
        return leader ? dragonColor(leader) : null;
    }

    // Écran étroit : les réponses occupent toute la largeur. Le noyau a sa bande à lui, entre la
    // question et les réponses (BAND, part de la hauteur de l'écran), pour rester visible.
    const BAND = 0.2;
    $effect(() => {
        // Lu avant tout : l'effet doit se relancer à chaque nouvelle question, scène prête ou non.
        const qh = questionHeight;
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        // Même calcul que le haut de .orbit en CSS (écran étroit), plus la moitié de la bande.
        scene3d?.anchor(rem * 3.6 + qh + 0.5 * BAND * innerHeight);
    });

    const wait = (ms: number) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 150) : ms));

    async function present() {
        phase = "question";
        await wait(QUESTION_MS);
        phase = "answers";
    }

    async function choose(k: number, el: HTMLElement) {
        if (phase !== "answers") return;
        answers.push(k);
        const letters = question.answers[k].letters;
        const r = el.getBoundingClientRect();
        // La réponse rejoint le bout du chemin, qui va s'allonger vers l'étoile.
        const target = scene3d?.head() ?? { x: innerWidth / 2, y: innerHeight / 2 };
        pull = { x: target.x - (r.left + r.width / 2), y: target.y - (r.top + r.height / 2) };
        chosen = k;
        phase = "leaving";
        onTitle?.(undefined);
        scene3d?.unfocus();
        scene3d?.absorb();
        await wait(ABSORB_MS);

        // La réponse a rejoint le chemin : l'ange se teinte.
        scene3d?.wing(wingColor());

        // Le flux grandit : un segment de plus s'allume, le noyau et le ciel se densifient.
        lit = answered;
        answered++;
        scene3d?.progress(answered / QUESTIONS.length);

        // Chemin secret suivi jusqu'au bout : on plonge dans le noyau sans finir le test.
        const found = secret && !!onSecret && secretComplete(answers);
        const last = found || index + 1 >= QUESTIONS.length;
        phase = last ? "ending" : "warp";
        // Les dragons de ses lettres attendaient parmi les étoiles : on les croise pendant le vol.
        if (!reduced) scene3d?.dragons([...letters].map((l) => LETTER_NAMES[l]).filter(Boolean), last);
        // Mouvement réduit : le chemin s'allonge quand même, sans vol (warp instantané).
        if (last) {
            if (scene3d) await scene3d.warp(reduced ? 1 : WARP_MS * 1.6, true);
            else await wait(300);
            flash = true;
            await wait(800);
            if (found) onSecret!(answers);
            else onFinish(answers);
            return;
        }
        if (scene3d) {
            scene3d.warp(reduced ? 1 : WARP_MS, false);
            await wait(WARP_MS * WARP_NEXT);
        } else await wait(250);
        chosen = null;
        index++;
        present();
    }

    function hover(el: HTMLElement | null) {
        if (phase !== "answers") return;
        // Secret : survoler la bonne réponse de l'étape change le titre de l'onglet.
        if (secret) onTitle?.(el ? secretTitle(answers, index, Number(el.dataset.k)) : undefined);
        if (!scene3d) return;
        if (!el) return scene3d.unfocus();
        const r = el.getBoundingClientRect();
        scene3d.focus(r.left + r.width / 2, r.top + r.height / 2);
    }

    // Écran étroit : les réponses défilent quand elles ne tiennent pas toutes (souvent la dernière
    // question, et ses six réponses). Tant qu'il en reste sous le bord, un signe le dit.
    let orbitEl = $state<HTMLElement | null>(null);
    let moreBelow = $state(false);

    function watchOverflow(node: HTMLElement) {
        orbitEl = node;
        const update = () => {
            const scrolls = getComputedStyle(node).overflowY !== "visible";
            moreBelow = scrolls && node.scrollHeight - node.scrollTop - node.clientHeight > 12;
        };
        const resize = new ResizeObserver(update);
        resize.observe(node);
        for (const child of node.children) resize.observe(child);
        node.addEventListener("scroll", update, { passive: true });
        update();
        return {
            destroy() {
                resize.disconnect();
                node.removeEventListener("scroll", update);
                if (orbitEl === node) orbitEl = null;
                moreBelow = false;
            },
        };
    }

    // Toucher le signe fait défiler jusqu'aux réponses suivantes.
    function scrollMore() {
        orbitEl?.scrollBy({ top: orbitEl.clientHeight * 0.6, behavior: reduced ? "auto" : "smooth" });
    }

    // Raccourcis : 1 à 6 pour répondre.
    function onKey(e: KeyboardEvent) {
        const k = Number(e.key) - 1;
        if (phase !== "answers" || !(k >= 0 && k < question.answers.length)) return;
        const el = document.querySelector<HTMLElement>(`.journey [data-k="${k}"]`);
        if (el) choose(k, el);
    }


    // Le symbole d'un dragon en lumière blanche (la couleur vient du shader), avec un halo : il
    // brille comme les étoiles. Large marge tout autour : le flou de vitesse s'y étale.
    function drawSigil(img: HTMLImageElement) {
        const S = 256;
        const PAD = 56;
        const shape = document.createElement("canvas");
        shape.width = shape.height = S;
        const g = shape.getContext("2d")!;
        // Sans taille propre, le SVG garde ses proportions dans le carré (sa viewBox, centrée).
        g.drawImage(img, PAD, PAD, S - 2 * PAD, S - 2 * PAD);
        g.globalCompositeOperation = "source-in";
        g.fillStyle = "#fff";
        g.fillRect(0, 0, S, S);
        const out = document.createElement("canvas");
        out.width = out.height = S;
        const h = out.getContext("2d")!;
        h.filter = "blur(12px)";
        h.drawImage(shape, 0, 0);
        h.filter = "none";
        h.globalCompositeOperation = "lighter";
        h.drawImage(shape, 0, 0);
        return out;
    }

    // Une aile droite, plume par plume, en lumière blanche (la couleur vient du shader). L'épaule
    // est à gauche (6 %, 60 % de la hauteur) ; le bras monte vers le poignet, d'où partent les
    // grandes plumes ; les autres pendent le long du bras. Les plumes s'additionnent : l'aile est
    // vive près du bras et s'efface vers ses pointes.
    function drawWing() {
        const S = 1024;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = S;
        const g = canvas.getContext("2d")!;
        g.globalCompositeOperation = "lighter";
        g.lineCap = "round";
        const shoulder = { x: 0.06 * S, y: 0.6 * S };
        const elbow = { x: 0.34 * S, y: 0.2 * S };
        const wrist = { x: 0.62 * S, y: 0.14 * S };
        const bone = (t: number) => ({
            x: (1 - t) * (1 - t) * shoulder.x + 2 * (1 - t) * t * elbow.x + t * t * wrist.x,
            y: (1 - t) * (1 - t) * shoulder.y + 2 * (1 - t) * t * elbow.y + t * t * wrist.y,
        });
        const white = (a: number) => `rgba(255, 255, 255, ${a.toFixed(3)})`;

        function feather(t: number, angle: number, len: number, alpha: number) {
            const r = bone(t);
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            // Plume légèrement courbée vers l'arrière de l'aile.
            const bend = len * 0.07;
            const w = len * 0.12;
            const mx = r.x + dx * len * 0.55 - dy * bend;
            const my = r.y + dy * len * 0.55 + dx * bend;
            const tx = r.x + dx * len;
            const ty = r.y + dy * len;
            const fill = g.createLinearGradient(r.x, r.y, tx, ty);
            fill.addColorStop(0, white(alpha));
            fill.addColorStop(0.6, white(alpha * 0.55));
            fill.addColorStop(1, white(0));
            g.beginPath();
            g.moveTo(r.x - dy * w * 0.25, r.y + dx * w * 0.25);
            g.quadraticCurveTo(mx - dy * w, my + dx * w, tx, ty);
            g.quadraticCurveTo(mx + dy * w, my - dx * w, r.x + dy * w * 0.25, r.y - dx * w * 0.25);
            g.closePath();
            g.fillStyle = fill;
            g.fill();
            // Bord et tige, plus lumineux que la plume elle-même.
            const edge = g.createLinearGradient(r.x, r.y, tx, ty);
            edge.addColorStop(0, white(alpha * 1.6));
            edge.addColorStop(1, white(0));
            g.strokeStyle = edge;
            g.lineWidth = 1.5;
            g.stroke();
            g.beginPath();
            g.moveTo(r.x, r.y);
            g.quadraticCurveTo(mx, my, r.x + dx * len * 0.92 - dy * bend * 0.4, r.y + dy * len * 0.92 + dx * bend * 0.4);
            g.lineWidth = 2.2;
            g.stroke();
        }

        // Grandes plumes, au poignet : elles s'ouvrent en éventail et forment la pointe, relevée.
        for (let i = 0; i < 8; i++) {
            const u = i / 7;
            feather(0.84 + 0.16 * u, 0.5 - 1.05 * u, S * (0.36 - 0.12 * u * u), 0.2);
        }
        // Plumes du bras : elles pendent, de plus en plus inclinées vers le poignet.
        for (let i = 0; i < 14; i++) {
            const u = i / 13;
            feather(0.06 + 0.8 * u, 1.45 - 0.85 * Math.pow(u, 1.2), S * (0.3 + 0.07 * u), 0.17);
        }
        // Couvertures : deux rangs plus courts, plus serrés, contre le bras.
        for (let i = 0; i < 16; i++) {
            const u = i / 15;
            feather(0.04 + 0.92 * u, 1.3 - 0.95 * u, S * 0.16, 0.16);
        }
        for (let i = 0; i < 20; i++) {
            const u = i / 19;
            feather(0.02 + 0.96 * u, 1.15 - 0.9 * u, S * 0.075, 0.18);
        }
        // Le bras de l'aile, son bord d'attaque, d'un trait vif.
        g.beginPath();
        g.moveTo(shoulder.x, shoulder.y);
        g.quadraticCurveTo(elbow.x, elbow.y, wrist.x, wrist.y);
        g.strokeStyle = white(0.7);
        g.lineWidth = 4;
        g.shadowColor = white(1);
        g.shadowBlur = 14;
        g.stroke();
        g.shadowBlur = 0;

        // Halo : l'aile, floutée, ajoutée à elle-même.
        const glow = document.createElement("canvas");
        glow.width = glow.height = S;
        const h = glow.getContext("2d")!;
        h.filter = "blur(10px)";
        h.drawImage(canvas, 0, 0);
        h.filter = "none";
        h.globalCompositeOperation = "lighter";
        h.drawImage(canvas, 0, 0);
        return glow;
    }

    onMount(() => {
        reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        present();
        const dispose = startScene();
        return () => dispose?.();
    });

    function startScene() {
        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
        } catch {
            return;
        }
        let pixelRatio = Math.min(window.devicePixelRatio, 1.5);
        renderer.setPixelRatio(pixelRatio);
        renderer.setClearColor(0x000000, 0);

        const tint = new THREE.Color(color);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 200);
        const FOV = 60;
        // Distance du noyau : très loin au départ, à NEAR_D une fois toutes les réponses données.
        // Elle diminue d'un même facteur à chaque réponse : le noyau grossit de façon régulière.
        const FAR_D = 80;
        const NEAR_D = 10;
        const distAt = (p: number) => FAR_D * Math.pow(NEAR_D / FAR_D, p);
        // Le plan du noyau est plus grand que le noyau : son halo et son rayon débordent.
        const HALO = 3;

        // ---- Champ d'étoiles : un tube autour de l'axe de vol, qui défile vers la caméra.
        const STARS = reduced ? 600 : 1600;
        const DEPTH = 120;
        const starData = new Float32Array(STARS * 4);
        for (let i = 0; i < STARS; i++) {
            starData[i * 4] = Math.random() * Math.PI * 2;
            // Jamais trop près de l'axe : une étoile qui frôle l'objectif couvrirait l'écran.
            starData[i * 4 + 1] = 1.8 + Math.pow(Math.random(), 0.7) * 16;
            starData[i * 4 + 2] = Math.random() * DEPTH;
            starData[i * 4 + 3] = Math.random();
        }

        // Avancée dans le test, de 0 à 1 : plus d'étoiles, un noyau plus grand et plus vif.
        let charge = 0;
        let chargeShown = 0;

        const uniforms = {
            uTravel: { value: 0 },
            uTime: { value: 0 },
            uStretch: { value: 0 },
            uStreak: { value: 0 },
            uPixel: { value: pixelRatio },
            uColor: { value: tint },
        };

        const starVertex = /* glsl */ `
            uniform float uTravel, uTime, uStretch, uPixel;
            attribute vec4 aStar;
            attribute float aTail;
            varying float vAlpha;
            varying float vWhite;
            const float DEPTH = ${DEPTH.toFixed(1)};
            void main() {
                float angle = aStar.x + uTime * (0.015 + aStar.w * 0.02);
                float z = -DEPTH + mod(aStar.z + uTravel, DEPTH);
                z -= aTail * uStretch * (0.4 + aStar.w);
                vec4 mv = modelViewMatrix * vec4(cos(angle) * aStar.y, sin(angle) * aStar.y, z, 1.0);
                gl_Position = projectionMatrix * mv;
                gl_PointSize = clamp((0.5 + aStar.w) * 40.0 / -mv.z, 1.0, 5.0) * uPixel;
                vAlpha = smoothstep(-DEPTH, -DEPTH * 0.55, z) * smoothstep(0.0, -4.0, z);
                vWhite = aStar.w;
            }
        `;
        const starMaterial = (fragment: string, extra: Record<string, { value: unknown }> = {}) =>
            new THREE.ShaderMaterial({
                uniforms: { ...uniforms, ...extra },
                vertexShader: starVertex,
                fragmentShader: fragment,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });

        const pointsGeometry = new THREE.BufferGeometry();
        pointsGeometry.setAttribute("aStar", new THREE.BufferAttribute(starData, 4));
        pointsGeometry.setAttribute("aTail", new THREE.BufferAttribute(new Float32Array(STARS), 1));
        // Positions calculées dans le shader : la sphère englobante serait fausse.
        pointsGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
        pointsGeometry.setDrawRange(0, Math.round(STARS * 0.3));
        const pointsMaterial = starMaterial(/* glsl */ `
            uniform vec3 uColor;
            varying float vAlpha;
            varying float vWhite;
            void main() {
                float d = length(gl_PointCoord - 0.5);
                float a = smoothstep(0.5, 0.0, d) * vAlpha;
                gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.35 + vWhite * 0.5) * a, a);
            }
        `);
        const points = new THREE.Points(pointsGeometry, pointsMaterial);
        points.frustumCulled = false;

        // Traînées : les mêmes étoiles en segments, visibles seulement pendant la plongée.
        const lineData = new Float32Array(STARS * 8);
        const tails = new Float32Array(STARS * 2);
        for (let i = 0; i < STARS; i++) {
            for (let j = 0; j < 4; j++) {
                lineData[i * 8 + j] = starData[i * 4 + j];
                lineData[i * 8 + 4 + j] = starData[i * 4 + j];
            }
            tails[i * 2 + 1] = 1;
        }
        const linesGeometry = new THREE.BufferGeometry();
        linesGeometry.setAttribute("aStar", new THREE.BufferAttribute(lineData, 4));
        linesGeometry.setAttribute("aTail", new THREE.BufferAttribute(tails, 1));
        linesGeometry.setDrawRange(0, Math.round(STARS * 0.3) * 2);
        const linesMaterial = starMaterial(/* glsl */ `
            uniform vec3 uColor;
            uniform float uStreak;
            varying float vAlpha;
            varying float vWhite;
            void main() {
                float a = vAlpha * uStreak;
                gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.2 + vWhite * 0.4) * a, a);
            }
        `);
        const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
        lines.frustumCulled = false;
        lines.visible = false;
        scene.add(points, lines);

        // Couleur vive : la lumière s'additionne, une teinte sombre (Goliath, Drii) paraîtrait terne.
        // Les couleurs franches passent à pleine lumière ; les gris (Aqua, Shizari) restent argentés.
        const vivid = (target: THREE.Color, css: string) => {
            target.set(css);
            const max = Math.max(target.r, target.g, target.b);
            const min = Math.min(target.r, target.g, target.b);
            if (max > 0 && max - min > 0.15) target.multiplyScalar(1 / max);
            return target;
        };

        // ---- Dragons parmi les étoiles. Ceux des lettres de la réponse choisie attendaient au loin :
        // ils s'allument doucement, de la lumière des étoiles, filent vers nous avec elles, s'étirent
        // un peu avec la vitesse, et
        // s'effacent une fois dépassés. Un plan par dragon (12 au plus à la fois, réutilisés), une
        // texture par symbole, dessinée une fois.
        let disposed = false;
        const dragonMaps = new Map<string, THREE.Texture>();
        for (const name of new Set(Object.values(LETTER_NAMES))) {
            const img = new Image();
            img.src = `/icones/dragons/${name}.svg`;
            img.decode()
                .then(() => {
                    if (!disposed) dragonMaps.set(name, new THREE.CanvasTexture(drawSigil(img)));
                })
                .catch(() => {});
        }
        const SIGIL = 1.5;
        const sigilGeometry = new THREE.PlaneGeometry(SIGIL, SIGIL);
        const sigilVertex = /* glsl */ `
            uniform float uPop, uStretch;
            uniform vec2 uDir;
            varying vec2 vUv;
            void main() {
                vUv = uv;
                // Il éclot (de 55 % à sa taille), puis la vitesse l'étire un peu vers le bord de
                // l'écran, où il file ; sa traînée reste en arrière, vers le centre d'où il vient.
                vec2 p = position.xy * (0.55 + 0.45 * uPop);
                p += uDir * (dot(p, uDir) * uStretch * 0.45 - uStretch * ${(SIGIL * 0.12).toFixed(2)});
                gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0.0, 1.0);
            }
        `;
        const sigilFragment = /* glsl */ `
            uniform sampler2D uMap;
            uniform vec3 uColor;
            uniform float uAlpha, uStretch;
            uniform vec2 uDir;
            varying vec2 vUv;
            void main() {
                // Léger flou de vitesse : la silhouette répétée le long de sa course.
                float a = 0.0;
                for (int i = 0; i < 6; i++) a += texture2D(uMap, vUv + uDir * (float(i) / 5.0) * uStretch * 0.06).a;
                a = a / 6.0 * uAlpha;
                // La lumière des étoiles : la couleur du peuple, mêlée de blanc. Mélange additif : la
                // couleur est déjà multipliée par l'alpha au rendu.
                gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.55), a);
            }
        `;
        type Sigil = {
            mesh: THREE.Mesh;
            material: THREE.ShaderMaterial;
            u: { uMap: { value: THREE.Texture | null }; uColor: { value: THREE.Color }; uAlpha: { value: number }; uPop: { value: number }; uStretch: { value: number }; uDir: { value: THREE.Vector2 } };
            /** Place autour de l'axe de vol, et profondeur devant la caméra (négative). */
            x: number;
            y: number;
            z: number;
            born: number;
            active: boolean;
            /** Plus forte vitesse du vol croisée, et effacement une fois le vol retombé (0 → 1). */
            peak: number;
            gone: number;
        };
        const sigils: Sigil[] = Array.from({ length: 12 }, () => {
            const u = {
                uMap: { value: null as THREE.Texture | null },
                // La couleur des étoiles (celle du peuple), partagée.
                uColor: uniforms.uColor,
                uAlpha: { value: 0 },
                uPop: { value: 0 },
                uStretch: { value: 0 },
                uDir: { value: new THREE.Vector2(1, 0) },
            };
            const material = new THREE.ShaderMaterial({
                uniforms: u,
                vertexShader: sigilVertex,
                fragmentShader: sigilFragment,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
            });
            const mesh = new THREE.Mesh(sigilGeometry, material);
            mesh.visible = false;
            mesh.frustumCulled = false;
            scene.add(mesh);
            return { mesh, material, u, x: 0, y: 0, z: 0, born: 0, active: false, peak: 0, gone: 0 };
        });

        // ---- Noyau de flux : un anneau de bruit qui respire, un cœur, et un rayon vers la réponse visée.
        // L'ange (cet Œil et ses ailes) a sa propre couleur : celle du dragon en tête des réponses,
        // blanche à égalité (et au départ). Elle y glisse doucement (angelTarget, suivie dans la
        // boucle de rendu) ; le ciel et le chemin gardent la couleur du peuple.
        const angelTint = { value: new THREE.Color(1, 1, 1) };
        const angelTarget = new THREE.Color(1, 1, 1);
        const coreUniforms = {
            uTime: uniforms.uTime,
            uColor: angelTint,
            uFlare: { value: 0 },
            uFocus: { value: new THREE.Vector2(0, 1) },
            uFocusAmt: { value: 0 },
            uFade: { value: 0 },
            uCharge: { value: 0 },
            // 1 au plus loin, 0 tout près : de loin, le noyau brille et scintille comme une étoile.
            uFar: { value: 1 },
        };
        const coreMaterial = new THREE.ShaderMaterial({
            uniforms: coreUniforms,
            vertexShader: /* glsl */ `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: /* glsl */ `
                uniform float uTime, uFlare, uFocusAmt, uFade, uCharge, uFar;
                uniform vec2 uFocus;
                uniform vec3 uColor;
                varying vec2 vUv;
                float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
                float noise(vec2 p) {
                    vec2 i = floor(p), f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
                }
                float fbm(vec2 p) {
                    float v = 0.0, a = 0.5;
                    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 7.1; a *= 0.5; }
                    return v;
                }
                void main() {
                    vec2 p = (vUv * 2.0 - 1.0) * ${HALO.toFixed(1)};
                    float r = length(p);
                    vec2 dir = p / max(r, 1e-4);
                    // Halo : de loin, le noyau brille comme une étoile.
                    float halo = exp(-r * 2.4) * (0.35 + uCharge * 0.25 + uFar * 0.5) * smoothstep(${HALO.toFixed(1)}, 1.2, r);
                    // Aigrettes d'étoile, qui s'effacent à l'approche.
                    float twinkle = 0.8 + 0.2 * sin(uTime * 3.1) * sin(uTime * 1.7);
                    float spikes = (exp(-abs(p.y) * 40.0) + exp(-abs(p.x) * 40.0)) * exp(-r * 1.1) * uFar * twinkle;
                    halo += spikes * smoothstep(${HALO.toFixed(1)}, 0.5, r);
                    float da = 1.0 - dot(dir, uFocus);
                    float ray = exp(-da * 60.0) * smoothstep(${HALO.toFixed(1)}, 0.4, r) * smoothstep(0.12, 0.38, r) * uFocusAmt;
                    if (r > 1.0) {
                        float o = (halo + ray * 0.6) * (1.0 - uFade);
                        gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.3) * o, min(o, 1.0));
                        return;
                    }
                    float t = uTime;
                    // Anneau déformé par le bruit, lu sur la direction : pas de couture.
                    float n = fbm(dir * 1.7 + vec2(t * 0.12, -t * 0.09) + r * 1.5);
                    float ringR = 0.34 + (n - 0.5) * 0.16 + sin(t * 1.3) * 0.01;
                    float ring = exp(-abs(r - ringR) * (26.0 - uFlare * 10.0));
                    // Volutes qui s'enroulent vers le centre.
                    float c = cos(r * 3.0 - t * 0.5), s = sin(r * 3.0 - t * 0.5);
                    vec2 q = mat2(c, -s, s, c) * p;
                    float wisps = pow(fbm(q * 3.0 - t * 0.2), 3.0) * 2.2 * smoothstep(1.0, 0.25, r);
                    float heart = exp(-r * r * (22.0 - uFlare * 12.0)) * (0.55 + uCharge * 0.6 + uFlare * 2.5);
                    float v = halo + ring * (0.8 + uCharge * 0.6 + uFlare * 1.5) + wisps * (0.3 + uCharge * 0.4) + heart + ray * (0.6 + n * smoothstep(1.0, 0.4, r));
                    v *= 1.0 - uFade;
                    vec3 col = mix(uColor, vec3(1.0), clamp(heart * 0.5 + ring * 0.2, 0.0, 1.0));
                    gl_FragColor = vec4(col * v, min(v, 1.0));
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        const coreGeometry = new THREE.PlaneGeometry(1, 1);
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        let dist = FAR_D;
        core.position.z = -dist;
        scene.add(core);

        // ---- Ailes : deux ailes de lumière, comme un ange, déployées de part et d'autre du noyau.
        // Les plumes sont dessinées une fois dans une texture (aile droite) ; l'aile gauche en est le
        // miroir. Elles battent lentement, et se lèvent quand le noyau s'embrase.
        const wingMap = new THREE.CanvasTexture(drawWing());
        // Unités du noyau (p, comme dans son shader : le cœur fait environ 0,4, le plan ±HALO).
        const WING = 2.7;
        const SHOULDER = { x: 0.2, y: -0.04 };
        const WING_UV = { x: 0.06, y: 0.4 };
        const wx0 = SHOULDER.x - WING_UV.x * WING;
        const wy0 = SHOULDER.y - WING_UV.y * WING;
        const wingGeometry = new THREE.BufferGeometry();
        const wingCorners = [
            [wx0, wy0, 0, 0],
            [wx0 + WING, wy0, 1, 0],
            [wx0 + WING, wy0 + WING, 1, 1],
            [wx0, wy0 + WING, 0, 1],
        ];
        const wingPos: number[] = [];
        const wingUv: number[] = [];
        const wingSide: number[] = [];
        for (const side of [-1, 1])
            for (const [x, y, u, v] of wingCorners) {
                wingPos.push(x, y, 0);
                wingUv.push(u, v);
                wingSide.push(side);
            }
        wingGeometry.setAttribute("position", new THREE.Float32BufferAttribute(wingPos, 3));
        wingGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(wingUv, 2));
        wingGeometry.setAttribute("aSide", new THREE.Float32BufferAttribute(wingSide, 1));
        wingGeometry.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
        const wingMaterial = new THREE.ShaderMaterial({
            uniforms: { ...coreUniforms, uMap: { value: wingMap } },
            vertexShader: /* glsl */ `
                uniform float uTime, uFlare;
                attribute float aSide;
                varying vec2 vUv;
                const vec2 SHOULDER = vec2(${SHOULDER.x.toFixed(3)}, ${SHOULDER.y.toFixed(3)});
                void main() {
                    vUv = uv;
                    // Battement lent, autour de l'épaule ; l'embrasement lève les ailes.
                    float a = 0.07 * sin(uTime * 1.1) + uFlare * 0.14;
                    vec2 q = position.xy - SHOULDER;
                    q = mat2(cos(a), sin(a), -sin(a), cos(a)) * q;
                    vec2 p = SHOULDER + q;
                    p.x *= aSide;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0.0, 1.0);
                }
            `,
            fragmentShader: /* glsl */ `
                uniform sampler2D uMap;
                uniform vec3 uColor;
                uniform float uTime, uFade, uCharge, uFar, uFlare;
                varying vec2 vUv;
                void main() {
                    float m = texture2D(uMap, vUv).a;
                    // Une lueur parcourt les plumes, de l'épaule vers leur pointe.
                    float d = length(vUv - vec2(${WING_UV.x.toFixed(2)}, ${WING_UV.y.toFixed(2)}));
                    float sweep = 0.72 + 0.28 * sin(d * 9.0 - uTime * 1.6);
                    float a = m * sweep * (0.5 + uCharge * 0.25 + uFar * 0.35 + uFlare * 0.45) * (1.0 - uFade);
                    vec3 col = mix(uColor, vec3(1.0), 0.15 + m * 0.35);
                    gl_FragColor = vec4(col * a, min(a, 1.0));
                }
            `,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
        });
        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        // Enfant du noyau : il en suit la place et la taille (le plan du noyau couvre ±HALO).
        wings.scale.setScalar(1 / (2 * HALO));
        wings.frustumCulled = false;
        core.add(wings);

        // ---- Chemin de lumière : un ruban qui passe par un point par réponse donnée. On avance
        // dessus (la caméra se tient un peu au-dessus) ; il s'allonge vers l'étoile à chaque
        // réponse, et l'atteint à la dernière.
        // Hauteur de la caméra au-dessus du chemin, et avance minimale du bout du chemin sur elle.
        const RIDE = 2.2;
        const LEAD = 6;
        const PER_SEGMENT = 20;
        const MAX_NODES = QUESTIONS.length + 2;
        const MAX_SAMPLES = (MAX_NODES - 1) * PER_SEGMENT + 1;
        const nodes: THREE.Vector3[] = [new THREE.Vector3(0, 0, 2)];
        // Points du ruban (pour suivre le chemin depuis le CPU) et longueur parcourue à chacun.
        const sx = new Float32Array(MAX_SAMPLES);
        const sy = new Float32Array(MAX_SAMPLES);
        const sz = new Float32Array(MAX_SAMPLES);
        const sl = new Float32Array(MAX_SAMPLES);
        let samples = 0;
        let nodeLength: number[] = [0];

        const pathPositions = new Float32Array(MAX_SAMPLES * 6);
        const pathNext = new Float32Array(MAX_SAMPLES * 6);
        const pathSide = new Float32Array(MAX_SAMPLES * 2);
        const pathLength = new Float32Array(MAX_SAMPLES * 2);
        const pathIndex: number[] = [];
        for (let i = 0; i < MAX_SAMPLES; i++) {
            pathSide[i * 2] = -1;
            pathSide[i * 2 + 1] = 1;
            if (i < MAX_SAMPLES - 1) {
                const v = i * 2;
                pathIndex.push(v, v + 1, v + 2, v + 2, v + 1, v + 3);
            }
        }
        const pathGeometry = new THREE.BufferGeometry();
        const pathPositionAttr = new THREE.BufferAttribute(pathPositions, 3);
        const pathNextAttr = new THREE.BufferAttribute(pathNext, 3);
        const pathLengthAttr = new THREE.BufferAttribute(pathLength, 1);
        pathGeometry.setAttribute("position", pathPositionAttr);
        pathGeometry.setAttribute("aNext", pathNextAttr);
        pathGeometry.setAttribute("aSide", new THREE.BufferAttribute(pathSide, 1));
        pathGeometry.setAttribute("aS", pathLengthAttr);
        pathGeometry.setIndex(pathIndex);
        pathGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);

        const pathUniforms = {
            uTime: uniforms.uTime,
            uColor: uniforms.uColor,
            uHead: { value: 0 },
            // Demi-taille de l'écran (px CSS) et focale (px par unité, à une unité de distance).
            uRes: { value: new THREE.Vector2(1, 1) },
            uFocal: { value: 1 },
        };
        const pathMaterial = new THREE.ShaderMaterial({
            uniforms: pathUniforms,
            vertexShader: /* glsl */ `
                uniform vec2 uRes;
                uniform float uFocal;
                attribute vec3 aNext;
                attribute float aSide, aS;
                varying float vSide, vS, vDepth, vBehind;
                // Un point derrière l'objectif est ramené juste devant : le ruban reste calculable.
                vec4 clipOf(vec3 p) {
                    vec4 mv = modelViewMatrix * vec4(p, 1.0);
                    mv.z = min(mv.z, -0.06);
                    return projectionMatrix * mv;
                }
                void main() {
                    vec4 mv = modelViewMatrix * vec4(position, 1.0);
                    vDepth = -mv.z;
                    vBehind = step(-0.06, mv.z);
                    vec4 a = clipOf(position);
                    vec4 b = clipOf(aNext);
                    // Largeur tenue à l'écran, en pixels : fine au loin, jamais énorme de près.
                    vec2 dir = normalize((b.xy / b.w - a.xy / a.w) * uRes + vec2(1e-6, 0.0));
                    float w = clamp(0.09 * uFocal / max(vDepth, 0.06), 2.0, 18.0);
                    a.xy += vec2(-dir.y, dir.x) * aSide * w / uRes * a.w;
                    gl_Position = a;
                    vSide = aSide;
                    vS = aS;
                }
            `,
            fragmentShader: /* glsl */ `
                uniform vec3 uColor;
                uniform float uTime, uHead;
                varying float vSide, vS, vDepth, vBehind;
                void main() {
                    float ahead = uHead - vS;
                    if (ahead < 0.0) discard;
                    float x = abs(vSide);
                    float core = exp(-x * x * 16.0);
                    float glow = exp(-x * 3.0) * 0.35;
                    // Plus vif vers le bout, et parcouru de pulsations qui montent vers l'étoile.
                    float tip = exp(-ahead * 0.9);
                    float pulse = 0.65 + 0.35 * sin(vS * 1.4 - uTime * 4.0);
                    float fog = (1.0 - smoothstep(25.0, 90.0, vDepth)) * (1.0 - vBehind);
                    float a = (core * pulse + glow) * (0.75 + tip * 1.5) * fog;
                    vec3 col = mix(uColor, vec3(1.0), core * 0.55 + tip * 0.3);
                    gl_FragColor = vec4(col * a, min(a, 1.0));
                }
            `,
            transparent: true,
            depthWrite: false,
            // Le sens des triangles dépend du virage : le ruban se voit des deux côtés.
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
        });
        const path = new THREE.Mesh(pathGeometry, pathMaterial);
        path.frustumCulled = false;
        scene.add(path);

        // Une perle à chaque pas du chemin (une réponse donnée), et une étincelle à son bout.
        const beadPositions = new Float32Array(MAX_NODES * 3);
        const beadLength = new Float32Array(MAX_NODES);
        const beadGeometry = new THREE.BufferGeometry();
        const beadPositionAttr = new THREE.BufferAttribute(beadPositions, 3);
        const beadLengthAttr = new THREE.BufferAttribute(beadLength, 1);
        beadGeometry.setAttribute("position", beadPositionAttr);
        beadGeometry.setAttribute("aS", beadLengthAttr);
        beadGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
        beadGeometry.setDrawRange(0, 0);
        const beadMaterial = new THREE.ShaderMaterial({
            uniforms: { ...pathUniforms, uPixel: uniforms.uPixel, uSize: { value: 1 } },
            vertexShader: /* glsl */ `
                uniform float uHead, uPixel, uSize, uFocal;
                attribute float aS;
                varying float vOn;
                void main() {
                    vec4 mv = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mv;
                    // La perle éclot quand le bout du chemin la dépasse.
                    vOn = smoothstep(-0.05, 0.8, uHead - aS) * step(mv.z, -0.1);
                    gl_PointSize = clamp(uSize * 0.22 * uFocal / -mv.z, 3.0, 26.0) * uPixel * vOn;
                }
            `,
            fragmentShader: /* glsl */ `
                uniform vec3 uColor;
                uniform float uTime;
                varying float vOn;
                void main() {
                    float d = length(gl_PointCoord - 0.5) * 2.0;
                    float a = (exp(-d * d * 6.0) + exp(-d * 2.5) * 0.4) * (1.0 - smoothstep(0.7, 1.0, d)) * vOn;
                    gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.6) * a, min(a, 1.0));
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        const beads = new THREE.Points(beadGeometry, beadMaterial);
        beads.frustumCulled = false;
        // L'étincelle : une perle plus grosse, toujours allumée, posée au bout du chemin.
        const sparkGeometry = new THREE.BufferGeometry();
        sparkGeometry.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0], 3));
        sparkGeometry.setAttribute("aS", new THREE.Float32BufferAttribute([-10], 1));
        const sparkMaterial = beadMaterial.clone();
        sparkMaterial.uniforms = { ...beadMaterial.uniforms, uSize: { value: 2.2 } };
        const spark = new THREE.Points(sparkGeometry, sparkMaterial);
        spark.frustumCulled = false;
        scene.add(beads, spark);

        // Recalcule le ruban quand un point s'ajoute : une fois par réponse.
        function rebuild() {
            if (nodes.length < 2) return;
            const curve = new THREE.CatmullRomCurve3(nodes, false, "centripetal");
            samples = (nodes.length - 1) * PER_SEGMENT + 1;
            const points = curve.getPoints(samples - 1);
            let length = 0;
            for (let i = 0; i < samples; i++) {
                const p = points[i];
                if (i > 0) length += p.distanceTo(points[i - 1]);
                sx[i] = p.x;
                sy[i] = p.y;
                sz[i] = p.z;
                sl[i] = length;
                const n = i < samples - 1 ? points[i + 1] : p.clone().multiplyScalar(2).sub(points[i - 1]);
                for (let j = 0; j < 2; j++) {
                    const v = i * 2 + j;
                    pathPositions.set([p.x, p.y, p.z], v * 3);
                    pathNext.set([n.x, n.y, n.z], v * 3);
                    pathLength[v] = length;
                }
            }
            pathPositionAttr.needsUpdate = pathNextAttr.needsUpdate = pathLengthAttr.needsUpdate = true;
            pathGeometry.setDrawRange(0, (samples - 1) * 6);
            nodeLength = nodes.map((_, k) => sl[k * PER_SEGMENT]);
            // Une perle par réponse : les deux premiers points sont le départ du chemin.
            const count = Math.max(0, nodes.length - 2);
            for (let k = 0; k < count; k++) {
                beadPositions.set([nodes[k + 2].x, nodes[k + 2].y, nodes[k + 2].z], k * 3);
                beadLength[k] = nodeLength[k + 2];
            }
            beadPositionAttr.needsUpdate = beadLengthAttr.needsUpdate = true;
            beadGeometry.setDrawRange(0, count);
        }

        // Point du chemin à la profondeur z (le chemin ne revient jamais en arrière).
        const along = new THREE.Vector3();
        function pathAt(z: number) {
            if (samples === 0 || z >= sz[0]) return along.set(sx[0] ?? 0, sy[0] ?? 0, z);
            let lo = 0;
            let hi = samples - 1;
            if (z <= sz[hi]) return along.set(sx[hi], sy[hi], z);
            while (hi - lo > 1) {
                const mid = (lo + hi) >> 1;
                if (sz[mid] > z) lo = mid;
                else hi = mid;
            }
            const t = (z - sz[lo]) / (sz[hi] - sz[lo] || 1);
            return along.set(sx[lo] + (sx[hi] - sx[lo]) * t, sy[lo] + (sy[hi] - sy[lo]) * t, z);
        }

        // Point du chemin à la longueur s : le bout visible du chemin.
        const headPoint = new THREE.Vector3();
        function pointAt(s: number) {
            let i = 1;
            while (i < samples - 1 && sl[i] < s) i++;
            const t = Math.max(0, Math.min(1, (s - sl[i - 1]) / (sl[i] - sl[i - 1] || 1)));
            return headPoint.set(sx[i - 1] + (sx[i] - sx[i - 1]) * t, sy[i - 1] + (sy[i] - sy[i - 1]) * t, sz[i - 1] + (sz[i] - sz[i - 1]) * t);
        }

        // ---- Taille : arrivé tout près (NEAR_D), le noyau occupe la même part de l'écran quel
        // que soit son format, entre les deux colonnes de réponses.
        let coreSize = 8;
        let width = 1;
        let height = 1;
        function resize() {
            width = canvas.clientWidth;
            height = canvas.clientHeight;
            renderer.setSize(width, height, false);
            camera.aspect = width / Math.max(height, 1);
            camera.updateProjectionMatrix();
            const visibleH = 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * NEAR_D;
            const visibleW = visibleH * camera.aspect;
            coreSize = Math.min(visibleH * 0.62, visibleW * 0.55);
        }
        const observer = new ResizeObserver(resize);
        observer.observe(canvas);
        resize();

        // ---- Commandes reçues de l'interface.
        const focusDir = new THREE.Vector2(0, 1);
        let focusTarget = 0;
        let flareTarget = 0;
        // Place du noyau à l'écran, d'une question à l'autre : jamais forcément au centre, mais
        // toujours visible. `rest` donne un point dans [-1, 1]², ramené dans la zone où le noyau
        // tient entier (entre les colonnes de réponses sur grand écran).
        const rest = (k: number) => ({ u: Math.sin(k * 2.4 + 0.5) * 0.9, v: Math.cos(k * 1.7) * 0.8 });
        let from = rest(0);
        let to = from;
        // Un vol : de la distance actuelle à la suivante, pendant que le chemin s'allonge (de
        // `grow0` à `grow1`). Le dernier plonge dans l'étoile, posée en `dive`.
        let warp: { start: number; ms: number; last: boolean; from: number; to: number; z0: number; grow0: number; grow1: number; done: () => void } | null = null;
        let dive: THREE.Vector3 | null = null;
        let flights = 0;
        // Position du noyau à l'écran (coordonnées normalisées, -1 à 1) au moment du rendu.
        const ndc = { x: 0, y: 0 };
        // Écran étroit : hauteur visée dans la bande sous la question (px), suivie en douceur.
        let anchorY = -1;
        let anchorShown = -1;
        const pointer = new THREE.Vector2();
        // La caméra, posée sur le chemin (sans le balancement du pointeur).
        const base = new THREE.Vector3(0, RIDE, 0);
        let headLength = 0;

        // Où poser le noyau à l'écran, pour une place (u, v) visée à la distance d.
        function place(u: number, v: number, d: number, fov: number, anchor: number) {
            const tanHalf = Math.tan(THREE.MathUtils.degToRad(fov / 2));
            const radiusY = (coreSize * 0.3) / (tanHalf * Math.max(d, 0.01));
            const radiusX = radiusY / camera.aspect;
            const wide = width > 860;
            const safeX = wide ? Math.min(0.34 * width, 440) / width : 0.6;
            let x = u * Math.max(0, safeX - radiusX);
            let y = v * Math.max(0, 0.32 - radiusY);
            // Écran étroit : le noyau reste dans sa bande, seul son côté change.
            if (!wide && anchor > 0) y = 1 - (2 * anchor) / height;
            const edgeX = Math.max(0, 0.85 - radiusX);
            const edgeY = Math.max(0, 0.8 - radiusY);
            return { x: Math.max(-edgeX, Math.min(edgeX, x)), y: Math.max(-edgeY, Math.min(edgeY, y)), tanHalf };
        }

        // Le noyau en coordonnées du monde, vu d'une caméra posée en `cam`.
        function starFrom(cam: THREE.Vector3, u: number, v: number, d: number, fov: number, anchor: number) {
            const n = place(u, v, d, fov, anchor);
            return new THREE.Vector3(cam.x + n.x * n.tanHalf * camera.aspect * d, cam.y + n.y * n.tanHalf * d, cam.z - d);
        }

        // Prochain pas du chemin : vers l'étoile telle qu'on la verra une fois arrivé, assez loin
        // devant la caméra pour que le chemin déjà tracé reste visible, de plus en plus long.
        function step(p: number, d: number, u: number, v: number) {
            const camZ = -(FAR_D - d);
            const cam = pathAt(camZ).clone();
            cam.y += RIDE;
            const star = starFrom(cam, u, v, d, FOV, anchorY);
            const headZ = camZ - Math.max(LEAD, d * Math.pow(p, 0.9));
            const last = nodes[nodes.length - 1];
            const f = (last.z - headZ) / (last.z - star.z || 1);
            nodes.push(last.clone().lerp(star, Math.max(0.05, Math.min(1, f))));
            rebuild();
        }

        // Départ : un premier bout de chemin, tourné vers l'étoile.
        step(0, FAR_D, from.u, from.v);

        scene3d = {
            focus(x, y) {
                const star = this.star();
                focusDir.set(x - star.x, star.y - y).normalize();
                focusTarget = 1;
            },
            unfocus() {
                focusTarget = 0;
            },
            absorb() {
                flareTarget = 1;
            },
            warp(ms, last) {
                const grow0 = headLength;
                from = to;
                if (last) {
                    // Le chemin rejoint l'étoile là où elle brille, puis on le suit jusqu'en elle.
                    dive = core.position.clone();
                    nodes.push(dive.clone());
                    rebuild();
                } else {
                    to = rest(++flights);
                    step(charge, distAt(charge), to.u, to.v);
                }
                const target = last ? 0.4 : distAt(charge);
                const grow1 = nodeLength[nodeLength.length - 1];
                return new Promise((done) => (warp = { start: performance.now(), ms, last, from: dist, to: target, z0: base.z, grow0, grow1, done }));
            },
            star() {
                return { x: ((ndc.x + 1) / 2) * width, y: ((1 - ndc.y) / 2) * height };
            },
            head() {
                const p = pointAt(headLength).clone().project(camera);
                return { x: ((p.x + 1) / 2) * width, y: ((1 - p.y) / 2) * height };
            },
            anchor(y) {
                anchorY = y;
                if (anchorShown < 0) anchorShown = y;
            },
            progress(p) {
                charge = p;
            },
            wing(css) {
                // Les gris (Aqua, Shizari) restent argentés, plus ternes que le blanc d'une égalité.
                vivid(angelTarget, css ?? "#ffffff");
            },
            dragons(names, last) {
                const ready = names.filter((name) => dragonMaps.has(name));
                // Répartis autour de l'axe de vol, jamais au centre (le noyau y brille).
                const turn = Math.random() * Math.PI * 2;
                ready.forEach((name, i) => {
                    const d = sigils.find((s) => !s.active);
                    if (!d) return;
                    const a = turn + (i / ready.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
                    const r = 4 + Math.random() * 2.5;
                    d.x = Math.cos(a) * r;
                    d.y = Math.sin(a) * r;
                    // Assez loin pour être dépassé à la fin du vol (bien plus loin pour la plongée
                    // finale, bien plus rapide).
                    d.z = -(last ? 75 : 34) - Math.random() * 6;
                    d.born = performance.now();
                    d.active = true;
                    d.peak = 0;
                    d.gone = 0;
                    d.u.uMap.value = dragonMaps.get(name)!;
                    d.u.uDir.value.set(Math.cos(a), Math.sin(a));
                    d.u.uAlpha.value = 0;
                    d.mesh.visible = true;
                });
            },
        };

        const onPointer = (e: PointerEvent) => pointer.set(e.clientX / width - 0.5, e.clientY / height - 0.5);
        window.addEventListener("pointermove", onPointer);

        // ---- Boucle de rendu.
        let frame = 0;
        let last = performance.now();
        let slow = 0;
        let sampled = 0;
        let swayX = 0;
        let swayY = 0;
        let bank = 0;
        const look = new THREE.Vector3();
        const smooth = (from: number, to: number, rate: number, dt: number) => from + (to - from) * (1 - Math.exp(-rate * dt));

        function loop(now: number) {
            frame = requestAnimationFrame(loop);
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;

            // Machine lente : on baisse la résolution une fois, après quelques images.
            if (sampled < 90) {
                sampled++;
                if (dt > 0.028) slow++;
                if (sampled === 90 && slow > 45 && pixelRatio > 0.75) {
                    pixelRatio = 0.75;
                    renderer.setPixelRatio(pixelRatio);
                    uniforms.uPixel.value = pixelRatio;
                    resize();
                }
            }

            uniforms.uTime.value = now / 1000;
            if (Math.abs(chargeShown - charge) > 0.001) {
                chargeShown = smooth(chargeShown, charge, 3, dt);
                coreUniforms.uCharge.value = chargeShown;
                const visible = Math.round(STARS * (0.3 + 0.7 * chargeShown));
                pointsGeometry.setDrawRange(0, visible);
                linesGeometry.setDrawRange(0, visible * 2);
            }
            let speed = reduced ? 0.4 : 1.6;
            let s = 0;
            let e = 1;
            const lastX = base.x;

            if (warp) {
                const t = Math.min(1, (now - warp.start) / warp.ms);
                // Un vol accélère puis ralentit à l'approche ; la dernière plongée ne ralentit pas.
                e = warp.last ? t * t * t : t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                // Le chemin s'allonge d'abord, vite : la caméra ne le rattrape jamais.
                const g = Math.min(1, t / (warp.last ? 0.7 : 0.55));
                headLength = warp.grow0 + (warp.grow1 - warp.grow0) * (1 - Math.pow(1 - g, 3));
                if (warp.last && dive) {
                    base.z = warp.z0 + (dive.z + warp.to - warp.z0) * e;
                    dist = base.z - dive.z;
                } else {
                    dist = warp.from + (warp.to - warp.from) * e;
                    base.z = -(FAR_D - dist);
                }
                s = warp.last ? Math.min(1, t * 1.4) : Math.pow(Math.sin(Math.PI * t), 2);
                speed += (warp.last ? 200 : 70) * s;
                if (t >= 1) {
                    const done = warp.done;
                    warp = null;
                    flareTarget = 0;
                    from = to;
                    done();
                }
            } else {
                // Au repos (et au départ) : le chemin finit de pousser jusqu'à son dernier point.
                headLength = smooth(headLength, nodeLength[nodeLength.length - 1], 2.5, dt);
                if (!dive) base.z = -(FAR_D - dist);
            }
            const diving = warp?.last ? e : dive ? 1 : 0;

            // La caméra suit le chemin, un peu au-dessus ; elle s'y pose en plongeant dans l'étoile.
            const on = pathAt(base.z);
            base.x = on.x;
            base.y = on.y + RIDE * (1 - diving);

            uniforms.uTravel.value += speed * dt;

            // Les dragons filent avec les étoiles (même vitesse), s'étirent avec la vitesse du vol,
            // et s'effacent à notre passage. Ceux qu'on n'a pas tout à fait dépassés s'éteignent
            // quand le vol retombe : ils ne restent jamais sur les réponses suivantes.
            for (const d of sigils) {
                if (!d.active) continue;
                d.z += speed * dt;
                d.peak = Math.max(d.peak, s);
                if (d.peak > 0.5 && s < 0.15) d.gone = Math.min(1, d.gone + dt * 4);
                const age = (now - d.born) / 1000;
                const pop = Math.min(1, age / 0.4);
                const near = Math.min(1, Math.max(0, -d.z / 5));
                const life = (1 - d.gone) * (1 - Math.min(1, Math.max(0, (age - 2.4) / 0.6)));
                d.u.uPop.value = 1 - Math.pow(1 - pop, 3);
                d.u.uAlpha.value = 0.55 * pop * near * life;
                d.u.uStretch.value = s;
                d.mesh.position.set(base.x + d.x, base.y + d.y, base.z + d.z);
                if (d.z > -0.3 || life <= 0) {
                    d.active = false;
                    d.mesh.visible = false;
                }
            }
            uniforms.uStretch.value = (warp?.last ? 18 : 10) * s;
            uniforms.uStreak.value = s;
            lines.visible = s > 0.01;
            points.position.copy(base);
            lines.position.copy(base);

            angelTint.value.lerp(angelTarget, 1 - Math.exp(-2 * dt));
            coreUniforms.uFlare.value = smooth(coreUniforms.uFlare.value, warp ? 1 : flareTarget, 6, dt);
            coreUniforms.uFocusAmt.value = smooth(coreUniforms.uFocusAmt.value, focusTarget, 8, dt);
            coreUniforms.uFocus.value.lerp(focusDir, 1 - Math.exp(-10 * dt)).normalize();
            // Ouverture du champ de vision, élargie pendant le vol.
            const fov = FOV + s * (warp?.last ? 28 : 10);
            if (Math.abs(camera.fov - fov) > 0.01) {
                camera.fov = fov;
                camera.updateProjectionMatrix();
            }

            if (dive) {
                core.position.copy(dive);
                const p = dive.clone().sub(base);
                const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
                ndc.x = p.x / (Math.max(dist, 0.01) * tanHalf * camera.aspect);
                ndc.y = p.y / (Math.max(dist, 0.01) * tanHalf);
            } else {
                if (anchorY > 0) anchorShown = smooth(anchorShown, anchorY, 4, dt);
                const n = place(from.u + (to.u - from.u) * e, from.v + (to.v - from.v) * e, dist, camera.fov, anchorShown);
                ndc.x = n.x;
                ndc.y = n.y;
                core.position.set(base.x + n.x * n.tanHalf * camera.aspect * dist, base.y + n.y * n.tanHalf * dist, base.z - dist);
            }
            core.scale.setScalar(coreSize * HALO);
            coreUniforms.uFar.value = Math.max(0, Math.min(1, (dist - NEAR_D) / (FAR_D - NEAR_D))) ** 0.6;

            // Le bout du chemin et son étincelle.
            pathUniforms.uHead.value = headLength;
            spark.position.copy(pointAt(headLength));
            pathUniforms.uRes.value.set(width / 2, height / 2);
            pathUniforms.uFocal.value = height / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

            // La caméra suit doucement le pointeur, s'incline dans les virages du chemin et tourne
            // un peu pendant la plongée.
            const sway = reduced ? 0 : 1 - diving;
            swayX = smooth(swayX, pointer.x * 0.8 * sway, 2, dt);
            swayY = smooth(swayY, -pointer.y * 0.5 * sway, 2, dt);
            camera.position.set(base.x + swayX, base.y + swayY, base.z);
            look.set(base.x, base.y, base.z - Math.max(dist, 1));
            if (dive) look.lerp(dive, diving);
            camera.lookAt(look);
            bank = smooth(bank, Math.max(-0.2, Math.min(0.2, ((base.x - lastX) / Math.max(dt, 0.001)) * -0.02)), 3, dt);
            camera.rotation.z += bank + s * (warp?.last ? 0.25 : 0.06) * Math.sign(bank || 1);

            renderer.render(scene, camera);
        }
        frame = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            window.removeEventListener("pointermove", onPointer);
            for (const d of [
                pointsGeometry, linesGeometry, coreGeometry, wingGeometry, pathGeometry, beadGeometry, sparkGeometry,
                pointsMaterial, linesMaterial, coreMaterial, wingMaterial, pathMaterial, beadMaterial, sparkMaterial, wingMap,
                sigilGeometry, ...sigils.map((s) => s.material), ...dragonMaps.values(),
            ])
                d.dispose();
            disposed = true;
            renderer.dispose();
            scene3d = null;
        };
    }
</script>

<svelte:window onkeydown={onKey} />

<div class="journey" style="--c: {color};" data-phase={phase}>
    <canvas bind:this={canvas} aria-hidden="true"></canvas>

    <!-- Avancée : un segment par question, allumé une fois la réponse donnée. -->
    <div class="hud" aria-hidden="true">
        <ol class="track">
            {#each QUESTIONS as _, i (i)}
                <li class:done={i < answered} class:current={i === index && i >= answered} class:lit={i === lit}></li>
            {/each}
        </ol>
        <span class="step"><b>{Math.min(index + 1, QUESTIONS.length)}</b> / {QUESTIONS.length}</span>
    </div>

    {#key index}
        <h2 class="question" class:raised={phase !== "question"} aria-live="polite" bind:clientHeight={questionHeight}>
            <span class="count">Question {index + 1}</span>
            <span class="text">{gendered(question.text, address)}</span>
        </h2>
    {/key}

    {#if showAnswers}
        {#key index}
            <div class="orbit" style="--qh: {questionHeight}px;" use:watchOverflow>
                {#each [question.answers.slice(0, split), question.answers.slice(split)] as side, s (s)}
                    <div class="side" class:right={s === 1}>
                        {#each side as answer, j (j)}
                            {@const k = s === 0 ? j : split + j}
                            {@const t = side.length > 1 ? (j - (side.length - 1) / 2) / ((side.length - 1) / 2) : 0}
                            <div
                                class="slot"
                                style="--arc: {(1 - t * t) * 2.5}rem; --i: {k}; --float: {5 + ((k * 7) % 4)}s; --tilt: {((k * 37) % 5) - 2}deg;"
                            >
                                <button
                                    class="fragment"
                                    class:chosen={chosen === k}
                                    class:gone={chosen !== null && chosen !== k}
                                    style={chosen === k ? `--dx: ${pull.x}px; --dy: ${pull.y}px;` : ""}
                                    data-k={k}
                                    disabled={phase !== "answers"}
                                    onclick={(e) => choose(k, e.currentTarget)}
                                    onpointerenter={(e) => hover(e.currentTarget)}
                                    onpointerleave={() => hover(null)}
                                    onfocus={(e) => hover(e.currentTarget)}
                                    onblur={() => hover(null)}
                                >
                                    <span class="spark" aria-hidden="true"></span>
                                    {gendered(answer.text, address)}
                                </button>
                            </div>
                        {/each}
                    </div>
                {/each}
            </div>
        {/key}
    {/if}

    {#if moreBelow && phase === "answers"}
        <div class="more" transition:fade={{ duration: 250 }}>
            <button class="more-hint" onclick={scrollMore} aria-label="Faire défiler : d'autres réponses plus bas">
                <span>D'autres réponses plus bas</span>
                <span class="chevrons" aria-hidden="true"><i></i><i></i></span>
            </button>
        </div>
    {/if}

    <div class="flash" class:on={flash} aria-hidden="true"></div>
</div>

<style>
    .journey {
        position: fixed;
        inset: 0;
        overflow: hidden;
        background:
            radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--c) 14%, #050507) 0%, #030304 55%, #000 100%);
        color: var(--foreground);
    }

    canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
    }
    .hud {
        position: absolute;
        top: 1.1rem;
        left: 50%;
        width: min(88%, 40rem);
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 0.9rem;
        font-size: 0.8rem;
        letter-spacing: 0.1em;
        color: rgba(255, 255, 255, 0.55);
        pointer-events: none;
    }

    .track {
        flex: 1;
        display: flex;
        gap: 3px;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .track li {
        flex: 1;
        height: 4px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.12);
        transition:
            background-color 0.4s ease,
            box-shadow 0.4s ease;
    }

    .track li.done {
        background: var(--c);
        box-shadow: 0 0 6px var(--c);
    }

    .track li.current {
        background: color-mix(in srgb, var(--c) 45%, transparent);
        animation: blink 1.2s ease-in-out infinite alternate;
    }

    /* Le segment qui vient de s'allumer jaillit un instant. */
    .track li.lit {
        animation: lit 0.7s ease-out;
    }

    .step {
        min-width: 3.6rem;
        text-align: right;
        font-variant-numeric: tabular-nums;
    }

    .step b {
        font-size: 1.15rem;
        font-weight: normal;
        color: var(--c);
        text-shadow: 0 0 8px var(--c);
    }

    @keyframes blink {
        to {
            opacity: 0.45;
        }
    }

    @keyframes lit {
        0% {
            background: #fff;
            box-shadow: 0 0 14px 3px var(--c);
            transform: scaleY(2.5);
        }
    }

    /* La question naît seule au centre, puis monte laisser la place aux réponses. */
    .question {
        position: absolute;
        top: 0;
        left: 50%;
        width: min(92%, 46rem);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.6rem;
        text-align: center;
        transform: translate(-50%, calc(50svh - 50%));
        transition: transform 0.6s cubic-bezier(0.65, 0, 0.35, 1);
        animation: appear 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
        pointer-events: none;
    }

    .question.raised {
        transform: translate(-50%, 3.6rem);
    }

    [data-phase="warp"] .question,
    [data-phase="ending"] .question {
        opacity: 0;
        filter: blur(8px);
        transform: translate(-50%, 3.6rem) scale(1.15);
        transition:
            opacity 0.3s ease,
            filter 0.3s ease,
            transform 0.3s ease;
    }

    .count {
        font-size: 0.75rem;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: var(--c);
        text-shadow: 0 0 10px var(--c);
    }

    .text {
        font-size: clamp(1.5rem, 3.4vw, 2.5rem);
        line-height: 1.2;
        text-shadow:
            0 0 22px #000,
            0 0 6px #000;
    }

    @keyframes appear {
        from {
            opacity: 0;
            filter: blur(14px);
            letter-spacing: 0.12em;
        }
    }

    /* Les réponses flottent de part et d'autre du noyau, en arc. */
    .orbit {
        position: absolute;
        inset: calc(3.6rem + var(--qh) + 1.5rem) 0 2rem;
        display: grid;
        grid-template-columns: 1fr min(34vw, 22rem) 1fr;
        align-items: center;
        /* De quoi loger l'arc : la réponse du milieu s'écarte de 2,5rem. */
        padding: 0 3.5rem;
    }

    .side {
        grid-column: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: clamp(0.8rem, 3svh, 2rem);
    }

    .side.right {
        grid-column: 3;
        align-items: flex-start;
    }

    .slot {
        width: min(100%, 21rem);
        transform: translateX(calc(var(--arc) * -1));
        animation: float var(--float) ease-in-out calc(var(--i) * -1.3s) infinite alternate;
    }

    .right .slot {
        transform: translateX(var(--arc));
        --dir: 1;
    }

    @keyframes float {
        to {
            translate: 0 -0.7rem;
            rotate: 0.6deg;
        }
    }

    .fragment {
        position: relative;
        display: block;
        width: 100%;
        padding: 0.9rem 1.1rem 0.9rem 1.9rem;
        text-align: left;
        font-family: var(--titleFont);
        font-size: 1.08rem;
        line-height: 1.3;
        color: var(--foreground);
        border: 1px solid color-mix(in srgb, var(--c) 40%, transparent);
        border-radius: 2px 14px 2px 14px;
        background: linear-gradient(135deg, rgba(14, 14, 20, 0.82), rgba(6, 6, 9, 0.7));
        rotate: var(--tilt);
        animation: arrive 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) calc(var(--i) * 60ms) backwards;
        transition:
            border-color 0.25s ease,
            box-shadow 0.25s ease,
            rotate 0.25s ease,
            scale 0.25s ease;
    }

    .fragment:not(:disabled):hover,
    .fragment:not(:disabled):focus-visible {
        border-color: var(--c);
        box-shadow:
            0 0 18px color-mix(in srgb, var(--c) 45%, transparent),
            inset 0 0 14px color-mix(in srgb, var(--c) 18%, transparent);
        rotate: 0deg;
        scale: 1.04;
        outline: none;
    }

    .fragment:disabled {
        cursor: default;
    }

    .spark {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        width: 0.45rem;
        height: 0.45rem;
        transform: translateY(-50%) rotate(45deg);
        background: var(--c);
        box-shadow: 0 0 8px var(--c);
        opacity: 0.7;
    }

    @keyframes arrive {
        from {
            opacity: 0;
            scale: 0.7;
            filter: blur(10px);
            translate: calc(var(--dir, -1) * -3rem) 0;
        }
    }

    /* La réponse choisie est aspirée par le noyau, les autres se dispersent. */
    .fragment.chosen {
        translate: var(--dx) var(--dy);
        scale: 0.15;
        opacity: 0;
        filter: blur(4px);
        box-shadow: 0 0 30px var(--c);
        transition:
            translate 0.4s cubic-bezier(0.55, 0, 0.9, 0.4),
            scale 0.4s cubic-bezier(0.55, 0, 0.9, 0.4),
            opacity 0.25s ease 0.18s,
            filter 0.4s ease;
    }

    .fragment.gone {
        opacity: 0;
        filter: blur(8px);
        translate: calc(var(--dir, -1) * 4rem) 0;
        transition:
            opacity 0.3s ease,
            filter 0.3s ease,
            translate 0.4s ease-in;
    }

    .right .fragment {
        --dir: 1;
    }

    .flash {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle, #fff 0%, var(--c) 40%, #000 100%);
        opacity: 0;
        transition: opacity 0.8s ease;
        pointer-events: none;
    }

    .flash.on {
        opacity: 1;
    }

    /* Écran étroit : une seule colonne sous la question, le noyau reste derrière. */
    @media (max-width: 860px) {
        .question.raised {
            transform: translate(-50%, 2.8rem);
        }

        .text {
            font-size: 1.3rem;
        }

        .orbit {
            inset: calc(2.8rem + var(--qh) + 0.8rem) 0 0;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-start;
            gap: 0.7rem;
            /* La bande du haut est celle du noyau (BAND dans le script). */
            padding: calc(20svh + 0.5rem) 1rem 1.5rem;
            overflow-y: auto;
        }

        .side,
        .side.right {
            align-items: stretch;
            gap: 0.7rem;
        }

        .slot,
        .right .slot {
            width: 100%;
            transform: none;
        }

        .fragment {
            font-size: 1rem;
            padding: 0.75rem 1rem 0.75rem 1.8rem;
        }
    }

    /* D'autres réponses sous le bord de l'écran : un voile en bas, et un signe qui invite à
       faire défiler (le toucher fait défiler). */
    .more {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 2;
        display: flex;
        justify-content: center;
        padding: 3.5rem 1rem max(0.9rem, env(safe-area-inset-bottom));
        background: linear-gradient(to top, rgba(0, 0, 0, 0.92) 25%, rgba(0, 0, 0, 0.6) 60%, transparent);
        pointer-events: none;
    }

    .more-hint {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.45rem 0.9rem 0.45rem 1.1rem;
        font-size: 0.85rem;
        letter-spacing: 0.04em;
        color: var(--foreground);
        border: 1px solid var(--c);
        border-radius: 999px;
        background: rgba(8, 8, 12, 0.9);
        box-shadow: 0 0 14px color-mix(in srgb, var(--c) 45%, transparent);
        pointer-events: auto;
    }

    /* Deux chevrons qui descendent l'un après l'autre. */
    .chevrons {
        display: grid;
        place-items: center;
        width: 0.8rem;
        height: 1.1rem;
    }

    .chevrons i {
        grid-area: 1 / 1;
        width: 0.5rem;
        height: 0.5rem;
        border-right: 2px solid var(--c);
        border-bottom: 2px solid var(--c);
        rotate: 45deg;
        animation: drop 1.4s ease-in-out infinite;
    }

    .chevrons i:last-child {
        animation-delay: 0.7s;
    }

    @keyframes drop {
        0% {
            opacity: 0;
            translate: 0 -0.45rem;
        }
        50% {
            opacity: 1;
        }
        100% {
            opacity: 0;
            translate: 0 0.35rem;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .slot,
        .track li.current,
        .track li.lit {
            animation: none;
        }

        .chevrons i {
            animation: none;
            opacity: 1;
        }

        .chevrons i:last-child {
            display: none;
        }
    }
</style>
