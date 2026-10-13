<script lang="ts">
	import { enhance } from "$app/forms";
	import Cta from "$lib/components/Cta.svelte";

	let { form } = $props();

	let registering = $state(form?.mode === "register");
	let login = $state(form?.login ?? "");
</script>

<svelte:head>
	<title>{registering ? "Création de compte" : "Connexion"} : Last Fragment</title>
</svelte:head>

{#if registering}
	<div class="inscription">
		<form method="POST" action="?/register" use:enhance>
			<h2>Création de compte :</h2>
			<div>
				<label for="login">Nom d'utilisateur :</label>
				<input
					type="text"
					bind:value={login}
					placeholder="Serena"
					required
					id="login"
					name="login"
					autocomplete="username"
				/>
			</div>
			<div>
				<label for="password">Mot de passe :</label>
				<input
					type="password"
					placeholder="****************"
					required
					id="password"
					name="password"
					autocomplete="new-password"
				/>
			</div>
			<div>
				<label for="password-confirm">Confirmer le mot de passe :</label>
				<input
					type="password"
					placeholder="****************"
					required
					id="password-confirm"
					name="passwordConfirm"
					autocomplete="new-password"
				/>
			</div>
			{#if form?.error}
				<p class="message-error" role="alert">{form.error}</p>
			{/if}
			<Cta text="S'inscrire" />
		</form>
		<div class="separateur"></div>
		<Cta
			text="Page de connexion"
			dragon="Yinva"
			border="Artrish"
			onClick={() => (registering = false)}
		/>

		<img src="/dragons/tampons/Artrish.svg" alt="" class="form-image" />
	</div>
{:else}
	<div class="connexion">
		<form method="POST" action="?/login" use:enhance>
			<h2>Formulaire de connexion :</h2>
			<div>
				<label for="login">Nom d'utilisateur :</label>
				<input
					type="text"
					bind:value={login}
					placeholder="Lucii"
					id="login"
					name="login"
					autocomplete="username"
					required
				/>
			</div>
			<div>
				<label for="password">Mot de passe :</label>
				<input
					type="password"
					placeholder="****************"
					id="password"
					name="password"
					autocomplete="current-password"
					required
				/>
			</div>
			{#if form?.error}
				<p class="message-error" role="alert">{form.error}</p>
			{/if}
			<Cta text="Se connecter" dragon="Yinva" border="Artrish" />
		</form>
		<div class="separateur"></div>
		<Cta text="Créer un compte" onClick={() => (registering = true)} />

		<img src="/dragons/tampons/Yinva.svg" alt="" class="form-image" />
	</div>
{/if}

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		width: 100%;
	}

	.inscription,
	.connexion {
		position: relative;
		width: 50%;
		max-width: 675px;
		display: flex;
		flex-direction: column;
		margin: auto;
		gap: 32px;

		margin-top: 3rem;
	}

	.separateur {
		width: 50%;
		margin: auto;
		background-color: var(--foreground);
		height: 2px;
	}

	h2 {
		font-size: 32px;
	}

	.form-image {
		width: 120%;
		position: absolute;
		z-index: -1;
		top: -20%;
		left: 50%;
		transform: translateX(-50%);
		opacity: 0.3;
	}

	@media only screen and (max-width: 600px) {
		.inscription,
		.connexion {
			width: 90%;
		}

		.form-image {
			width: 100%;
			top: 0;
		}
	}
</style>
