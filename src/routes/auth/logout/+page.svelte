<script lang="ts">
  import { onMount } from "svelte";
  import { on } from "svelte/events";

    async function logout() {
		await fetch('/auth/logout', { method: 'POST' });
	}

    onMount(() => {
        logout();
    });
</script>