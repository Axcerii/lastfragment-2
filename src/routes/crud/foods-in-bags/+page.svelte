// src/routes/foods-in-bags/+page.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { FoodInBag } from '$lib/types';
  
  let foodsInBags: FoodInBag[] = [];
  let loading: boolean = true;
  let error: string = '';
  let filterPlayerId: string = '';
  let filterFoodId: string = '';

  onMount(async () => {
    await loadFoodsInBags();
  });

  async function loadFoodsInBags(): Promise<void> {
    try {
      const params = new URLSearchParams();
      if (filterPlayerId) params.append('playerId', filterPlayerId);
      if (filterFoodId) params.append('foodId', filterFoodId);
      
      const url = params.toString() 
        ? `/api/foods-in-bags?${params.toString()}` 
        : '/api/foods-in-bags';
      
      const response = await fetch(url);
      if (response.ok) {
        foodsInBags = await response.json();
      } else {
        error = 'Failed to load foods in bags';
      }
    } catch (err) {
      error = 'Failed to load foods in bags';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function deleteFoodInBag(id: number | string): Promise<void> {
    if (!confirm('Are you sure you want to remove this food from the bag?')) return;
    
    try {
      const response = await fetch(`/api/foods-in-bags/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadFoodsInBags();
      } else {
        error = 'Failed to delete food in bag';
      }
    } catch (err) {
      error = 'Failed to delete food in bag';
      console.error(err);
    }
  }

  function editFoodInBag(id: number | string): void {
    goto(`/crud/foods-in-bags/${id}/edit`);
  }

  function viewFoodInBag(id: number | string): void {
    goto(`/crud/foods-in-bags/${id}`);
  }

  async function handleFilterChange(): Promise<void> {
    loading = true;
    await loadFoodsInBags();
  }

  function clearFilters(): void {
    filterPlayerId = '';
    filterFoodId = '';
    handleFilterChange();
  }

  function getFoodIcon(type: string): string {
    const icons: Record<string, string> = {
      'viandes': '🍖',
      'boissons': '🍷',
      'fruits': '🍎',
      'rations': '🥫'
    };
    return icons[type] || '🍽️';
  }

  function getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'viandes': '#ef4444',
      'boissons': '#3b82f6',
      'fruits': '#22c55e',
      'rations': '#f59e0b'
    };
    return colors[type] || '#6b7280';
  }
</script>

<svelte:head>
  <title>Foods in Bags Management</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Foods in Bags Management</h1>
    <a href="/foods-in-bags/new" class="btn btn-primary">Add Food to Bag</a>
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
        <label for="filterFood">Filter by Food ID:</label>
        <input
          bind:value={filterFoodId}
          id="filterFood"
          type="text"
          placeholder="Enter food ID"
        />
      </div>

      <div class="filter-actions">
        <button on:click={handleFilterChange} class="btn btn-secondary">
          Apply Filters
        </button>
        {#if filterPlayerId || filterFoodId}
          <button on:click={clearFilters} class="btn btn-clear">
            Clear All
          </button>
        {/if}
      </div>
    </div>
  </div>

  {#if loading}
    <div class="loading">
      <div>Loading foods in bags...</div>
    </div>
  {:else}
    <div class="bags-grid">
      {#each foodsInBags as foodInBag}
        <div class="bag-card">
          <div class="card-header">
            <div class="player-section">
              <span class="player-icon">👤</span>
              <div>
                <div class="player-name">
                  {foodInBag.itemInPlayer?.player?.login || 'Unknown Player'}
                </div>
                <div class="player-id">Player ID: {foodInBag.itemInPlayer?.playerId || 'N/A'}</div>
              </div>
            </div>
            <div class="bag-badge">
              🎒 In Bag
            </div>
          </div>

          <div class="card-body">
            {#if foodInBag.food}
              <div class="food-section">
                <div class="food-icon-large" style="color: {getTypeColor(foodInBag.food.type)}">
                  {getFoodIcon(foodInBag.food.type)}
                </div>
                <h3>{foodInBag.food.name}</h3>
                <div class="food-type-badge" style="background-color: {getTypeColor(foodInBag.food.type)}">
                  {foodInBag.food.type}
                </div>
              </div>

              <div class="food-details">
                <div class="detail-item">
                  <span class="detail-icon">⚖️</span>
                  <div>
                    <div class="detail-label">Weight</div>
                    <div class="detail-value">{foodInBag.food.weight} kg</div>
                  </div>
                </div>

                <div class="detail-item">
                  <span class="detail-icon">💰</span>
                  <div>
                    <div class="detail-label">Value</div>
                    <div class="detail-value">{foodInBag.food.price} gold</div>
                  </div>
                </div>

                <div class="detail-item">
                  <span class="detail-icon">🆔</span>
                  <div>
                    <div class="detail-label">Food ID</div>
                    <div class="detail-value">{foodInBag.foodId}</div>
                  </div>
                </div>
              </div>
            {:else}
              <div class="no-food">Food information not available</div>
            {/if}

            {#if foodInBag.itemInPlayer}
              <div class="location-info">
                <span class="location-icon">📍</span>
                <span>{foodInBag.itemInPlayer.localisation}</span>
              </div>
            {/if}
          </div>

          <div class="card-actions">
            <button
              on:click={() => viewFoodInBag(foodInBag.id)}
              class="btn btn-info"
            >
              View
            </button>
            <button
              on:click={() => editFoodInBag(foodInBag.id)}
              class="btn btn-secondary"
            >
              Edit
            </button>
            <button
              on:click={() => deleteFoodInBag(foodInBag.id)}
              class="btn btn-danger"
            >
              Remove
            </button>
          </div>
        </div>
      {/each}
      
      {#if foodsInBags.length === 0}
        <div class="no-data">
          <p>No foods in bags found</p>
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

  .bags-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }

  .bag-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .bag-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  .card-header {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
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

  .bag-badge {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .card-body {
    padding: 16px;
  }

  .food-section {
    text-align: center;
    margin-bottom: 16px;
  }

  .food-icon-large {
    font-size: 3.5rem;
    margin-bottom: 8px;
  }

  h3 {
    margin: 0 0 8px 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }

  .food-type-badge {
    display: inline-block;
    color: white;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .food-details {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }

  .detail-item {
    background-color: #f9fafb;
    padding: 10px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .detail-icon {
    font-size: 1.25rem;
  }

  .detail-label {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
  }

  .detail-value {
    font-size: 0.875rem;
    color: #1f2937;
    font-weight: 600;
  }

  .location-info {
    background-color: #e0e7ff;
    color: #3730a3;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .location-icon {
    font-size: 1.125rem;
  }

  .no-food {
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
    .bags-grid {
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