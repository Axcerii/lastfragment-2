<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { CreateStatisticData, Character } from '$lib/types';

  let formData: CreateStatisticData = {
    characterId: 0,
    qdf: 50,
    pv: 100,
    endurance: 50,
    strength: 50,
    maitrise: 50,
    defense: 50,
    vitesse: 50,
    accuracy: 50,
    perception: 50,
    furtivite: 50,
    charisme: 50,
    eloquence: 50,
    intelligence: 50
  };

  let characters: Character[] = [];
  let loading: boolean = false;
  let error: string = '';

  onMount(async () => {
    await loadCharacters();
  });

  async function loadCharacters(): Promise<void> {
    try {
      const response = await fetch('/api/characters');
      if (response.ok) {
        characters = await response.json();
      }
    } catch (err) {
      console.error('Failed to load characters:', err);
    }
  }

  async function handleSubmit(): Promise<void> {
    if (!formData.characterId) {
      error = 'Please select a character';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await fetch('/api/statistics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        goto('/statistics');
      } else {
        const result = await response.json();
        error = result.error || 'Failed to create statistic';
      }
    } catch (err) {
      error = 'Failed to create statistic';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function getStatTotal(): number {
    return Object.entries(formData)
      .filter(([key]) => key !== 'characterId')
      .reduce((sum, [_, value]) => sum + (value as number), 0);
  }
</script>

<svelte:head>
  <title>Add New Statistic</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Add New Statistic</h1>
    <a href="/statistics" class="btn btn-secondary">Back to Statistics</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="form">
    <div class="form-section">
      <h2>Character Selection</h2>
      
      <div class="form-group">
        <label for="characterId">Character *</label>
        <select bind:value={formData.characterId} id="characterId" required>
          <option value={0}>Select a character</option>
          {#each characters as character}
            <option value={parseInt(character.id)}>{character.name} (ID: {character.id})</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <h2>Statistics</h2>
        <div class="total-badge">Total: {getStatTotal()}</div>
      </div>

      <div class="stats-grid">
        <div class="form-group">
          <label for="qdf">QDF</label>
          <input
            bind:value={formData.qdf}
            id="qdf"
            type="number"
            min="0"
            required
          />
        </div>

        <div class="form-group">
          <label for="pv">PV</label>
          <input
            bind:value={formData.pv}
            id="pv"
            type="number"
            min="0"
            required
          />
        </div>

        <div class="form-group">
          <label for="endurance">Endurance</label>
          <input
            bind:value={formData.endurance}
            id="endurance"
            type="number"
            min="0"
            required
          />
        </div>

        <div class="form-group">
          <label for="strength">Strength</label>
          <input
            bind:value={formData.strength}
            id="strength"
            type="number"
            min="0"
            required
          />
        </div>

        <div class="form-group">
          <label for="maitrise">Maîtrise</label>
          <input
            bind:value={formData.maitrise}
            id="maitrise"
            type="number"
            min="0"
            required
          />
        </div>

        <div class="form-group">
          <label for="defense">Defense</label>
          <input
            bind:value={formData.defense}
            id="defense"
            type="number"
            min="0"
            required
          />
        </div>

        <div class="form-group">
          <label for="vitesse">Vitesse</label>
          <input
            bind:value={formData.vitesse}
            id="vitesse"
            type="number"
            min="0"
            required
          />
        </div>

        <div class="form-group">
          <label for="accuracy">Accuracy</label>
          <input
            bind:value={formData.accuracy}
            id="accuracy"
            type="number"
            min="0"
            required
          />
        </div>

        <div class="form-group">
          <label for="perception">Perception</label>
          <input
            bind:value={formData.perception}
            id="perception"
            type="number"
            min="0"
            required
          />
        </div>

        <div class="form-group">
          <label for="furtivite">Furtivité</label>
          <input
            bind:value={formData.furtivite}
            id="furtivite"
            type="number"
            min="0"
            required
          />
        </div>

        <div class="form-group">
          <label for="charisme">Charisme</label>
          <input
            bind:value={formData.charisme}
            id="charisme"
            type="number"
            min="0"
            required
          />
        </div>

        <div class="form-group">
          <label for="eloquence">Éloquence</label>
          <input
            bind:value={formData.eloquence}
            id="eloquence"
            type="number"
            min="0"
            required
          />
        </div>

        <div class="form-group">
          <label for="intelligence">Intelligence</label>
          <input
            bind:value={formData.intelligence}
            id="intelligence"
            type="number"
            min="0"
            required
          />
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button
        type="submit"
        class="btn btn-primary"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Statistic'}
      </button>
    </div>
  </form>
</div>

<style>
  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  h1 {
    font-size: 2rem;
    font-weight: bold;
    margin: 0;
    color: #1f2937;
  }

  .error-message {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 16px;
  }

  .form {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .form-section {
    padding: 24px;
    border-bottom: 1px solid #e5e7eb;
  }

  .form-section:last-child {
    border-bottom: none;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .total-badge {
    background-color: #3b82f6;
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  label {
    display: block;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
    font-size: 0.875rem;
  }

  input, select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #1f2937;
    background-color: white;
    box-sizing: border-box;
  }

  input:focus, select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-actions {
    padding: 24px;
    background-color: #f9fafb;
    display: flex;
    justify-content: flex-start;
  }

  .btn {
    display: inline-block;
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .btn-primary:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }

  .btn-secondary {
    background-color: #6b7280;
    color: white;
  }

  .btn-secondary:hover {
    background-color: #4b5563;
  }

  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
    
    .header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }

    .section-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }
  }
</style>