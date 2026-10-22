<script lang="ts">
    // Météo animée dessinée sur un canvas à la taille de la partie visible du plateau.
    // Les particules vivent en coordonnées 0–1 : zoomer ou déplacer la vue ne les fait pas sauter.
    import { onMount } from "svelte";
    import type { Weather } from "$lib/table/types";

    let {
        weather,
        intensity,
        width,
        height,
    }: { weather: Weather; intensity: number; width: number; height: number } = $props();

    let canvas: HTMLCanvasElement | undefined = $state();

    interface Particle {
        x: number;
        y: number;
        speed: number;
        size: number;
        phase: number;
    }

    let particles: Particle[] = [];
    let flash = 0;
    let nextFlash = 0;

    const COUNTS: Record<Weather, number> = {
        aucune: 0,
        pluie: 420,
        orage: 650,
        neige: 260,
        vent: 70,
        brume: 9,
        braises: 140,
    };

    function spawn(): Particle {
        return {
            x: Math.random(),
            y: Math.random(),
            speed: 0.6 + Math.random() * 0.8,
            size: 0.5 + Math.random(),
            phase: Math.random() * Math.PI * 2,
        };
    }

    function reset() {
        particles = Array.from({ length: Math.round(COUNTS[weather] * intensity) }, spawn);
    }

    $effect(() => {
        void [weather, intensity];
        reset();
    });

    function step(dt: number, t: number) {
        const ctx = canvas?.getContext("2d");
        if (!ctx || !canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        const w = width;
        const h = height;

        switch (weather) {
            case "pluie":
            case "orage": {
                const slant = weather === "orage" ? 0.35 : 0.18;
                ctx.strokeStyle = "rgba(190, 210, 255, 0.45)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (const p of particles) {
                    p.y += dt * 1.6 * p.speed;
                    p.x += dt * 1.6 * p.speed * slant * (h / w);
                    if (p.y > 1) Object.assign(p, spawn(), { y: 0 });
                    if (p.x > 1) p.x -= 1;
                    const len = 14 * p.size;
                    ctx.moveTo(p.x * w, p.y * h);
                    ctx.lineTo(p.x * w - len * slant, p.y * h - len);
                }
                ctx.stroke();
                if (weather === "orage") {
                    if (t > nextFlash) {
                        flash = 0.55 + Math.random() * 0.3;
                        nextFlash = t + 4 + Math.random() * 8 * (1.2 - intensity);
                    }
                    if (flash > 0.01) {
                        ctx.fillStyle = `rgba(230, 235, 255, ${flash})`;
                        ctx.fillRect(0, 0, w, h);
                        flash *= Math.pow(0.02, dt);
                    }
                }
                break;
            }
            case "neige": {
                ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
                for (const p of particles) {
                    p.y += dt * 0.08 * p.speed;
                    p.phase += dt * 1.2;
                    if (p.y > 1) Object.assign(p, spawn(), { y: 0 });
                    const x = (p.x + Math.sin(p.phase) * 0.01) * w;
                    ctx.beginPath();
                    ctx.arc(x, p.y * h, 1.2 + p.size * 1.6, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }
            case "vent": {
                ctx.lineCap = "round";
                for (const p of particles) {
                    p.x += dt * 0.9 * p.speed;
                    p.phase += dt * 2;
                    if (p.x > 1.2) Object.assign(p, spawn(), { x: -0.2 });
                    const y = (p.y + Math.sin(p.phase) * 0.006) * h;
                    const len = 60 + 120 * p.size;
                    const gradient = ctx.createLinearGradient(p.x * w - len, y, p.x * w, y);
                    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
                    gradient.addColorStop(1, "rgba(255, 255, 255, 0.28)");
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = 1 + p.size;
                    ctx.beginPath();
                    ctx.moveTo(p.x * w - len, y);
                    ctx.lineTo(p.x * w, y);
                    ctx.stroke();
                }
                break;
            }
            case "brume": {
                for (const p of particles) {
                    p.x += dt * 0.012 * p.speed;
                    if (p.x > 1.4) p.x = -0.4;
                    const r = Math.max(w, h) * (0.25 + p.size * 0.2);
                    const g = ctx.createRadialGradient(p.x * w, p.y * h, 0, p.x * w, p.y * h, r);
                    g.addColorStop(0, `rgba(220, 225, 230, ${0.16 * intensity + 0.06})`);
                    g.addColorStop(1, "rgba(220, 225, 230, 0)");
                    ctx.fillStyle = g;
                    ctx.fillRect(0, 0, w, h);
                }
                break;
            }
            case "braises": {
                for (const p of particles) {
                    p.y -= dt * 0.07 * p.speed;
                    p.phase += dt * 3;
                    if (p.y < 0) Object.assign(p, spawn(), { y: 1 });
                    const x = (p.x + Math.sin(p.phase * 0.5) * 0.008) * w;
                    const alpha = 0.5 + Math.sin(p.phase) * 0.35;
                    ctx.fillStyle = `rgba(255, ${120 + Math.round(p.size * 60)}, 40, ${alpha})`;
                    ctx.shadowColor = "rgba(255, 120, 30, 0.9)";
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(x, p.y * h, 1 + p.size * 1.3, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.shadowBlur = 0;
                break;
            }
        }
    }

    onMount(() => {
        // Respecte le réglage « réduire les animations » du système.
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        let frame = 0;
        let last = performance.now();
        const loop = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            step(dt, now / 1000);
            frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frame);
    });
</script>

<canvas bind:this={canvas} style="width: {width}px; height: {height}px;" aria-hidden="true"></canvas>

<style>
    canvas {
        display: block;
        pointer-events: none;
    }
</style>
