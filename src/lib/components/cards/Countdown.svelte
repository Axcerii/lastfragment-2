<script lang="ts">
    // Temps restant jusqu'à une date, mis à jour chaque seconde ; `ondone` quand il est écoulé.
    import { onDestroy } from "svelte";

    let { until, ondone }: { until: string; ondone?: () => void } = $props();

    let now = $state(Date.now());
    const timer = setInterval(() => (now = Date.now()), 1000);
    onDestroy(() => clearInterval(timer));

    let left = $derived(Math.max(0, new Date(until).getTime() - now));
    let fired = false;
    $effect(() => {
        if (left === 0 && !fired) {
            fired = true;
            ondone?.();
        }
    });

    function format(ms: number) {
        const total = Math.ceil(ms / 1000);
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;
        if (h > 24) return `${Math.floor(h / 24)} j ${h % 24} h`;
        if (h > 0) return `${h} h ${String(m).padStart(2, "0")} min`;
        return `${m} min ${String(s).padStart(2, "0")} s`;
    }
</script>

<time datetime={until}>{format(left)}</time>

<style>
    time {
        font-variant-numeric: tabular-nums;
    }
</style>
