// src/routes/foods-in-bags/new/+page.svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { CreateFoodInBagData } from '$lib/types';

  let formData: CreateFoodInBagData = {
    itemInPlayerId: 0,
    foodId: 0
  };

  let itemsInPlayer: any[] = [];
  let foods: any[] = [];
  let loading: boolean = false;
  let error: string = '';

  let selectedFood: any = null;

  onMount(async () => {
    await Promise.all([loadItemsInPlayer(), loadFoods()]);
  });

  async function loadItemsInPlayer(): Promise<void> {
    try {
      const response = await fetch('/api/items-in-player');
      if (response.ok) {
        itemsInPlayer = await response.json();
      }
    } catch (err) {
      console.error('Failed to load items in player:', err);
    }
  }

  async function loadFoods(): Promise<void> {
    try {
      const response = await fetch('/api/foods');
      if (response.ok) {
        foods = await response.json();
      }
    } catch (err) {
      console.error('Failed to load foods:', err);
    }
  }

  function handleFoodChange(): void {
    selectedFood = foods.find(f => parseInt(f.id) === formData.foodId);
  }

  async function handleSubmit(): Promise<void> {
    if (!formData.itemInPlayerId || !formData.foodId) {
      error = 'Please select both a bag and a food item';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await fetch('/api/foods-in-bags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        goto('/foods-in-bags');
      } else {
        const result = await response.json();
        error = result.error || 'Failed to add food to bag';
      }
    } catch (err) {
      error = 'Failed to add food to bag';
      console.error(err);
    } finally {
      loading = false;
    }
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
  <title>Add Food to Bag</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Add Food to Bag</h1>
    <a href="/foods-in-bags" class="btn btn-secondary">Back to Foods in Bags</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="form">
    <div class="form-section">
      <h2>Bag Selection</h2>
      
      <div class="form-group">
        <label for="itemInPlayerId">Player's Bag *</label>
        <select bind:value={formData.itemInPlayerId} id="itemInPlayerId" required>
          <option value={0}>Select a bag from player inventory</option>
          {#each itemsInPlayer as itemInPlayer}
            <option value={parseInt(itemInPlayer.id)}>
              {itemInPlayer.player?.login || 'Unknown'} - 
              {itemInPlayer.item?.category || 'Item'} - 
              {itemInPlayer.localisation}
              (ID: {itemInPlayer.id})
            </option>
          {/each}
        </select>
        <small>Select which bag/container will hold this food</small>
      </div>
    </div>

    <div class="form-section">
      <h2>Food Selection</h2>
      
      <div class="form-group">
        <label for="foodId">Food Item *</label>
        <select 
          bind:value={formData.foodId} 
          id="foodId" 
          on:change={handleFoodChange}
          required
        >
          <option value={0}>Select a food item</option>
          {#each foods as food}
            <option value={parseInt(food.id)}>
              {getFoodIcon(food.type)} {food.name} - {food.type} ({food.weight} kg, {food.price} gold)
            </option>
          {/each}
        </select>
      </div>

      {#if selectedFood}
        <div class="food-preview">
          <div class="preview-header" style="background-color: {getTypeColor(selectedFood.type)}">
            <div class="preview-icon">{getFoodIcon(selectedFood.type)}</div>
            <div class="preview-type">{selectedFood.type}</div>
          </div>
          <div class="preview-body">
            <h3>{selectedFood.name}</h3>
            <div class="preview-stats">
              <div class="preview-stat">
                <span class="stat-icon">⚖️</span>
                <div>
                  <div class="stat-label">Weight</div>
                  <div class="stat-value">{selectedFood.weight} kg</div>
                </div>
              </div>
              <div class="preview-stat">
                <span class="stat-icon">💰</span>
                <div>
                  <div class="stat-label">Value</div>
                  <div class="stat-value">{selectedFood.price} gold</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <div class="form-actions">
      <button
        type="submit"
        class="btn btn-primary"
        disabled={loading}
      >
        {loading ? 'Adding...' : 'Add Food to Bag'}
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

  .form-section {
    padding: 24px;
    border-bottom: 1px solid #e5e7eb;
  }

  .form-section:last-of-type {
    border-bottom: none;
  }

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 20px 0;
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

  small {
    display: block;
    margin-top: 4px;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .food-preview {
    margin-top: 20px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .preview-header {
    padding: 20px;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .preview-icon {
    font-size: 3rem;
  }

  .preview-type {
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .preview-body {
    padding: 20px;
    background-color: #f9fafb;
  }

  h3 {
    margin: 0 0 16px 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    text-align: center;
  }

  .preview-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .preview-stat {
    background-color: white;
    padding: 12px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .stat-icon {
    font-size: 1.5rem;
  }

  .stat-label {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
  }

  .stat-value {
    font-size: 0.875rem;
    color: #1f2937;
    font-weight: 600;
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

    .preview-stats {
      grid-template-columns: 1fr;
    }
  }
</style>
