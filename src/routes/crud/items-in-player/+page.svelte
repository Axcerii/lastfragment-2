// src/routes/items-in-player/+page.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { ItemInPlayer } from '$lib/types';
  
  let itemsInPlayer: ItemInPlayer[] = [];
  let loading: boolean = true;
  let error: string = '';
  let filterPlayerId: string = '';
  let filterItemId: string = '';

  onMount(async () => {
    await loadItemsInPlayer();
  });

  async function loadItemsInPlayer(): Promise<void> {
    try {
      const params = new URLSearchParams();
      if (filterPlayerId) params.append('playerId', filterPlayerId);
      if (filterItemId) params.append('itemId', filterItemId);
      
      const url = params.toString() 
        ? `/api/items-in-player?${params.toString()}` 
        : '/api/items-in-player';
      
      const response = await fetch(url);
      if (response.ok) {
        itemsInPlayer = await response.json();
      } else {
        error = 'Failed to load items in player';
      }
    } catch (err) {
      error = 'Failed to load items in player';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function deleteItemInPlayer(id: number | string): Promise<void> {
    if (!confirm('Are you sure you want to delete this item from player inventory?')) return;
    
    try {
      const response = await fetch(`/api/items-in-player/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadItemsInPlayer();
      } else {
        error = 'Failed to delete item in player';
      }
    } catch (err) {
      error = 'Failed to delete item in player';
      console.error(err);
    }
  }

  function editItemInPlayer(id: number | string): void {
    goto(`/crud/items-in-player/${id}/edit`);
  }

  function viewItemInPlayer(id: number | string): void {
    goto(`/crud/items-in-player/${id}`);
  }

  async function handleFilterChange(): Promise<void> {
    loading = true;
    await loadItemsInPlayer();
  }

  function clearFilters(): void {
    filterPlayerId = '';
    filterItemId = '';
    handleFilterChange();
  }

  function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Casque': '🪖',
      'Torse': '🛡️',
      'Gantelets': '🥊',
      'Jambières': '👢',
      'Outil': '🔧',
      'Arme': '⚔️',
      'Fiole': '🧪',
      'Nourriture': '🍖',
      'Munitions': '💣',
      'Important': '⭐',
      'Autre': '📦',
      'Matériaux': '⛏️',
      'Animal': '🐾',
      'Sac': '🎒'
    };
    return icons[category] || '📦';
  }

  function getLocalisationIcon(localisation: string): string {
    const lower = localisation.toLowerCase();
    if (lower.includes('inventory') || lower.includes('inventaire')) return '🎒';
    if (lower.includes('equipped') || lower.includes('équipé')) return '⚔️';
    if (lower.includes('storage') || lower.includes('stockage')) return '📦';
    if (lower.includes('bank') || lower.includes('banque')) return '🏦';
    return '📍';
  }
</script>

<svelte:head>
  <title>Items In Player Management</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Items In Player Management</h1>
    <a href="/items-in-player/new" class="btn btn-primary">Add Item to Player</a>
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
        <label for="filterItem">Filter by Item ID:</label>
        <input
          bind:value={filterItemId}
          id="filterItem"
          type="text"
          placeholder="Enter item ID"
        />
      </div>

      <div class="filter-actions">
        <button on:click={handleFilterChange} class="btn btn-secondary">
          Apply Filters
        </button>
        {#if filterPlayerId || filterItemId}
          <button on:click={clearFilters} class="btn btn-clear">
            Clear All
          </button>
        {/if}
      </div>
    </div>
  </div>

  {#if loading}
    <div class="loading">
      <div>Loading items in player...</div>
    </div>
  {:else}
    <div class="items-grid">
      {#each itemsInPlayer as itemInPlayer}
        <div class="inventory-card">
          <div class="card-header">
            <div class="player-info">
              <span class="player-icon">👤</span>
              <div>
                <div class="player-name">
                  {itemInPlayer.player?.login || 'Unknown Player'}
                </div>
                <div class="player-id">ID: {itemInPlayer.playerId}</div>
              </div>
            </div>
            <div class="localisation-badge">
              <span class="loc-icon">{getLocalisationIcon(itemInPlayer.localisation)}</span>
              {itemInPlayer.localisation}
            </div>
          </div>

          <div class="card-body">
            {#if itemInPlayer.item}
              <div class="item-details">
                <div class="item-header-info">
                  <span class="item-icon">{getCategoryIcon(itemInPlayer.item.category)}</span>
                  <div class="item-category">{itemInPlayer.item.category}</div>
                </div>
                
                <div class="item-stats">
                  <div class="stat-item">
                    <span class="stat-label">Item ID:</span>
                    <span class="stat-value">{itemInPlayer.itemId}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Rarity:</span>
                    <span class="stat-value">{itemInPlayer.item.rarity}/5</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Weight:</span>
                    <span class="stat-value">{itemInPlayer.item.weight} kg</span>
                  </div>
                </div>

                <div class="item-description">
                  {itemInPlayer.item.description.length > 80 
                    ? itemInPlayer.item.description.substring(0, 80) + '...' 
                    : itemInPlayer.item.description}
                </div>
              </div>
            {:else}
              <div class="no-item">Item information not available</div>
            {/if}

            <div class="associations">
              {#if itemInPlayer.armorInPlayer && itemInPlayer.armorInPlayer.length > 0}
                <div class="assoc-badge">🛡️ {itemInPlayer.armorInPlayer.length} Armor</div>
              {/if}
              {#if itemInPlayer.foodsInBags && itemInPlayer.foodsInBags.length > 0}
                <div class="assoc-badge">🍖 {itemInPlayer.foodsInBags.length} Food</div>
              {/if}
            </div>
          </div>

          <div class="card-actions">
            <button
              on:click={() => viewItemInPlayer(itemInPlayer.id)}
              class="btn btn-info"
            >
              View
            </button>
            <button
              on:click={() => editItemInPlayer(itemInPlayer.id)}
              class="btn btn-secondary"
            >
              Edit
            </button>
            <button
              on:click={() => deleteItemInPlayer(itemInPlayer.id)}
              class="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
      
      {#if itemsInPlayer.length === 0}
        <div class="no-data">
          <p>No items in player inventory found</p>
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

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
  }

  .inventory-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .inventory-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  .card-header {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    padding: 16px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .player-info {
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

  .localisation-badge {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .loc-icon {
    font-size: 1rem;
  }

  .card-body {
    padding: 16px;
  }

  .item-details {
    margin-bottom: 12px;
  }

  .item-header-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .item-icon {
    font-size: 1.5rem;
  }

  .item-category {
    font-weight: 600;
    color: #1f2937;
    font-size: 1rem;
  }

  .item-stats {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
  }

  .stat-label {
    color: #6b7280;
    font-weight: 500;
  }

  .stat-value {
    color: #1f2937;
    font-weight: 600;
  }

  .item-description {
    background-color: #f9fafb;
    padding: 10px;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #4b5563;
    line-height: 1.4;
    min-height: 60px;
  }

  .no-item {
    text-align: center;
    padding: 20px;
    color: #9ca3af;
    font-style: italic;
  }

  .associations {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;
  }

  .assoc-badge {
    background-color: #e0e7ff;
    color: #3730a3;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
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
    .items-grid {
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