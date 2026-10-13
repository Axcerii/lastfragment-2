<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Food } from '$lib/types';
  
  let foods: Food[] = [];
  let loading: boolean = true;
  let error: string = '';
  let filterType: string = '';

  const foodTypes: Array<Food['type']> = ['viandes', 'boissons', 'fruits', 'rations'];

  onMount(async () => {
    await loadFoods();
  });

  async function loadFoods(): Promise<void> {
    try {
      const url = filterType 
        ? `/api/foods?type=${filterType}` 
        : '/api/foods';
      
      const response = await fetch(url);
      if (response.ok) {
        foods = await response.json();
      } else {
        error = 'Failed to load foods';
      }
    } catch (err) {
      error = 'Failed to load foods';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function deleteFood(id: number | string): Promise<void> {
    if (!confirm('Are you sure you want to delete this food?')) return;
    
    try {
      const response = await fetch(`/api/foods/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadFoods();
      } else {
        error = 'Failed to delete food';
      }
    } catch (err) {
      error = 'Failed to delete food';
      console.error(err);
    }
  }

  function editFood(id: number | string): void {
    goto(`/crud/foods/${id}/edit`);
  }

  function viewFood(id: number | string): void {
    goto(`/crud/foods/${id}`);
  }

  async function handleFilterChange(): Promise<void> {
    loading = true;
    await loadFoods();
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

  function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'viandes': 'Viandes',
      'boissons': 'Boissons',
      'fruits': 'Fruits',
      'rations': 'Rations'
    };
    return labels[type] || type;
  }
</script>

<svelte:head>
  <title>Foods Management</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Foods Management</h1>
    <a href="/foods/new" class="btn btn-primary">Add New Food</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <div class="filter-bar">
    <div class="filter-group">
      <label for="filterType">Filter by Type:</label>
      <div class="filter-input-group">
        <select
          bind:value={filterType}
          id="filterType"
          on:change={handleFilterChange}
        >
          <option value="">All Types</option>
          {#each foodTypes as type}
            <option value={type}>{getFoodIcon(type)} {getTypeLabel(type)}</option>
          {/each}
        </select>
        {#if filterType}
          <button on:click={() => { filterType = ''; handleFilterChange(); }} class="btn btn-clear">
            Clear
          </button>
        {/if}
      </div>
    </div>
  </div>

  {#if loading}
    <div class="loading">
      <div>Loading foods...</div>
    </div>
  {:else}
    <div class="foods-grid">
      {#each foods as food}
        <div class="food-card">
          <div class="food-header" style="background-color: {getTypeColor(food.type)}">
            <div class="food-icon">
              {getFoodIcon(food.type)}
            </div>
            <div class="food-type">
              {getTypeLabel(food.type)}
            </div>
          </div>

          <div class="food-body">
            <h3>{food.name}</h3>

            <div class="food-info">
              <div class="info-item">
                <span class="info-icon">⚖️</span>
                <div>
                  <div class="info-label">Weight</div>
                  <div class="info-value">{food.weight} kg</div>
                </div>
              </div>

              <div class="info-item">
                <span class="info-icon">💰</span>
                <div>
                  <div class="info-label">Price</div>
                  <div class="info-value">{food.price} gold</div>
                </div>
              </div>
            </div>

            {#if food.foodsInBags && food.foodsInBags.length > 0}
              <div class="inventory-badge">
                🎒 In {food.foodsInBags.length} bag{food.foodsInBags.length > 1 ? 's' : ''}
              </div>
            {:else}
              <div class="no-inventory-badge">
                Not in any bags
              </div>
            {/if}
          </div>

          <div class="food-actions">
            <button
              on:click={() => viewFood(food.id)}
              class="btn btn-info"
            >
              View
            </button>
            <button
              on:click={() => editFood(food.id)}
              class="btn btn-secondary"
            >
              Edit
            </button>
            <button
              on:click={() => deleteFood(food.id)}
              class="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
      
      {#if foods.length === 0}
        <div class="no-data">
          <p>No foods found</p>
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

  .filter-input-group select {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    background-color: white;
  }

  .filter-input-group select:focus {
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

  .foods-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }

  .food-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .food-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  .food-header {
    padding: 20px;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .food-icon {
    font-size: 3rem;
  }

  .food-type {
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .food-body {
    padding: 16px;
  }

  h3 {
    margin: 0 0 16px 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    text-align: center;
  }

  .food-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }

  .info-item {
    background-color: #f9fafb;
    padding: 12px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .info-icon {
    font-size: 1.5rem;
  }

  .info-label {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
  }

  .info-value {
    font-size: 0.875rem;
    color: #1f2937;
    font-weight: 600;
  }

  .inventory-badge {
    background-color: #d1fae5;
    color: #065f46;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    text-align: center;
  }

  .no-inventory-badge {
    background-color: #f3f4f6;
    color: #6b7280;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    text-align: center;
  }

  .food-actions {
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
    .foods-grid {
      grid-template-columns: 1fr;
    }
    
    .header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }
  }
</style>