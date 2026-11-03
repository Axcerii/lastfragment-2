<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import * as THREE from "three";
    import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
    import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
    import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
    import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
    import { QUESTIONS } from "$lib/flux/quiz-data";

    // Le test de flux : un fil de lumière avance dans le vide. À chaque question il se divise en
    // autant de branches que de réponses ; la caméra suit celle qu'on choisit.
    let { color, onFinish }: { color: string; onFinish: (answers: number[]) => void } = $props();

    const LETTERS = "ABCDEF";
    // Distance entre deux questions, le long du fil.
    const SEG = 9;
    const CAMERA_OFFSET = new THREE.Vector3(0, 1.1, -5.5);
    const MOVE_MS = 1700;
    const GROW_MS = 700;
    const BLOOM = 0.75;
    const HALO = 0.12;

    let index = $state(0);
    let answers: number[] = [];
    let phase = $state<"choosing" | "moving" | "ending">("choosing");
    let hovered = $state<number | null>(null);
    let markers = $state<{ x: number; y: number; visible: boolean }[]>([]);
    let gl = $state(true);
    let flash = $state(false);

    let stage: HTMLElement;
    let canvas: HTMLCanvasElement;
    let question = $derived(QUESTIONS[index]);

    // Fonctions branchées par la scène 3D une fois créée.
    let choose3d: ((k: number) => void) | null = null;

    function choose(k: number) {
        if (phase !== "choosing") return;
        answers.push(k);
        if (choose3d) return choose3d(k);
        // Sans WebGL : simple suite de questions.
        if (index + 1 >= QUESTIONS.length) onFinish(answers);
        else index++;
    }

    onMount(() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        // Un peu en dessous de la couleur pleine : le blanc des géants saturerait le halo.
        const tint = new THREE.Color(color).multiplyScalar(0.8);

        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
        } catch {
            gl = false;
            return;
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        // Noir pur : le passage en sRGB de la sortie éclaircirait tout autre fond sombre.
        renderer.setClearColor(0x000000);

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.03);
        const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 250);

        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        // Seuil au-dessus du fond : seuls le fil et ses perles rayonnent.
        const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), BLOOM, 0.05, 0.3);
        composer.addPass(bloom);
        composer.addPass(new OutputPass());

        const disposables: { dispose(): void }[] = [];
        const keep = <T extends { dispose(): void }>(d: T) => (disposables.push(d), d);

        // Poussière d'étoiles tout le long du chemin. Elle suit la caméra de côté et garde ses
        // distances avec elle : une particule collée à l'objectif couvrirait tout l'écran.
        const DUST = 2600;
        const dust = new Float32Array(DUST * 3);
        const length = (QUESTIONS.length + 3) * SEG;
        for (let i = 0; i < DUST; i++) {
            let x: number, y: number;
            do {
                x = (Math.random() - 0.5) * 60;
                y = (Math.random() - 0.5) * 30;
            } while (Math.abs(x) < 3 && Math.abs(y) < 2.5);
            dust[i * 3] = x;
            dust[i * 3 + 1] = y;
            dust[i * 3 + 2] = Math.random() * (length + 40) - 20;
        }
        const dustGeometry = keep(new THREE.BufferGeometry());
        dustGeometry.setAttribute("position", new THREE.BufferAttribute(dust, 3));
        const dustMaterial = keep(
            new THREE.PointsMaterial({
                color: tint.clone().lerp(new THREE.Color(0xffffff), 0.6),
                size: 0.07,
                transparent: true,
                opacity: 0.55,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            }),
        );
        const dustPoints = new THREE.Points(dustGeometry, dustMaterial);
        scene.add(dustPoints);

        // Un brin du fil : un cœur vif et un halo, plus une perle au bout.
        type Strand = {
            core: THREE.Mesh;
            halo: THREE.Mesh;
            orb: THREE.Mesh;
            curve: THREE.CubicBezierCurve3;
            end: THREE.Vector3;
            total: number;
            fading?: number;
        };

        const sphere = keep(new THREE.SphereGeometry(0.16, 16, 16));

        function strand(from: THREE.Vector3, to: THREE.Vector3): Strand {
            const curve = new THREE.CubicBezierCurve3(
                from.clone(),
                from.clone().add(new THREE.Vector3(0, 0, SEG * 0.4)),
                to.clone().add(new THREE.Vector3(0, 0, -SEG * 0.4)),
                to.clone(),
            );
            const material = (opacity: number) =>
                new THREE.MeshBasicMaterial({
                    color: tint,
                    transparent: true,
                    opacity,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending,
                });
            const core = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.035, 6), material(1));
            const halo = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.13, 8), material(HALO));
            const orb = new THREE.Mesh(sphere, material(1));
            orb.position.copy(to);
            orb.scale.setScalar(0.001);
            scene.add(core, halo, orb);
            const total = core.geometry.index!.count;
            core.geometry.setDrawRange(0, 0);
            halo.geometry.setDrawRange(0, 0);
            return { core, halo, orb, curve, end: to.clone(), total };
        }

        function grow(s: Strand, p: number) {
            const count = Math.floor(s.total * p);
            s.core.geometry.setDrawRange(0, count);
            s.halo.geometry.setDrawRange(0, Math.floor(s.halo.geometry.index!.count * p));
            s.orb.scale.setScalar(Math.max(0.001, (p - 0.8) * 5));
        }

        function remove(s: Strand) {
            scene.remove(s.core, s.halo, s.orb);
            for (const m of [s.core, s.halo]) {
                m.geometry.dispose();
                (m.material as THREE.Material).dispose();
            }
            (s.orb.material as THREE.Material).dispose();
        }

        // Largeur visible devant la caméra, pour écarter les branches sans qu'elles sortent de l'écran.
        function spread(n: number) {
            const depth = SEG - CAMERA_OFFSET.z;
            const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * depth * camera.aspect;
            return n > 1 ? Math.min(3.2, (half * 1.5) / (n - 1)) : 0;
        }

        let node = new THREE.Vector3(0, 0, 0);
        let branches: Strand[] = [];
        const trail: Strand[] = [];
        let growStart = 0;

        function spawn(n: number) {
            const gap = spread(n);
            branches = Array.from({ length: n }, (_, k) => {
                // La caméra regarde vers +z : les x positifs sont à gauche de l'écran.
                const offset = ((n - 1) / 2 - k) * gap;
                const lift = (Math.random() - 0.5) * 1.2 - Math.abs(offset) * 0.08;
                return strand(node, node.clone().add(new THREE.Vector3(offset, lift, SEG)));
            });
            growStart = performance.now();
        }

        const restPosition = (p: THREE.Vector3) => p.clone().add(CAMERA_OFFSET);
        const restTarget = (p: THREE.Vector3) => p.clone().add(new THREE.Vector3(0, 0.2, SEG));
        const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

        camera.position.copy(restPosition(node));
        const look = restTarget(node);
        camera.lookAt(look);

        let move: { strand: Strand; start: number; from: THREE.Vector3; last: boolean } | null = null;
        let ending: { start: number; core: THREE.Mesh } | null = null;

        choose3d = (k: number) => {
            const chosen = branches[k];
            grow(chosen, 1);
            for (const s of branches) if (s !== chosen) s.fading = performance.now();
            trail.push(chosen);
            const last = index + 1 >= QUESTIONS.length;
            move = { strand: chosen, start: performance.now(), from: node.clone(), last };
            phase = last ? "ending" : "moving";
            hovered = null;
        };

        function arrive() {
            const s = move!.strand;
            node = s.end.clone();
            branches = branches.filter((b) => b !== s);
            // On ne garde que la fin du fil derrière soi.
            while (trail.length > 4) remove(trail.shift()!);
            if (move!.last) {
                // Le fil se jette dans une lumière, puis le résultat apparaît.
                const material = keep(
                    new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }),
                );
                const core = new THREE.Mesh(keep(new THREE.SphereGeometry(1.4, 32, 32)), material);
                core.position.copy(node).add(new THREE.Vector3(0, 0.2, SEG));
                scene.add(core);
                ending = { start: performance.now(), core };
                move = null;
                return;
            }
            move = null;
            index++;
            spawn(QUESTIONS[index].answers.length);
            phase = "choosing";
        }

        function resize() {
            const { width, height } = stage.getBoundingClientRect();
            renderer.setSize(width, height, false);
            composer.setSize(width, height);
            bloom.setSize(width, height);
            camera.aspect = width / Math.max(height, 1);
            camera.updateProjectionMatrix();
        }
        const observer = new ResizeObserver(resize);
        observer.observe(stage);
        resize();

        spawn(QUESTIONS[0].answers.length);

        const projected = new THREE.Vector3();
        let frame = 0;
        function loop(now: number) {
            frame = requestAnimationFrame(loop);

            // Pousse des branches de la question en cours.
            const g = reduced ? 1 : Math.min(1, (now - growStart) / GROW_MS);
            for (const s of branches) if (!s.fading) grow(s, g);

            // Branches non choisies : elles s'éteignent puis disparaissent.
            for (const s of [...branches]) {
                if (!s.fading) continue;
                const f = Math.min(1, (now - s.fading) / 500);
                (s.core.material as THREE.MeshBasicMaterial).opacity = 1 - f;
                (s.halo.material as THREE.MeshBasicMaterial).opacity = HALO * (1 - f);
                (s.orb.material as THREE.MeshBasicMaterial).opacity = 1 - f;
                if (f >= 1) {
                    remove(s);
                    branches = branches.filter((b) => b !== s);
                }
            }

            // Branche survolée : plus vive.
            branches.forEach((s, k) => {
                if (s.fading) return;
                const on = k === hovered;
                (s.halo.material as THREE.MeshBasicMaterial).opacity = on ? HALO * 2.5 : HALO;
                if (g >= 1) s.orb.scale.setScalar(on ? 1.7 : 1);
            });

            if (move) {
                const t = reduced ? 1 : Math.min(1, (now - move.start) / MOVE_MS);
                const e = ease(t);
                camera.position.copy(move.strand.curve.getPoint(e)).add(CAMERA_OFFSET);
                look.lerpVectors(restTarget(move.from), restTarget(move.strand.end), e);
                camera.lookAt(look);
                if (t >= 1) arrive();
            } else if (ending) {
                const t = reduced ? 1 : Math.min(1, (now - ending.start) / 1800);
                const e = ease(t);
                camera.position.copy(restPosition(node)).add(new THREE.Vector3(0, -0.6 * e, SEG * 0.95 * e));
                ending.core.scale.setScalar(1 + e * 2);
                bloom.strength = BLOOM + e * 2.5;
                if (t > 0.55) flash = true;
                if (t >= 1) {
                    ending = null;
                    setTimeout(() => onFinish(answers), reduced ? 0 : 500);
                }
            } else {
                // Léger flottement au repos.
                const sway = reduced ? 0 : Math.sin(now / 1600) * 0.08;
                camera.position.copy(restPosition(node)).add(new THREE.Vector3(sway, sway * 0.6, 0));
                camera.lookAt(look);
            }

            // Repères cliquables au bout de chaque branche.
            const rect = stage.getBoundingClientRect();
            markers = branches.map((s) => {
                projected.copy(s.end).project(camera);
                return {
                    x: ((projected.x + 1) / 2) * rect.width,
                    y: ((1 - projected.y) / 2) * rect.height,
                    visible: !s.fading && projected.z < 1 && g > 0.85 && phase === "choosing",
                };
            });

            dustPoints.position.set(camera.position.x, camera.position.y, 0);
            composer.render();
        }
        frame = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            for (const s of [...branches, ...trail]) remove(s);
            for (const d of disposables) d.dispose();
            composer.dispose();
            renderer.dispose();
            choose3d = null;
        };
    });
