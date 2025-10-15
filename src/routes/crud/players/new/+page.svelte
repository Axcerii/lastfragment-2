<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  interface Character {
    id: string;
    name: string;
  }

  let login = '';
  let password = '';
  let role = '';
  let team = '';
  let characterId = '';
  let characters: Character[] = [];
  let loading = false;
  let error = '';

  onMount(async () => {
    // Charger les personnages disponibles
    try {
      const response = await fetch('/api/characters');
      if (response.ok) {
        characters = await response.json();
      }
    } catch (err) {
      console.error('Failed to load characters:', err);
    }
  });

  async function handleSubmit() {
    if (!login || !password || !role || !team) {
      error = 'Please fill in all required fields';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          login,
          password,
          role: parseInt(role),
          team: parseInt(team),
          characterId: characterId || null
        })
      });

      if (response.ok) {
        goto('/players');
      } else {
        const result = await response.json();
        error = result.error || 'Failed to create player';
      }
    } catch (err) {
      error = 'Failed to create player';
      console.error(err);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Add New Player</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Add New Player</h1>
    <a href="/players" class="back-btn">
      Back to Players
    </a>
  </div>

  {#if error}
    <div class="error">
      {error}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="form">
    <div class="form-group">
      <label for="login">Login *</label>
      <input
        bind:value={login}
        id="login"
        type="text"
        placeholder="Enter login"
        required
      />
    </div>

    <div class="form-group">
      <label for="password">Password *</label>
      <input
        bind:value={password}
        id="password"
        type="password"
        placeholder="Enter password"
        required
      />
    </div>

    <div class="form-group">
      <label for="role">Role *</label>
      <input
        bind:value={role}
        id="role"
        type="number"
        placeholder="Enter role"
        required
      />
    </div>

    <div class="form-group">
      <label for="team">Team *</label>
      <input
        bind:value={team}
        id="team"
        type="number"
        placeholder="Enter team"
        required
      />
    </div>

    <div class="form-group">
      <label for="characterId">Character (optional)</label>
      <select bind:value={characterId} id="characterId">
        <option value="">Select a character (optional)</option>
        {#each characters as character}
          <option value={character.id}>{character.name}</option>
        {/each}
      </select>
    </div>

    <div class="form-actions">
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Player'}
      </button>
    </div>
  </form>
</div>

<style>
  .container {
    max-width: 42rem; /* ~max-w-2xl */
    margin: 0 auto;
    padding: 1.5rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .header h1 {
    font-size: 1.875rem;
    font-weight: bold;
  }

  .back-btn {
    background-color: #6b7280;
    color: #fff;
    font-weight: bold;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    text-decoration: none;
    transition: background-color 0.2s ease;
  }

  .back-btn:hover {
    background-color: #374151;
  }

  .error {
    background-color: #fee2e2;
    border: 1px solid #f87171;
    color: #b91c1c;
    padding: 0.75rem 1rem;
    border-radius: 0.25rem;
    margin-bottom: 1rem;
  }

  .form {
    background-color: #fff;
    border-radius: 0.5rem;
    padding: 1.5rem 2rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: bold;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    color: #374151;
    font-size: 0.875rem;
    line-height: 1.25rem;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    outline: none;
    transition: box-shadow 0.2s ease;
  }

  .form-group input:focus,
  .form-group select:focus {
    box-shadow: 0 0 0 2px rgba(59,130,246,0.5);
    border-color: #3b82f6;
  }

  .form-actions {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }

  .form-actions button {
    background-color: #3b82f6;
    color: #fff;
    font-weight: bold;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s ease, box-shadow 0.2s ease;
  }

  .form-actions button:hover {
    background-color: #1d4ed8;
  }

  .form-actions button:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59,130,246,0.5);
  }

  .form-actions button:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }
</style>