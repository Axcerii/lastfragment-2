<script lang="ts">
    import { onMount } from "svelte";
    import * as THREE from "three";
    import { QUESTIONS } from "$lib/flux/quiz-data";

    // Le test de flux, plein écran. Pour chaque question : la question apparaît seule au centre,
    // puis monte, et les réponses flottent autour d'un noyau de flux. Choisir une réponse la fait
    // absorber par le noyau, puis on plonge à travers lui jusqu'à la question suivante.
    //
    // La 3D se limite à deux choses peu coûteuses, animées dans les shaders : un champ d'étoiles
    // (points + traînées) et le noyau (un plan). Chaque image ne change que quelques uniformes :
    // pas de post-traitement, aucune géométrie recréée, aucun état Svelte touché pendant le rendu.
    let { color, onFinish }: { color: string; onFinish: (answers: number[]) => void } = $props();

    // Durées des étapes d'une question (ms).
    const QUESTION_MS = 1300;
    const ABSORB_MS = 650;
    const WARP_MS = 1500;

    type Phase = "question" | "answers" | "leaving" | "warp" | "ending";
    let index = $state(0);
    let phase = $state<Phase>("question");
    let chosen = $state<number | null>(null);
    let pull = $state({ x: 0, y: 0 });
    let flash = $state(false);
    // Hauteur de la question : les réponses commencent juste en dessous.
    let questionHeight = $state(0);
    let answers: number[] = [];

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
    } | null = null;

    const wait = (ms: number) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 150) : ms));

    async function present() {
        phase = "question";
        await wait(QUESTION_MS);
        phase = "answers";
    }

    async function choose(k: number, el: HTMLElement) {
        if (phase !== "answers") return;
        answers.push(k);
        const r = el.getBoundingClientRect();
        pull = { x: innerWidth / 2 - (r.left + r.width / 2), y: innerHeight / 2 - (r.top + r.height / 2) };
        chosen = k;
        phase = "leaving";
        scene3d?.unfocus();
        scene3d?.absorb();
        await wait(ABSORB_MS);

        const last = index + 1 >= QUESTIONS.length;
        phase = last ? "ending" : "warp";
        if (scene3d && !reduced) await scene3d.warp(last ? WARP_MS * 1.3 : WARP_MS, last);
        else await wait(300);

        if (last) {
            flash = true;
            await wait(900);
            onFinish(answers);
            return;
        }
        chosen = null;
        index++;
        present();
    }

    function hover(el: HTMLElement | null) {
        if (!scene3d || phase !== "answers") return;
        if (!el) return scene3d.unfocus();
        const r = el.getBoundingClientRect();
        scene3d.focus(r.left + r.width / 2, r.top + r.height / 2);
    }

    // Raccourcis : 1 à 6 pour répondre.
    function onKey(e: KeyboardEvent) {
        const k = Number(e.key) - 1;
        if (phase !== "answers" || !(k >= 0 && k < question.answers.length)) return;
        const el = document.querySelector<HTMLElement>(`.journey [data-k="${k}"]`);
        if (el) choose(k, el);
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
        const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
        const FOV = 60;
        const CORE_Z = -10;

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
        pointsGeometry.setDrawRange(0, STARS);
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
        linesGeometry.setDrawRange(0, STARS * 2);
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

        // ---- Noyau de flux : un anneau de bruit qui respire, un cœur, et un rayon vers la réponse visée.
        const coreUniforms = {
            uTime: uniforms.uTime,
            uColor: uniforms.uColor,
            uFlare: { value: 0 },
            uFocus: { value: new THREE.Vector2(0, 1) },
            uFocusAmt: { value: 0 },
            uFade: { value: 0 },
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
                uniform float uTime, uFlare, uFocusAmt, uFade;
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
                    vec2 p = vUv * 2.0 - 1.0;
                    float r = length(p);
                    if (r > 1.0) discard;
                    vec2 dir = p / max(r, 1e-4);
                    float t = uTime;
                    // Anneau déformé par le bruit, lu sur la direction : pas de couture.
                    float n = fbm(dir * 1.7 + vec2(t * 0.12, -t * 0.09) + r * 1.5);
                    float ringR = 0.34 + (n - 0.5) * 0.16 + sin(t * 1.3) * 0.01;
                    float ring = exp(-abs(r - ringR) * (26.0 - uFlare * 10.0));
                    // Volutes qui s'enroulent vers le centre.
                    float c = cos(r * 3.0 - t * 0.5), s = sin(r * 3.0 - t * 0.5);
                    vec2 q = mat2(c, -s, s, c) * p;
                    float wisps = pow(fbm(q * 3.0 - t * 0.2), 3.0) * 2.2 * smoothstep(1.0, 0.25, r);
                    float heart = exp(-r * r * (22.0 - uFlare * 12.0)) * (0.7 + uFlare * 2.5);
                    // Rayon vers la réponse survolée.
                    float da = 1.0 - dot(dir, uFocus);
                    float ray = exp(-da * 60.0) * smoothstep(1.0, 0.3, r) * smoothstep(0.12, 0.38, r) * uFocusAmt;
                    float v = ring * (1.0 + uFlare * 1.5) + wisps * 0.45 + heart + ray * (0.7 + n);
                    v *= smoothstep(1.0, 0.7, r) * (1.0 - uFade);
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
        core.position.z = CORE_Z;
        scene.add(core);

        // ---- Taille : le noyau garde la même part de l'écran quel que soit son format.
        let coreSize = 8;
        let width = 1;
        let height = 1;
        function resize() {
            width = canvas.clientWidth;
            height = canvas.clientHeight;
            renderer.setSize(width, height, false);
            camera.aspect = width / Math.max(height, 1);
            camera.updateProjectionMatrix();
            const visibleH = 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * -CORE_Z;
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
        let warp: { start: number; ms: number; last: boolean; done: () => void } | null = null;
        const pointer = new THREE.Vector2();

        scene3d = {
            focus(x, y) {
                focusDir.set(x - width / 2, height / 2 - y).normalize();
                focusTarget = 1;
            },
            unfocus() {
                focusTarget = 0;
            },
            absorb() {
                flareTarget = 1;
            },
            warp(ms, last) {
                return new Promise((done) => (warp = { start: performance.now(), ms, last, done }));
            },
        };

        const onPointer = (e: PointerEvent) => pointer.set(e.clientX / width - 0.5, e.clientY / height - 0.5);
        window.addEventListener("pointermove", onPointer);

        // ---- Boucle de rendu.
        let frame = 0;
        let last = performance.now();
        let slow = 0;
        let sampled = 0;
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
            let speed = reduced ? 0.4 : 1.6;
            let s = 0;
            let scale = 1;
            let fade = 0;

            if (warp) {
                const t = Math.min(1, (now - warp.start) / warp.ms);
                // La vitesse monte puis retombe ; la dernière plongée ne ralentit pas.
                s = warp.last ? Math.min(1, t * 1.6) : Math.pow(Math.sin(Math.PI * t), 2);
                speed += 160 * s;
                // On traverse le noyau : il grossit jusqu'à couvrir l'écran, puis un nouveau naît au loin.
                if (warp.last) {
                    scale = 1 + t * t * 9;
                } else if (t < 0.5) {
                    scale = 1 + Math.pow(t / 0.5, 2) * 6;
                    fade = Math.pow(t / 0.5, 3);
                } else {
                    scale = 0.2 + ((t - 0.5) / 0.5) * 0.8;
                    fade = 1 - (t - 0.5) / 0.5;
                }
                if (t >= 1) {
                    const done = warp.done;
                    warp = null;
                    flareTarget = 0;
                    done();
                }
            }

            uniforms.uTravel.value += speed * dt;
            uniforms.uStretch.value = 18 * s;
            uniforms.uStreak.value = s;
            lines.visible = s > 0.01;

            coreUniforms.uFlare.value = smooth(coreUniforms.uFlare.value, warp ? 1 : flareTarget, 6, dt);
            coreUniforms.uFocusAmt.value = smooth(coreUniforms.uFocusAmt.value, focusTarget, 8, dt);
            coreUniforms.uFocus.value.lerp(focusDir, 1 - Math.exp(-10 * dt)).normalize();
            coreUniforms.uFade.value = fade;
            core.scale.setScalar(coreSize * scale);

            // La caméra suit doucement le pointeur, s'élargit et tourne un peu pendant la plongée.
            const sway = reduced ? 0 : 1;
            camera.position.x = smooth(camera.position.x, pointer.x * 0.8 * sway, 2, dt);
            camera.position.y = smooth(camera.position.y, -pointer.y * 0.5 * sway, 2, dt);
            camera.lookAt(0, 0, CORE_Z);
            camera.rotation.z += s * 0.25;
            const fov = FOV + s * 28;
            if (Math.abs(camera.fov - fov) > 0.01) {
                camera.fov = fov;
                camera.updateProjectionMatrix();
            }

            renderer.render(scene, camera);
        }
        frame = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            window.removeEventListener("pointermove", onPointer);
            for (const d of [pointsGeometry, linesGeometry, coreGeometry, pointsMaterial, linesMaterial, coreMaterial]) d.dispose();
            renderer.dispose();
            scene3d = null;
        };
    }
