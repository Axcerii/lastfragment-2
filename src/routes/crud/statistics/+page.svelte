<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Statistic } from '$lib/types';
  
  let statistics: Statistic[] = [];
  let loading: boolean = true;
  let error: string = '';
  let filterCharacterId: string = '';

  onMount(async () => {
    await loadStatistics();
  });

  async function loadStatistics(): Promise<void> {
    try {
      const url = filterCharacterId 
        ? `/api/statistics?characterId=${filterCharacterId}` 
        : '/api/statistics';
      
      const response = await fetch(url);
      if (response.ok) {
        statistics = await response.json();
      } else {
        error = 'Failed to load statistics';
      }
    } catch (err) {
      error = 'Failed to load statistics';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function deleteStatistic(id: number | string): Promise<void> {
    if (!confirm('Are you sure you want to delete this statistic?')) return;
    
    try {
      const response = await fetch(`/api/statistics/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadStatistics();
      } else {
        error = 'Failed to delete statistic';
      }
    } catch (err) {
      error = 'Failed to delete statistic';
      console.error(err);
    }
  }

  function editStatistic(id: number | string): void {
    goto(`/crud/statistics/${id}/edit`);
  }

  function viewStatistic(id: number | string): void {
    goto(`/crud/statistics/${id}`);
  }

  async function handleFilterChange(): Promise<void> {
    loading = true;
    await loadStatistics();
  }

  function getStatTotal(stat: Statistic): number {
    return [
      stat.qdf, stat.pv, stat.endurance, stat.strength, stat.maitrise,
      stat.defense, stat.vitesse, stat.accuracy, stat.perception,
      stat.furtivite, stat.charisme, stat.eloquence, stat.intelligence
    ].reduce((sum, val) => sum + (Number(val) || 0), 0);
  }

  function getStatColor(value: number): string {
    if (value >= 80) return '#22c55e';
    if (value >= 60) return '#3b82f6';
    if (value >= 40) return '#f59e0b';
    return '#ef4444';
  }
</script>

<svelte:head>
  <title>Statistics Management</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Statistics Management</h1>
    <a href="/crud/statistics/new" class="btn btn-primary">Add New Statistic</a>
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
      <div>Loading statistics...</div>
    </div>
  {:else}
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Character</th>
            <th>QDF</th>
            <th>PV</th>
            <th>Endurance</th>
            <th>Strength</th>
            <th>Maîtrise</th>
            <th>Defense</th>
            <th>Vitesse</th>
            <th>Accuracy</th>
            <th>Perception</th>
            <th>Furtivité</th>
            <th>Charisme</th>
            <th>Éloquence</th>
            <th>Intelligence</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each statistics as statistic}
            <tr>
              <td>{statistic.id}</td>
              <td>
                {#if statistic.character}
                  <strong>{statistic.character.name}</strong>
                  <div class="character-id">ID: {statistic.characterId}</div>
                {:else}
                  <span class="no-data">Unknown</span>
                {/if}
              </td>
              <td><span class="stat-value" style="color: {getStatColor(statistic.qdf)}">{statistic.qdf}</span></td>
              <td><span class="stat-value" style="color: {getStatColor(statistic.pv)}">{statistic.pv}</span></td>
              <td><span class="stat-value" style="color: {getStatColor(statistic.endurance)}">{statistic.endurance}</span></td>
              <td><span class="stat-value" style="color: {getStatColor(statistic.strength)}">{statistic.strength}</span></td>
              <td><span class="stat-value" style="color: {getStatColor(statistic.maitrise)}">{statistic.maitrise}</span></td>
              <td><span class="stat-value" style="color: {getStatColor(statistic.defense)}">{statistic.defense}</span></td>
              <td><span class="stat-value" style="color: {getStatColor(statistic.vitesse)}">{statistic.vitesse}</span></td>
              <td><span class="stat-value" style="color: {getStatColor(statistic.accuracy)}">{statistic.accuracy}</span></td>
              <td><span class="stat-value" style="color: {getStatColor(statistic.perception)}">{statistic.perception}</span></td>
              <td><span class="stat-value" style="color: {getStatColor(statistic.furtivite)}">{statistic.furtivite}</span></td>
              <td><span class="stat-value" style="color: {getStatColor(statistic.charisme)}">{statistic.charisme}</span></td>
              <td><span class="stat-value" style="color: {getStatColor(statistic.eloquence)}">{statistic.eloquence}</span></td>
              <td><span class="stat-value" style="color: {getStatColor(statistic.intelligence)}">{statistic.intelligence}</span></td>
              <td><strong>{getStatTotal(statistic)}</strong></td>
              <td class="actions">
                <button
                  on:click={() => viewStatistic(statistic.id)}
                  class="btn btn-info"
                >
                  View
                </button>
                <button
                  on:click={() => editStatistic(statistic.id)}
                  class="btn btn-secondary"
                >
                  Edit
                </button>
                <button
                  on:click={() => deleteStatistic(statistic.id)}
                  class="btn btn-danger"
                >
                  Delete
                </button>
              </td>
            </tr>
          {/each}
          {#if statistics.length === 0}
            <tr>
              <td colspan="17" class="no-data-row">
                No statistics found
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 1600px;
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

  .table-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 1400px;
  }

  th {
    background-color: #f9fafb;
    padding: 12px 8px;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #e5e7eb;
    white-space: nowrap;
  }

  td {
    padding: 12px 8px;
    text-align: left;
    font-size: 0.875rem;
    color: #1f2937;
    border-bottom: 1px solid #e5e7eb;
  }

  tr:hover {
    background-color: #f9fafb;
  }

  .character-id {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .stat-value {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .no-data {
    color: #9ca3af;
    font-style: italic;
  }

  .no-data-row {
    text-align: center;
    color: #9ca3af;
    font-style: italic;
    padding: 32px;
  }

  .actions {
    white-space: nowrap;
  }

  .btn {
    display: inline-block;
    padding: 6px 12px;
    margin: 0 2px;
    border: none;
    border-radius: 4px;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    white-space: nowrap;
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
    .header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }
  }
</style>