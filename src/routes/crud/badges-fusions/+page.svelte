// src/routes/badges-fusions/+page.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { BadgeFusion } from '$lib/types';
  
  let badgesFusions: BadgeFusion[] = [];
  let loading: boolean = true;
  let error: string = '';
  let filterPlayerId: string = '';

  onMount(async () => {
    await loadBadgesFusions();
  });

  async function loadBadgesFusions(): Promise<void> {
    try {
      const url = filterPlayerId 
        ? `/api/badges-fusions?playerId=${filterPlayerId}` 
        : '/api/badges-fusions';
      
      const response = await fetch(url);
      if (response.ok) {
        badgesFusions = await response.json();
      } else {
        error = 'Failed to load badges fusions';
      }
    } catch (err) {
      error = 'Failed to load badges fusions';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function deleteBadgeFusion(id: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this badge fusion?')) return;
    
    try {
      const response = await fetch(`/api/badges-fusions/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadBadgesFusions();
      } else {
        error = 'Failed to delete badge fusion';
      }
    } catch (err) {
      error = 'Failed to delete badge fusion';
      console.error(err);
    }
  }

  function editBadgeFusion(id: string): void {
    goto(`/badges-fusions/${id}/edit`);
  }

  function viewBadgeFusion(id: string): void {
    goto(`/badges-fusions/${id}`);
  }

  async function handleFilterChange(): Promise<void> {
    loading = true;
    await loadBadgesFusions();
  }

  function getBadgeEmoji(badgeName: string): string {
    const emojis: Record<string, string> = {
      'Artrish': '🔥',
      'Yinva': '❄️',
      'Guizamark': '⚡',
      'Shizari': '🌊',
      'Pestia': '☠️',
      'Chronos': '⏰',
      'Aqua': '💧',
      'Goliath': '💪',
      'Drii': '🌪️',
      'Lada': '🌟',
      'Pura': '✨'
    };
    return emojis[badgeName] || '🏅';
  }

  function getBadgeColor(badgeName: string): string {
    const colors: Record<string, string> = {
      'Artrish': '#ef4444',
      'Yinva': '#3b82f6',
      'Guizamark': '#eab308',
      'Shizari': '#06b6d4',
      'Pestia': '#22c55e',
      'Chronos': '#8b5cf6',
      'Aqua': '#14b8a6',
      'Goliath': '#f59e0b',
      'Drii': '#10b981',
      'Lada': '#a855f7',
      'Pura': '#ec4899'
    };
    return colors[badgeName] || '#6b7280';
  }
</script>

<svelte:head>
  <title>Badge Fusions Management</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Badge Fusions Management</h1>
    <a href="/badges-fusions/new" class="btn btn-primary">Create Fusion</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <div class="filter-bar">
    <div class="filter-group">
      <label for="filterPlayer">Filter by Player ID:</label>
      <div class="filter-input-group">
        <input
          bind:value={filterPlayerId}
          id="filterPlayer"
          type="text"
          placeholder="Enter player ID"
        />
        <button on:click={handleFilterChange} class="btn btn-secondary">
          Filter
        </button>
        {#if filterPlayerId}
          <button on:click={() => { filterPlayerId = ''; handleFilterChange(); }} class="btn btn-clear">
            Clear
          </button>
        {/if}
      </div>
    </div>
  </div>

  {#if loading}
    <div class="loading">
      <div>Loading badge fusions...</div>
    </div>
  {:else}
    <div class="fusions-grid">
      {#each badgesFusions as fusion}
        <div class="fusion-card">
          <div class="fusion-header">
            <div class="player-info">
              <span class="player-icon">👤</span>
              <div>
                <div class="player-name">
                  {fusion.player?.login || 'Unknown Player'}
                </div>
                <div class="player-id">ID: {fusion.playerId}</div>
              </div>
            </div>
            <div class="fusion-badge">⚡ Fusion</div>
          </div>

          <div class="fusion-body">
            <div class="badges-display">
              <div class="badge-item" style="background-color: {getBadgeColor(fusion.badge1)}">
                <div class="badge-icon">{getBadgeEmoji(fusion.badge1)}</div>
                <div class="badge-name">{fusion.badge1}</div>
              </div>

              <div class="fusion-symbol">
                <span class="plus-icon">+</span>
                <div class="fusion-line"></div>
                <span class="arrow-icon">→</span>
              </div>

              <div class="badge-item" style="background-color: {getBadgeColor(fusion.badge2)}">
                <div class="badge-icon">{getBadgeEmoji(fusion.badge2)}</div>
                <div class="badge-name">{fusion.badge2}</div>
              </div>
            </div>

            <div class="fusion-result">
              <div class="result-icon">✨</div>
              <div class="result-text">Fused Power</div>
            </div>
          </div>

          <div class="fusion-actions">
            <button
              on:click={() => viewBadgeFusion(fusion.id)}
              class="btn btn-info"
            >
              View
            </button>
            <button
              on:click={() => editBadgeFusion(fusion.id)}
              class="btn btn-secondary"
            >
              Edit
            </button>
            <button
              on:click={() => deleteBadgeFusion(fusion.id)}
              class="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
      
      {#if badgesFusions.length === 0}
        <div class="no-data">
          <p>No badge fusions found</p>
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

  .fusions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 24px;
  }

  .fusion-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 2px solid #e5e7eb;
  }

  .fusion-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }

  .fusion-header {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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

  .fusion-badge {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .fusion-body {
    padding: 24px;
  }

  .badges-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 20px;
  }

  .badge-item {
    flex: 1;
    padding: 20px 12px;
    border-radius: 12px;
    color: white;
    text-align: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .badge-icon {
    font-size: 2.5rem;
    margin-bottom: 8px;
  }

  .badge-name {
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .fusion-symbol {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .plus-icon, .arrow-icon {
    font-size: 1.5rem;
    font-weight: bold;
    color: #f59e0b;
  }

  .fusion-line {
    width: 2px;
    height: 20px;
    background-color: #f59e0b;
  }

  .fusion-result {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 2px dashed #f59e0b;
    padding: 16px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .result-icon {
    font-size: 2rem;
  }

  .result-text {
    font-weight: 600;
    color: #92400e;
    font-size: 1rem;
  }

  .fusion-actions {
    padding: 0 24px 24px 24px;
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
    .fusions-grid {
      grid-template-columns: 1fr;
    }
    
    .header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }

    .badges-display {
      flex-direction: column;
    }

    .fusion-symbol {
      transform: rotate(90deg);
    }
  }
</style>