</script>

<svelte:window onkeydown={onKey} />

<div class="journey" style="--c: {color};" data-phase={phase}>
    <canvas bind:this={canvas} aria-hidden="true"></canvas>

    <div class="hud" aria-hidden="true">
        <span>{Math.min(index + 1, QUESTIONS.length)} / {QUESTIONS.length}</span>
        <div class="bar"><div style="width: {(answers.length / QUESTIONS.length) * 100}%;"></div></div>
    </div>

    {#key index}
        <h2 class="question" class:raised={phase !== "question"} aria-live="polite" bind:clientHeight={questionHeight}>
            <span class="count">Question {index + 1}</span>
            <span class="text">{question.text}</span>
        </h2>
    {/key}

    {#if showAnswers}
        {#key index}
            <div class="orbit" style="--qh: {questionHeight}px;">
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
                                    {answer.text}
                                </button>
                            </div>
                        {/each}
                    </div>
                {/each}
            </div>
        {/key}
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
        width: min(60%, 26rem);
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 0.9rem;
        font-size: 0.8rem;
        letter-spacing: 0.1em;
        color: rgba(255, 255, 255, 0.55);
        pointer-events: none;
    }

    .bar {
        flex: 1;
        height: 2px;
        background: rgba(255, 255, 255, 0.12);
    }

    .bar div {
        height: 100%;
        background: var(--c);
        box-shadow: 0 0 8px var(--c);
        transition: width 0.8s ease;
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
        transition: transform 1s cubic-bezier(0.65, 0, 0.35, 1);
        animation: appear 1.1s cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
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
            opacity 0.5s ease,
            filter 0.5s ease,
            transform 0.5s ease;
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
        animation: arrive 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) calc(var(--i) * 110ms) backwards;
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
            translate 0.65s cubic-bezier(0.55, 0, 0.9, 0.4),
            scale 0.65s cubic-bezier(0.55, 0, 0.9, 0.4),
            opacity 0.4s ease 0.3s,
            filter 0.65s ease;
    }

    .fragment.gone {
        opacity: 0;
        filter: blur(8px);
        translate: calc(var(--dir, -1) * 4rem) 0;
        transition:
            opacity 0.45s ease,
            filter 0.45s ease,
            translate 0.6s ease-in;
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
            justify-content: safe center;
            gap: 0.7rem;
            padding: 0.5rem 1rem 1.5rem;
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

    @media (prefers-reduced-motion: reduce) {
        .slot {
            animation: none;
        }
    }
</style>
