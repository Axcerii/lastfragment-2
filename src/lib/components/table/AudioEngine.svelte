<script lang="ts">
    // Joue la musique, les ambiances et les effets de la partie, calés sur l'horloge du serveur.
    // Chaque joueur règle ses propres volumes (gardés dans ce navigateur).
    import { onDestroy, onMount } from "svelte";
    import type { Ambience, MusicState } from "$lib/table/types";

    let {
        music,
        ambiences,
        clockOffset,
        volumes = $bindable({ music: 0.7, ambience: 0.7, effects: 0.8, muted: false, animations: true }),
        unlocked = $bindable(false),
        registerSfx,
    }: {
        music: MusicState | null;
        ambiences: Ambience[];
        clockOffset: number;
        volumes?: { music: number; ambience: number; effects: number; muted: boolean; animations: boolean };
        unlocked?: boolean;
        /** Reçoit la fonction qui joue un effet sonore ponctuel. */
        registerSfx: (play: (url: string) => void) => void;
    } = $props();

    const STORAGE = "lf-table-volumes";
    let player: HTMLAudioElement | null = null;
    const ambiencePlayers = new Map<string, HTMLAudioElement>();

    onMount(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE) ?? "null");
            if (saved) volumes = { ...volumes, ...saved };
        } catch {
            /* stockage indisponible : volumes par défaut */
        }
        player = new Audio();
        player.preload = "auto";
        registerSfx(playSfx);

        // Les navigateurs bloquent le son tant que la page n'a pas reçu de clic.
        const unlock = () => {
            unlocked = true;
            syncMusic();
            syncAmbiences();
        };
        window.addEventListener("pointerdown", unlock, { once: true });
        window.addEventListener("keydown", unlock, { once: true });
        return () => {
            window.removeEventListener("pointerdown", unlock);
            window.removeEventListener("keydown", unlock);
        };
    });

    onDestroy(() => {
        player?.pause();
        for (const audio of ambiencePlayers.values()) audio.pause();
        ambiencePlayers.clear();
    });

    $effect(() => {
        try {
            localStorage.setItem(STORAGE, JSON.stringify(volumes));
        } catch {
            /* rien */
        }
    });

    const gain = (value: number) => (volumes.muted ? 0 : value);

    function syncMusic() {
        if (!player) return;
        player.volume = gain(volumes.music);
        if (!music) {
            player.pause();
            player.removeAttribute("src");
            return;
        }
        const target = new URL(music.url, location.href).href;
        if (player.src !== target) player.src = music.url;
        player.loop = music.loop;

        if (!music.playing) {
            player.pause();
            return;
        }
        if (!unlocked) return;

        const position = (Date.now() + clockOffset - music.startedAt) / 1000;
        const seek = () => {
            if (!player || !music) return;
            const duration = player.duration;
            let at = position;
            if (Number.isFinite(duration) && duration > 0) {
                if (music.loop) at = position % duration;
                else if (position >= duration) return player.pause();
            }
            // On ne recale que si l'écart est sensible, pour éviter les sauts audibles.
            if (Math.abs(player.currentTime - at) > 1.5) player.currentTime = at;
            player.play().catch(() => {});
        };
        if (player.readyState >= 1) seek();
        else player.addEventListener("loadedmetadata", seek, { once: true });
    }

    function syncAmbiences() {
        const wanted = new Map(ambiences.map((a) => [a.id, a]));
        for (const [id, audio] of ambiencePlayers) {
            if (!wanted.has(id)) {
                audio.pause();
                ambiencePlayers.delete(id);
            }
        }
        for (const ambience of ambiences) {
            let audio = ambiencePlayers.get(ambience.id);
            if (!audio) {
                audio = new Audio(ambience.url);
                audio.loop = true;
                ambiencePlayers.set(ambience.id, audio);
            }
            audio.volume = gain(ambience.volume * volumes.ambience);
            if (unlocked && audio.paused) audio.play().catch(() => {});
        }
    }

    function playSfx(url: string) {
        if (!unlocked || volumes.muted) return;
        const audio = new Audio(url);
        audio.volume = volumes.effects;
        audio.play().catch(() => {});
    }

    // Toute modification de la musique, des ambiances ou des volumes resynchronise.
    $effect(() => {
        void [music?.url, music?.playing, music?.startedAt, music?.loop, volumes.music, volumes.muted, unlocked];
        syncMusic();
    });

    $effect(() => {
        void [ambiences.map((a) => `${a.id}:${a.volume}`).join(), volumes.ambience, volumes.muted, unlocked];
        syncAmbiences();
    });
</script>
