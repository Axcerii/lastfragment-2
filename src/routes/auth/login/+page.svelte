<script lang="ts">

	import Cta from "$lib/components/Cta.svelte";

	let login = '';
	let password = '';
	let message = '';
	let loggedIn = false;

	async function register() {
		message = '⏳ Inscription...';
		const res = await fetch('/auth/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ login, password })
		});

		const data = await res.json();
		message = data.message || data.error || 'Erreur inconnue';
	}

	async function loginf() {
		message = '⏳ Connexion...';
		const res = await fetch('/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ login, password })
		});

		const data = await res.json();

		if (res.ok) {
			message = '✅ Connecté avec succès !';
			loggedIn = true;
		} else {
			message = data.error || 'Erreur de connexion';
		}
	}

	async function logout() {
		await fetch('/api/logout', { method: 'POST' });
		loggedIn = false;
		message = '🚪 Déconnecté.';
	}

	async function checkProfile() {
		const res = await fetch('/api/profile');
		const data = await res.json();

		if (res.ok) {
			message = `👤 Profil : ${JSON.stringify(data.user)}`;
		} else {
			message = data.error || 'Erreur.';
		}
	}
</script>

<h1>🔐 Test Auth JWT + BCrypt</h1>

<form on:submit|preventDefault={register}>
	<h2>Créer un compte</h2>
	<input type="text" bind:value={login} placeholder="Nom d'utilisateur" required />
	<input type="password" bind:value={password} placeholder="Mot de passe" required />
	<Cta text="S'inscrire"/>
</form>

<hr />

<form on:submit|preventDefault={loginf}>
	<h2>Connexion</h2>
	<input type="text" bind:value={login} placeholder="Email" required />
	<input type="password" bind:value={password} placeholder="Mot de passe" required />
	<Cta text="Se connecter" dragon="Yinva" border="Artrish"/>
</form>

{#if loggedIn}
	<div style="margin-top:1rem;">
		<button on:click={checkProfile}>👤 Voir le profil</button>
		<button on:click={logout}>🚪 Se déconnecter</button>
	</div>
{/if}

<p style="margin-top:1rem; color: #555;">{message}</p>

<style>
	form {
		margin: 1rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 300px;
	}
	input, button {
		padding: 0.5rem;
		font-size: 1rem;
	}
	button {
		cursor: pointer;
	}
</style>
