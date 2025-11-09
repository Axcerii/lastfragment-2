<script lang="ts">

	import Cta from "$lib/components/Cta.svelte";

	let login = $state('');
	let password = $state('');
	let message = $state('');
	let loggedIn = false;
	let pageName = $state(false);

	function ctaClick() {
		pageName = !pageName;
	}

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


{#if pageName}
<div class="inscription">
	<form on:submit|preventDefault={register}>
		<h2>Création de compte :</h2>
		<div>
			<label for="login">Nom d'utilisateur :</label>
			<input type="text" bind:value={login} placeholder="Serena" required name="login"/>
		</div>
		<div>
			<label for="password">Mot de passe :</label>
			<input type="password" bind:value={password} placeholder="****************" required name="password"/>
		</div>
		<div>
			<label for="password">Confirmer le mot de passe :</label>
			<input type="password" placeholder="****************" required name="password"/>
		</div>
		<Cta text="S'inscrire"/>
	</form>
	<div class="separateur">
	</div>
	<Cta text="Page de connexion" dragon="Yinva" border="Artrish" onClick={ctaClick}/>

	<img src="/dragons/tampons/Artrish.svg" alt="" class="form-image">
</div>
{:else}
<div class="connexion">
	<form on:submit|preventDefault={loginf}>
		<h2>Formulaire de connexion :</h2>
		<div>
			<label for="login">Nom d'utilisateur :</label>
			<input type="text" bind:value={login} placeholder="Lucii" name="login" required />
		</div>
		<div>
			<label for="password">Mot de passe :</label>
			<input type="password" bind:value={password} placeholder="****************" name="password" required />
		</div>
		<Cta text="Se connecter" dragon="Yinva" border="Artrish"/>
	</form>
	<div class="separateur">
	</div>
	<Cta text="Créer un compte" onClick={ctaClick}/>

	<img src="/dragons/tampons/Yinva.svg" alt="" class="form-image">
</div>
{/if}

<p style="margin-top:1rem; color: #555;">{message}</p>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		width: 100%;
	}

	.inscription, .connexion{
		position: relative;
		width: 50%;
		max-width: 675px;
		display: flex;
		flex-direction: column;
		margin: auto;
		gap: 32px;

		margin-top: 3rem;
	}

	.separateur{
		width: 50%;
		margin: auto;
		background-color: var(--foreground);
		height: 2px;
	}

	h2{
		font-size: 32px;
	}

	.form-image{
		width: 120%;
		position: absolute;
		z-index: -1;
		top: -20%;
		left: 50%;
		transform: translateX(-50%);
		opacity: 0.3;
	}

	@media only screen and (max-width: 600px) {
		.inscription, .connexion{
			width: 90%;
		}

		.form-image{
			width: 100%;
			top: 0;
		}
	}
</style>