</script>

<div class="journey" style="--c: {color};">
    <div class="stage" bind:this={stage} class:flat={!gl}>
        <canvas bind:this={canvas} aria-hidden="true"></canvas>

        <div class="hud">
            <span>Question {Math.min(index + 1, QUESTIONS.length)} / {QUESTIONS.length}</span>
            <div class="bar"><div style="width: {(answers.length / QUESTIONS.length) * 100}%;"></div></div>
        </div>

        {#key index}
            <h2 class="question" in:fade={{ duration: 500, delay: 200 }}>{question.text}</h2>
        {/key}

        {#each markers as m, k (k)}
            {#if m.visible}
                <button
                    class="marker"
                    class:hot={hovered === k}
                    style="left: {m.x}px; top: {m.y}px;"
                    onclick={() => choose(k)}
                    onpointerenter={() => (hovered = k)}
                    onpointerleave={() => (hovered = null)}
                    aria-label="Réponse {LETTERS[k]}"
                    transition:fade={{ duration: 200 }}
                >
                    {LETTERS[k]}
                </button>
            {/if}
        {/each}

        <div class="flash" class:on={flash} aria-hidden="true"></div>
    </div>

    {#key index}
        <ol class="answers" class:busy={phase !== "choosing"} in:fade={{ duration: 400, delay: gl ? 500 : 0 }}>
            {#each question.answers as answer, k (k)}
                <li>
                    <button
                        class:hot={hovered === k}
                        disabled={phase !== "choosing"}
                        onclick={() => choose(k)}
                        onpointerenter={() => (hovered = k)}
                        onpointerleave={() => (hovered = null)}
                        onfocus={() => (hovered = k)}
                        onblur={() => (hovered = null)}
                    >
                        <span class="letter">{LETTERS[k]}</span>
                        <span>{answer.text}</span>
                    </button>
                </li>
            {/each}
        </ol>
    {/key}
</div>

<style>
    .journey {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
    }

    .stage {
        position: relative;
        height: min(60svh, 36rem);
        overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--c) 40%, transparent);
        border-radius: var(--radius);
        background: #060608;
        box-shadow: 0 0 30px color-mix(in srgb, var(--c) 18%, transparent);
    }

    .stage.flat {
        height: auto;
        min-height: 12rem;
    }

    canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
    }

    .flat canvas {
        display: none;
    }

    .hud {
        position: absolute;
        top: 0.8rem;
        left: 1rem;
        right: 1rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.6);
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
        box-shadow: 0 0 6px var(--c);
        transition: width 0.6s ease;
    }

    .question {
        position: absolute;
        top: 2.4rem;
        left: 50%;
        width: min(90%, 40rem);
        transform: translateX(-50%);
        font-size: clamp(1.3rem, 3.2vw, 2rem);
        line-height: 1.2;
        text-align: center;
        text-shadow: 0 0 14px #000, 0 0 4px #000;
        pointer-events: none;
    }

    .flat .question {
        position: static;
        transform: none;
        margin: 3rem auto 1.5rem;
    }

    .marker {
        position: absolute;
        width: 2.2rem;
        height: 2.2rem;
        transform: translate(-50%, calc(-50% - 1.8rem));
        display: grid;
        place-items: center;
        border: 1px solid var(--c);
        border-radius: 50%;
        background: rgba(6, 6, 8, 0.75);
        color: var(--c);
        font-family: var(--titleFont);
        font-size: 1.1rem;
        transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
    }

    .marker.hot,
    .marker:hover {
        transform: translate(-50%, calc(-50% - 1.8rem)) scale(1.15);
        box-shadow: 0 0 14px var(--c);
    }

    .flash {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle, #fff, var(--c) 45%, #060608 100%);
        opacity: 0;
        transition: opacity 1s ease;
        pointer-events: none;
    }

    .flash.on {
        opacity: 1;
    }

    .answers {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
        gap: 0.6rem;
        transition: opacity 0.4s ease;
    }

    .answers.busy {
        opacity: 0.35;
    }

    .answers button {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        width: 100%;
        height: 100%;
        padding: 0.7rem 0.9rem;
        text-align: left;
        font-size: 0.95rem;
        line-height: 1.3;
        color: var(--foreground);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: var(--radius);
        background: rgba(12, 12, 14, 0.9);
        transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
    }

    .answers button.hot:not(:disabled) {
        border-color: var(--c);
        box-shadow: 0 0 12px color-mix(in srgb, var(--c) 45%, transparent);
    }

    .letter {
        flex-shrink: 0;
        display: grid;
        place-items: center;
        width: 1.8rem;
        height: 1.8rem;
        border: 1px solid var(--c);
        border-radius: 50%;
        color: var(--c);
        font-family: var(--titleFont);
    }

    @media (max-width: 700px) {
        .stage {
            height: 46svh;
        }

        .question {
            font-size: 1.15rem;
        }

        /* Sous les perles, pour laisser la place à la question. */
        .marker,
        .marker.hot,
        .marker:hover {
            transform: translate(-50%, calc(-50% + 1.6rem));
        }
    }
</style>
