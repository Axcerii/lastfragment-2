// src/routes/armors/+page.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Armor } from '$lib/types';
  
  let armors: Armor[] = [];
  let loading: boolean = true;
  let error: string = '';
  let filterItemId: string = '';

  onMount(async () => {
    await loadArmors();
  });

  async function loadArmors(): Promise<void> {
    try {
      const url = filterItemId 
        ? `/api/armors?itemId=${filterItemId}` 
        : '/api/armors';
      
      const response = await fetch(url);
      if (response.ok) {
        armors = await response.json();
      } else {
        error = 'Failed to load armors';
      }
    } catch (err) {
      error = 'Failed to load armors';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function deleteArmor(id: number | string): Promise<void> {
    if (!confirm('Are you sure you want to delete this armor?')) return;
    
    try {
      const response = await fetch(`/api/armors/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadArmors();
      } else {
        error = 'Failed to delete armor';
      }
    } catch (err) {
      error = 'Failed to delete armor';
      console.error(err);
    }
  }

  function editArmor(id: number | string): void {
    goto(`/crud/armors/${id}/edit`);
  }

  function viewArmor(id: number | string): void {
    goto(`/crud/armors/${id}`);
  }

  async function handleFilterChange(): Promise<void> {
    loading = true;
    await loadArmors();
  }

  function parseStatistics(statistics: string): string[] {
    return statistics.split(',').map(s => s.trim()).filter(s => s);
  }

  function parseValues(values: string): string[] {
    return values.split(',').map(v => v.trim()).filter(v => v);
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
    return icons[category] || '🛡️';
  }
</script>

<svelte:head>
  <title>Armors Management</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Armors Management</h1>
    <a href="/armors/new" class="btn btn-primary">Add New Armor</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <div class="filter-bar">
    <div class="filter-group">
      <label for="filterItem">Filter by Item ID:</label>
      <div class="filter-input-group">
        <input
          bind:value={filterItemId}
          id="filterItem"
          type="text"
          placeholder="Enter item ID"
        />
        <button on:click={handleFilterChange} class="btn btn-secondary">
          Filter
        </button>
        {#if filterItemId}
          <button on:click={() => { filterItemId = ''; handleFilterChange(); }} class="btn btn-clear">
            Clear
          </button>
        {/if}
      </div>
    </div>
  </div>

  {#if loading}
    <div class="loading">
      <div>Loading armors...</div>
    </div>
  {:else}
    <div class="armors-grid">
      {#each armors as armor}
        <div class="armor-card">
          <div class="armor-header">
            <div class="armor-title">
              <span class="armor-icon">🛡️</span>
              <h3>{armor.name}</h3>
            </div>
            {#if armor.item}
              <div class="item-badge">
                <span>{getCategoryIcon(armor.item.category)}</span>
                <span>{armor.item.category}</span>
              </div>
            {/if}
          </div>

          <div class="armor-body">
            {#if armor.item}
              <div class="item-info">
                <div class="info-item">
                  <span class="info-label">Item ID:</span>
                  <span class="info-value">{armor.itemId}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Rarity:</span>
                  <span class="info-value">{armor.item.rarity}/5</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Weight:</span>
                  <span class="info-value">{armor.item.weight} kg</span>
                </div>
              </div>
            {/if}

            <div class="stats-section">
              <h4>Statistics</h4>
              <div class="stats-container">
                {#each parseStatistics(armor.statistics) as stat, i}
                  {@const vals = parseValues(armor.values)}
                  <div class="stat-chip">
                    <span class="stat-name">{stat}</span>
                    <span class="stat-value">+{vals[i] || '0'}</span>
                  </div>
                {/each}
              </div>
            </div>

            {#if armor.armorInPlayer && armor.armorInPlayer.length > 0}
              <div class="equipped-badge">
                ⚔️ Equipped by {armor.armorInPlayer.length} player{armor.armorInPlayer.length > 1 ? 's' : ''}
              </div>
            {:else}
              <div class="unequipped-badge">
                Not equipped
              </div>
            {/if}
          </div>

          <div class="armor-actions">
            <button
              on:click={() => viewArmor(armor.id)}
              class="btn btn-info"
            >
              View
            </button>
            <button
              on:click={() => editArmor(armor.id)}
              class="btn btn-secondary"
            >
              Edit
            </button>
            <button
              on:click={() => deleteArmor(armor.id)}
              class="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
      
      {#if armors.length === 0}
        <div class="no-data">
          <p>No armors found</p>
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

  .armors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
  }

  .armor-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 2px solid #e5e7eb;
  }

  .armor-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    border-color: #3b82f6;
  }

  .armor-header {
    background: linear-gradient(135deg, #475569 0%, #334155 100%);
    padding: 16px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .armor-title {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .armor-icon {
    font-size: 1.5rem;
  }

  h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .item-badge {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .armor-body {
    padding: 16px;
  }

  .item-info {
    background-color: #f9fafb;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 0.875rem;
  }

  .info-item:last-child {
    margin-bottom: 0;
  }

  .info-label {
    color: #6b7280;
    font-weight: 500;
  }

  .info-value {
    color: #1f2937;
    font-weight: 600;
  }

  .stats-section {
    margin-bottom: 16px;
  }

  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stats-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .stat-chip {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .stat-name {
    opacity: 0.9;
  }

  .stat-value {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 2px 8px;
    border-radius: 10px;
  }

  .equipped-badge {
    background-color: #d1fae5;
    color: #065f46;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    text-align: center;
  }

  .unequipped-badge {
    background-color: #f3f4f6;
    color: #6b7280;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    text-align: center;
  }

  .armor-actions {
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
  }
</style>