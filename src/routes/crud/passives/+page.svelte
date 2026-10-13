// src/routes/passives/+page.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Passive } from '$lib/types';
  
  let passives: Passive[] = [];
  let loading: boolean = true;
  let error: string = '';
  let filterCharacterId: string = '';

  onMount(async () => {
    await loadPassives();
  });

  async function loadPassives(): Promise<void> {
    try {
      const url = filterCharacterId 
        ? `/api/passives?characterId=${filterCharacterId}` 
        : '/api/passives';
      
      const response = await fetch(url);
      if (response.ok) {
        passives = await response.json();
      } else {
        error = 'Failed to load passives';
      }
    } catch (err) {
      error = 'Failed to load passives';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function deletePassive(id: number | string): Promise<void> {
    if (!confirm('Are you sure you want to delete this passive?')) return;
    
    try {
      const response = await fetch(`/api/passives/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadPassives();
      } else {
        error = 'Failed to delete passive';
      }
    } catch (err) {
      error = 'Failed to delete passive';
      console.error(err);
    }
  }

  function editPassive(id: number | string): void {
    goto(`/crud/passives/${id}/edit`);
  }

  function viewPassive(id: number | string): void {
    goto(`/crud/passives/${id}`);
  }

  async function handleFilterChange(): Promise<void> {
    loading = true;
    await loadPassives();
  }

  function parseStatistics(statistics: string): string[] {
    return statistics.split(',').map(s => s.trim()).filter(s => s);
  }

  function parseMaths(maths: string): string[] {
    return maths.split(',').map(m => m.trim()).filter(m => m);
  }
</script>

<svelte:head>
  <title>Passives Management</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Passives Management</h1>
    <a href="/passives/new" class="btn btn-primary">Add New Passive</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <div class="filter-bar">
    <div class="filter-group">
      <label for="filterCharacter">Filter by Character ID:</label>
      <div class="filter-input-group">
        <input
          bind:value={filterCharacterId}
          id="filterCharacter"
          type="text"
          placeholder="Enter character ID"
        />
        <button on:click={handleFilterChange} class="btn btn-secondary">
          Filter
        </button>
        {#if filterCharacterId}
          <button on:click={() => { filterCharacterId = ''; handleFilterChange(); }} class="btn btn-clear">
            Clear
          </button>
        {/if}
      </div>
    </div>
  </div>

  {#if loading}
    <div class="loading">
      <div>Loading passives...</div>
    </div>
  {:else}
    <div class="passives-grid">
      {#each passives as passive}
        <div class="passive-card">
          <div class="passive-header">
            <div class="character-section">
              <span class="character-icon">⚡</span>
              <div>
                <div class="character-name">
                  {passive.character?.name || 'Unknown Character'}
                </div>
                <div class="character-info">
                  {passive.character?.race || 'Unknown'} - {passive.character?.country || 'Unknown'}
                </div>
              </div>
            </div>
            <div class="passive-badge">Passive</div>
          </div>

          <div class="passive-body">
            <div class="stats-section">
              <h4>Affected Statistics</h4>
              <div class="stats-chips">
                {#each parseStatistics(passive.statistics) as stat, i}
                  {@const mathValues = parseMaths(passive.maths)}
                  <div class="stat-chip">
                    <span class="stat-name">{stat}</span>
                    <span class="stat-value">{mathValues[i] || '?'}</span>
                  </div>
                {/each}
              </div>
            </div>

            <div class="formula-section">
              <h4>Formula</h4>
              <div class="formula-display">
                <code>{passive.maths}</code>
              </div>
            </div>

            <div class="passive-footer">
              <div class="passive-id">ID: {passive.id}</div>
              <div class="character-id">Character ID: {passive.characterId}</div>
            </div>
          </div>

          <div class="passive-actions">
            <button
              on:click={() => viewPassive(passive.id)}
              class="btn btn-info"
            >
              View
            </button>
            <button
              on:click={() => editPassive(passive.id)}
              class="btn btn-secondary"
            >
              Edit
            </button>
            <button
              on:click={() => deletePassive(passive.id)}
              class="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
      
      {#if passives.length === 0}
        <div class="no-data">
          <p>No passives found</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 1400px;
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

  .filter-bar {
    background: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .filter-group label {
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }

  .filter-input-group {
    display: flex;
    gap: 8px;
  }

  .filter-input-group input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
  }

  .filter-input-group input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    font-size: 1.2rem;
    color: #6b7280;
  }

  .passives-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
  }

  .passive-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 2px solid #a855f7;
  }

  .passive-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  .passive-header {
    background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
    padding: 16px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .character-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .character-icon {
    font-size: 2rem;
  }

  .character-name {
    font-weight: 600;
    font-size: 1rem;
  }

  .character-info {
    font-size: 0.75rem;
    opacity: 0.9;
  }

  .passive-badge {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .passive-body {
    padding: 16px;
  }

  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stats-section {
    margin-bottom: 16px;
  }

  .stats-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .stat-chip {
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

  .stat-name {
    opacity: 0.9;
  }

  .stat-value {
    background-color: rgba(255, 255, 255, 0.25);
    padding: 2px 8px;
    border-radius: 10px;
  }

  .formula-section {
    margin-bottom: 16px;
  }

  .formula-display {
    background-color: #1f2937;
    padding: 12px;
    border-radius: 8px;
    overflow-x: auto;
  }

  .formula-display code {
    color: #22c55e;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
  }

  .passive-footer {
    display: flex;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
  }

  .passive-id, .character-id {
    font-size: 0.75rem;
    color: #9ca3af;
    font-weight: 500;
  }

  .passive-actions {
    padding: 0 16px 16px 16px;
    display: flex;
    gap: 8px;
  }

  .no-data {
    grid-column: 1 / -1;
    text-align: center;
    padding: 60px 20px;
    color: #9ca3af;
  }

  .btn {
    display: inline-block;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    flex: 1;
    text-align: center;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background-color: #2563eb;
  }

  .btn-secondary {
    background-color: #6b7280;
    color: white;
  }

  .btn-secondary:hover {
    background-color: #4b5563;
  }

  .btn-info {
    background-color: #06b6d4;
    color: white;
  }

  .btn-info:hover {
    background-color: #0891b2;
  }

  .btn-danger {
    background-color: #ef4444;
    color: white;
  }

  .btn-danger:hover {
    background-color: #dc2626;
  }

  .btn-clear {
    background-color: #f3f4f6;
    color: #374151;
  }

  .btn-clear:hover {
    background-color: #e5e7eb;
  }

  @media (max-width: 768px) {
    .passives-grid {
      grid-template-columns: 1fr;
    }
    
    .header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }
  }
</style>