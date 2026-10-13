// src/routes/items/+page.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Item } from '$lib/types';
  
  let items: Item[] = [];
  let loading: boolean = true;
  let error: string = '';
  let filterCategory: string = '';

  const categories = [
    'Casque', 'Torse', 'Gantelets', 'Jambières', 'Outil', 'Arme', 
    'Fiole', 'Nourriture', 'Munitions', 'Important', 'Autre', 'Matériaux', 
    'Animal', 'Sac'
  ];

  onMount(async () => {
    await loadItems();
  });

  async function loadItems(): Promise<void> {
    try {
      const url = filterCategory 
        ? `/api/items?category=${encodeURIComponent(filterCategory)}` 
        : '/api/items';
      
      const response = await fetch(url);
      if (response.ok) {
        items = await response.json();
      } else {
        error = 'Failed to load items';
      }
    } catch (err) {
      error = 'Failed to load items';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function deleteItem(id: number | string): Promise<void> {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadItems();
      } else {
        error = 'Failed to delete item';
      }
    } catch (err) {
      error = 'Failed to delete item';
      console.error(err);
    }
  }

  function editItem(id: number | string): void {
    goto(`/crud/items/${id}/edit`);
  }

  function viewItem(id: number | string): void {
    goto(`/crud/items/${id}`);
  }

  async function handleFilterChange(): Promise<void> {
    loading = true;
    await loadItems();
  }

  function getRarityColor(rarity: number | string): string {
    const rarityNum = typeof rarity === 'number' ? rarity : parseInt(rarity, 10);
    if (rarityNum >= 5) return '#a855f7'; // Legendary
    if (rarityNum >= 4) return '#f59e0b'; // Epic
    if (rarityNum >= 3) return '#3b82f6'; // Rare
    if (rarityNum >= 2) return '#22c55e'; // Uncommon
    return '#6b7280'; // Common
  }

  function getRarityLabel(rarity: number | string): string {
    const rarityNum = typeof rarity === 'number' ? rarity : parseInt(rarity, 10);
    if (rarityNum >= 5) return 'Legendary';
    if (rarityNum >= 4) return 'Epic';
    if (rarityNum >= 3) return 'Rare';
    if (rarityNum >= 2) return 'Uncommon';
    return 'Common';
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
</script>

<svelte:head>
  <title>Items Management</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Items Management</h1>
    <a href="/crud/items/new" class="btn btn-primary">Add New Item</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <div class="filter-bar">
    <div class="filter-group">
      <label for="filterCategory">Filter by Category:</label>
      <div class="filter-input-group">
        <select
          bind:value={filterCategory}
          id="filterCategory"
          on:change={handleFilterChange}
        >
          <option value="">All Categories</option>
          {#each categories as category}
            <option value={category}>{getCategoryIcon(category)} {category}</option>
          {/each}
        </select>
        {#if filterCategory}
          <button on:click={() => { filterCategory = ''; handleFilterChange(); }} class="btn btn-clear">
            Clear
          </button>
        {/if}
      </div>
    </div>
  </div>

  {#if loading}
    <div class="loading">
      <div>Loading items...</div>
    </div>
  {:else}
    <div class="items-grid">
      {#each items as item}
        <div class="item-card">
          <div class="item-header">
            <div class="item-category">
              <span class="category-icon">{getCategoryIcon(item.category)}</span>
              <span>{item.category}</span>
            </div>
            <div class="item-rarity" style="background-color: {getRarityColor(item.rarity)}">
              {getRarityLabel(item.rarity)}
            </div>
          </div>

          <div class="item-body">
            <h3 style="margin: 0 0 8px 0; font-size: 1.15rem; color: #111827;">{item.name}</h3>
            <div class="item-info">
              <div class="info-row">
                <span class="label">ID:</span>
                <span class="value">{item.id}</span>
              </div>
              <div class="info-row">
                <span class="label">Weight:</span>
                <span class="value">{item.weight} kg</span>
              </div>
              <div class="info-row">
                <span class="label">Rarity:</span>
                <span class="value">{item.rarity}/5</span>
              </div>
            </div>

            <div class="item-description">
              <p>{item.description.length > 120 ? item.description.substring(0, 120) + '...' : item.description}</p>
            </div>

            <div class="item-stats">
              {#if item.itemsInPlayer && item.itemsInPlayer.length > 0}
                <div class="stat-badge">
                  👤 {item.itemsInPlayer.length} Player{item.itemsInPlayer.length > 1 ? 's' : ''}
                </div>
              {/if}
              {#if item.armors && item.armors.length > 0}
                <div class="stat-badge">
                  🛡️ {item.armors.length} Armor{item.armors.length > 1 ? 's' : ''}
                </div>
              {/if}
              {#if (!item.itemsInPlayer || item.itemsInPlayer.length === 0) && (!item.armors || item.armors.length === 0)}
                <div class="stat-badge no-data">
                  No associations
                </div>
              {/if}
            </div>
          </div>

          <div class="item-actions">
            <button
              on:click={() => viewItem(item.id)}
              class="btn btn-info"
            >
              View
            </button>
            <button
              on:click={() => editItem(item.id)}
              class="btn btn-secondary"
            >
              Edit
            </button>
            <button
              on:click={() => deleteItem(item.id)}
              class="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
      
      {#if items.length === 0}
        <div class="no-data">
          <p>No items found</p>
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

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }

  .item-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .item-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
    border-bottom: 1px solid #e5e7eb;
  }

  .item-category {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #1f2937;
    font-size: 0.875rem;
  }

  .category-icon {
    font-size: 1.25rem;
  }

  .item-rarity {
    padding: 4px 12px;
    border-radius: 12px;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .item-body {
    padding: 16px;
  }

  .item-info {
    margin-bottom: 12px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
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

  .item-description {
    margin-bottom: 12px;
    padding: 12px;
    background-color: #f9fafb;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #4b5563;
    line-height: 1.5;
    min-height: 80px;
  }

  .item-description p {
    margin: 0;
  }

  .item-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .stat-badge {
    padding: 4px 10px;
    background-color: #e0e7ff;
    color: #3730a3;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .stat-badge.no-data {
    background-color: #f3f4f6;
    color: #9ca3af;
  }

  .item-actions {
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
    padding: 8px 16px;
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
  }
</style>