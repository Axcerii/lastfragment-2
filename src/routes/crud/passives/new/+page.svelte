// src/routes/passives/new/+page.svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { CreatePassiveData } from '$lib/types';

  let formData: CreatePassiveData = {
    characterId: 0,
    statistics: '',
    maths: ''
  };

  let characters: any[] = [];
  let loading: boolean = false;
  let error: string = '';

  // Système de gestion des stats dynamiques
  let statsList: Array<{ stat: string; value: string }> = [
    { stat: '', value: '' }
  ];

  const commonStats = [
    'PV', 'QDF', 'Endurance', 'Force', 'Maitrise', 'Defense',
    'Vitesse', 'Accuracy', 'Perception', 'Furtivite',
    'Charisme', 'Eloquence', 'Intelligence'
  ];

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

  function addStat(): void {
    statsList = [...statsList, { stat: '', value: '' }];
  }

  function removeStat(index: number): void {
    statsList = statsList.filter((_, i) => i !== index);
  }

  function updateFormData(): void {
    formData.statistics = statsList.map(s => s.stat).filter(s => s).join(',');
    formData.maths = statsList.map(s => s.value).filter(v => v).join(',');
  }

  async function handleSubmit(): Promise<void> {
    updateFormData();

    if (!formData.characterId || !formData.statistics || !formData.maths) {
      error = 'Please fill in all required fields';
      return;
    }

    const stats = formData.statistics.split(',').filter(s => s.trim());
    const vals = formData.maths.split(',').filter(v => v.trim());
    
    if (stats.length !== vals.length) {
      error = 'Number of statistics must match number of formulas';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await fetch('/api/passives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        goto('/passives');
      } else {
        const result = await response.json();
        error = result.error || 'Failed to create passive';
      }
    } catch (err) {
      error = 'Failed to create passive';
      console.error(err);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Add New Passive</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Add New Passive</h1>
    <a href="/passives" class="btn btn-secondary">Back to Passives</a>
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
            <option value={parseInt(character.id)}>
              {character.name} - {character.race} ({character.country})
            </option>
          {/each}
        </select>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <h2>Passive Abilities</h2>
        <button type="button" class="btn btn-add" on:click={addStat}>
          + Add Ability
        </button>
      </div>

      <div class="stats-help">
        <p><strong>Common stats:</strong> {commonStats.join(', ')}</p>
        <p><small>Enter mathematical formulas for each stat (e.g., +10, *1.5, +5%, base*2)</small></p>
      </div>

      <div class="stats-list">
        {#each statsList as stat, index}
          <div class="stat-row">
            <div class="stat-number">{index + 1}</div>
            <div class="stat-inputs">
              <input
                bind:value={stat.stat}
                type="text"
                placeholder="Stat name (e.g., Defense)"
                on:input={updateFormData}
              />
              <input
                bind:value={stat.value}
                type="text"
                placeholder="Formula (e.g., +10 or *1.2)"
                on:input={updateFormData}
              />
            </div>
            {#if statsList.length > 1}
              <button type="button" class="btn-remove" on:click={() => removeStat(index)}>
                ×
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    {#if formData.statistics && formData.maths}
      <div class="preview-section">
        <h2>Preview</h2>
        <div class="passive-preview">
          <div class="preview-header">
            <span class="preview-icon">⚡</span>
            <span>Passive Ability</span>
          </div>
          <div class="preview-body">
            <div class="preview-stats">
              {#each statsList.filter(s => s.stat && s.value) as stat}
                <div class="preview-stat-chip">
                  <span>{stat.stat}</span>
                  <span class="preview-value">{stat.value}</span>
                </div>
              {/each}
            </div>
            <div class="preview-formula">
              <strong>Formula:</strong>
              <code>{formData.maths}</code>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <div class="form-actions">
      <button
        type="submit"
        class="btn btn-primary"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Passive'}
      </button>
    </div>
  </form>
</div>

<style>
  .container {
    max-width: 800px;
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

  .form-section, .preview-section {
    padding: 24px;
    border-bottom: 1px solid #e5e7eb;
  }

  .form-section:last-of-type, .preview-section:last-of-type {
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

  select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #1f2937;
    background-color: white;
    box-sizing: border-box;
  }

  select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .stats-help {
    background-color: #f0f9ff;
    border: 1px solid #bae6fd;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 16px;
  }

  .stats-help p {
    margin: 0 0 4px 0;
    font-size: 0.875rem;
    color: #0c4a6e;
  }

  .stats-help p:last-child {
    margin-bottom: 0;
  }

  .stats-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .stat-row {
    display: flex;
    align-items: center;
    gap: 12px;
    background-color: #f9fafb;
    padding: 12px;
    border-radius: 8px;
  }

  .stat-number {
    background-color: #a855f7;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  .stat-inputs {
    display: flex;
    gap: 12px;
    flex: 1;
  }

  .stat-inputs input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #1f2937;
    background-color: white;
    box-sizing: border-box;
  }

  .stat-inputs input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .btn-remove {
    background-color: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    font-size: 1.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background-color 0.2s;
  }

  .btn-remove:hover {
    background-color: #dc2626;
  }

  .btn-add {
    background-color: #10b981;
    color: white;
    padding: 8px 16px;
    font-size: 0.875rem;
  }

  .btn-add:hover {
    background-color: #059669;
  }

  .passive-preview {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border: 2px solid #a855f7;
  }

  .preview-header {
    background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
    color: white;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
  }

  .preview-icon {
    font-size: 1.5rem;
  }

  .preview-body {
    padding: 16px;
    background-color: #f9fafb;
  }

  .preview-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .preview-stat-chip {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .preview-value {
    background-color: rgba(255, 255, 255, 0.25);
    padding: 2px 8px;
    border-radius: 10px;
  }

  .preview-formula {
    background-color: #1f2937;
    padding: 12px;
    border-radius: 8px;
  }

  .preview-formula strong {
    color: white;
    font-size: 0.875rem;
    display: block;
    margin-bottom: 8px;
  }

  .preview-formula code {
    color: #22c55e;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
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
    .header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }

    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .stat-inputs {
      flex-direction: column;
      gap: 8px;
    }
  }
</style>