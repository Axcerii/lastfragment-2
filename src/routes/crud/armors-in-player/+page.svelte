<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { ArmorInPlayer } from '$lib/types';
  
  let armorsInPlayer: ArmorInPlayer[] = [];
  let loading: boolean = true;
  let error: string = '';
  let filterPlayerId: string = '';
  let filterArmorId: string = '';

  onMount(async () => {
    await loadArmorsInPlayer();
  });

  async function loadArmorsInPlayer(): Promise<void> {
    try {
      const params = new URLSearchParams();
      if (filterPlayerId) params.append('playerId', filterPlayerId);
      if (filterArmorId) params.append('armorId', filterArmorId);
      
      const url = params.toString() 
        ? `/api/armors-in-player?${params.toString()}` 
        : '/api/armors-in-player';
      
      const response = await fetch(url);
      if (response.ok) {
        armorsInPlayer = await response.json();
      } else {
        error = 'Failed to load armors in player';
      }
    } catch (err) {
      error = 'Failed to load armors in player';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function deleteArmorInPlayer(id: number | string): Promise<void> {
    if (!confirm('Are you sure you want to remove this equipped armor?')) return;
    
    try {
      const response = await fetch(`/api/armors-in-player/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadArmorsInPlayer();
      } else {
        error = 'Failed to delete armor in player';
      }
    } catch (err) {
      error = 'Failed to delete armor in player';
      console.error(err);
    }
  }

  function editArmorInPlayer(id: number | string): void {
    goto(`/crud/armors-in-player/${id}/edit`);
  }

  function viewArmorInPlayer(id: number | string): void {
    goto(`/crud/armors-in-player/${id}`);
  }

  async function handleFilterChange(): Promise<void> {
    loading = true;
    await loadArmorsInPlayer();
  }

  function clearFilters(): void {
    filterPlayerId = '';
    filterArmorId = '';
    handleFilterChange();
  }

  function parseStatistics(statistics: string): string[] {
    return statistics.split(',').map(s => s.trim()).filter(s => s);
  }

  function parseValues(values: string): string[] {
    return values.split(',').map(v => v.trim()).filter(v => v);
  }
</script>

<svelte:head>
  <title>Equipped Armors Management</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Equipped Armors Management</h1>
    <a href="/armors-in-player/new" class="btn btn-primary">Equip Armor</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <div class="filter-bar">
    <div class="filter-row">
      <div class="filter-group">
        <label for="filterPlayer">Filter by Player ID:</label>
        <input
          bind:value={filterPlayerId}
          id="filterPlayer"
          type="text"
          placeholder="Enter player ID"
        />
      </div>

      <div class="filter-group">
        <label for="filterArmor">Filter by Armor ID:</label>
        <input
          bind:value={filterArmorId}
          id="filterArmor"
          type="text"
          placeholder="Enter armor ID"
        />
      </div>

      <div class="filter-actions">
        <button on:click={handleFilterChange} class="btn btn-secondary">
          Apply Filters
        </button>
        {#if filterPlayerId || filterArmorId}
          <button on:click={clearFilters} class="btn btn-clear">
            Clear All
          </button>
        {/if}
      </div>
    </div>
  </div>

  {#if loading}
    <div class="loading">
      <div>Loading equipped armors...</div>
    </div>
  {:else}
    <div class="armors-grid">
      {#each armorsInPlayer as armorInPlayer}
        <div class="equipped-card">
          <div class="card-header">
            <div class="player-section">
              <span class="player-icon">👤</span>
              <div>
                <div class="player-name">
                  {armorInPlayer.itemInPlayer?.player?.login || 'Unknown Player'}
                </div>
                <div class="player-id">Player ID: {armorInPlayer.itemInPlayer?.playerId || 'N/A'}</div>
              </div>
            </div>
            <div class="equipped-badge">⚔️ Equipped</div>
          </div>

          <div class="card-body">
            {#if armorInPlayer.armor}
              <div class="armor-info">
                <h3>🛡️ {armorInPlayer.armor.name}</h3>
                <div class="armor-id">Armor ID: {armorInPlayer.armorId}</div>
              </div>

              <div class="base-stats">
                <h4>Base Stats</h4>
                <div class="stats-chips">
                  {#each parseStatistics(armorInPlayer.armor.statistics) as stat, i}
                    {@const vals = parseValues(armorInPlayer.armor.values)}
                    <div class="stat-chip base">
                      <span>{stat}</span>
                      <span class="value">+{vals[i] || '0'}</span>
                    </div>
                  {/each}
                </div>
              </div>

              <div class="custom-stats">
                <h4>Custom Modifications</h4>
                <div class="stats-chips">
                  {#each parseStatistics(armorInPlayer.statistics) as stat, i}
                    {@const vals = parseValues(armorInPlayer.values)}
                    <div class="stat-chip custom">
                      <span>{stat}</span>
                      <span class="value">+{vals[i] || '0'}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {:else}
              <div class="no-armor">Armor information not available</div>
            {/if}

            <div class="additional-info">
              <div class="info-row">
                <span class="label">Description Add:</span>
                <span class="value">{armorInPlayer.descriptionAdd}</span>
              </div>
              <div class="notes-section">
                <span class="label">Notes:</span>
                <p class="notes">{armorInPlayer.notes}</p>
              </div>
            </div>

            {#if armorInPlayer.itemInPlayer}
              <div class="location-info">
                📍 {armorInPlayer.itemInPlayer.localisation}
              </div>
            {/if}
          </div>

          <div class="card-actions">
            <button
              on:click={() => viewArmorInPlayer(armorInPlayer.id)}
              class="btn btn-info"
            >
              View
            </button>
            <button
              on:click={() => editArmorInPlayer(armorInPlayer.id)}
              class="btn btn-secondary"
            >
              Edit
            </button>
            <button
              on:click={() => deleteArmorInPlayer(armorInPlayer.id)}
              class="btn btn-danger"
            >
              Unequip
            </button>
          </div>
        </div>
      {/each}
      
      {#if armorsInPlayer.length === 0}
        <div class="no-data">
          <p>No equipped armors found</p>
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
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
  }

  .filter-row {
    display: flex;
    gap: 16px;
    align-items: flex-end;
  }

  .filter-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .filter-group label {
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }

  .filter-group input {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
  }

  .filter-group input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .filter-actions {
    display: flex;
    gap: 8px;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    font-size: 1.2rem;
    color: #6b7280;
  }

  .armors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 20px;
  }

  .equipped-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    border: 2px solid #10b981;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .equipped-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  .card-header {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    padding: 16px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .player-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .player-icon {
    font-size: 2rem;
  }

  .player-name {
    font-weight: 600;
    font-size: 1rem;
  }

  .player-id {
    font-size: 0.75rem;
    opacity: 0.9;
  }

  .equipped-badge {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .card-body {
    padding: 16px;
  }

  .armor-info {
    margin-bottom: 16px;
  }

  h3 {
    margin: 0 0 4px 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }

  .armor-id {
    font-size: 0.75rem;
    color: #6b7280;
  }

  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .base-stats, .custom-stats {
    margin-bottom: 16px;
  }

  .stats-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .stat-chip {
    padding: 6px 12px;
    border-radius: 16px;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .stat-chip.base {
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
    color: white;
  }

  .stat-chip.custom {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
  }

  .stat-chip .value {
    background-color: rgba(255, 255, 255, 0.25);
    padding: 2px 6px;
    border-radius: 8px;
  }

  .additional-info {
    background-color: #f9fafb;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 0.875rem;
  }

  .label {
    color: #6b7280;
    font-weight: 500;
  }

  .value {
    color: #1f2937;
    font-weight: 600;
  }

  .notes-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .notes {
    margin: 0;
    color: #4b5563;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .location-info {
    background-color: #e0e7ff;
    color: #3730a3;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    text-align: center;
  }

  .no-armor {
    text-align: center;
    padding: 20px;
    color: #9ca3af;
    font-style: italic;
  }

  .card-actions {
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
    .armors-grid {
      grid-template-columns: 1fr;
    }
    
    .header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }

    .filter-row {
      flex-direction: column;
    }

    .filter-actions {
      width: 100%;
    }

    .filter-actions button {
      flex: 1;
    }
  }
</style>