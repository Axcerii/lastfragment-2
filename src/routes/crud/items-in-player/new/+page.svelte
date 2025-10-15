<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { CreateItemInPlayerData, Player, Item } from '$lib/types';

  let formData: CreateItemInPlayerData = {
    itemId: 0,
    playerId: 0,
    localisation: ''
  };

  let players: Player[] = [];
  let items: Item[] = [];
  let loading: boolean = false;
  let error: string = '';

  onMount(async () => {
    await Promise.all([loadPlayers(), loadItems()]);
  });

  async function loadPlayers(): Promise<void> {
    try {
      const response = await fetch('/api/players');
      if (response.ok) {
        players = await response.json();
      }
    } catch (err) {
      console.error('Failed to load players:', err);
    }
  }

  async function loadItems(): Promise<void> {
    try {
      const response = await fetch('/api/items');
      if (response.ok) {
        items = await response.json();
      }
    } catch (err) {
      console.error('Failed to load items:', err);
    }
  }

  async function handleSubmit(): Promise<void> {
    if (!formData.playerId || !formData.itemId || !formData.localisation) {
      error = 'Please fill in all required fields';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await fetch('/api/items-in-player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        goto('/items-in-player');
      } else {
        const result = await response.json();
        error = result.error || 'Failed to add item to player';
      }
    } catch (err) {
      error = 'Failed to add item to player';
      console.error(err);
    } finally {
      loading = false;
    }
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
  <title>Add Item to Player</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Add Item to Player</h1>
    <a href="/items-in-player" class="btn btn-secondary">Back to Items In Player</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="form">
    <div class="form-section">
      <h2>Player & Item Selection</h2>
      
      <div class="form-group">
        <label for="playerId">Player *</label>
        <select bind:value={formData.playerId} id="playerId" required>
          <option value={0}>Select a player</option>
            {#each players as player}
            <option value={player.id.toString()}>
                {player.login} (ID: {player.id})
            </option>
            {/each}
        </select>
      </div>

      <div class="form-group">
        <label for="itemId">Item *</label>
        <select bind:value={formData.itemId} id="itemId" required>
          <option value={0}>Select an item</option>
          {#each items as item}
            <option value={parseInt(item.id)}>
              {getCategoryIcon(item.category)} {item.category} - Rarity: {item.rarity} (ID: {item.id})
            </option>
          {/each}
        </select>
      </div>
    </div>

    <div class="form-section">
      <h2>Location Information</h2>
      
      <div class="form-group">
        <label for="localisation">Localisation *</label>
        <input
          bind:value={formData.localisation}
          id="localisation"
          type="text"
          placeholder="e.g., Inventory, Equipped, Storage, Bank"
          required
        />
        <small>Specify where this item is located for the player</small>
      </div>

      <div class="location-suggestions">
        <p class="suggestions-title">Common locations:</p>
        <div class="suggestions-buttons">
          <button type="button" class="suggestion-btn" on:click={() => formData.localisation = 'Inventory'}>
            🎒 Inventory
          </button>
          <button type="button" class="suggestion-btn" on:click={() => formData.localisation = 'Equipped'}>
            ⚔️ Equipped
          </button>
          <button type="button" class="suggestion-btn" on:click={() => formData.localisation = 'Storage'}>
            📦 Storage
          </button>
          <button type="button" class="suggestion-btn" on:click={() => formData.localisation = 'Bank'}>
            🏦 Bank
          </button>
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button
        type="submit"
        class="btn btn-primary"
        disabled={loading}
      >
        {loading ? 'Adding...' : 'Add Item to Player'}
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

  input, select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #1f2937;
    background-color: white;
    box-sizing: border-box;
  }

  input:focus, select:focus {
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

  .location-suggestions {
    background-color: #f9fafb;
    padding: 16px;
    border-radius: 8px;
    margin-top: 16px;
  }

  .suggestions-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    margin: 0 0 12px 0;
  }

  .suggestions-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .suggestion-btn {
    padding: 8px 16px;
    background-color: white;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
  }

  .suggestion-btn:hover {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;
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

    .suggestions-buttons {
      flex-direction: column;
    }

    .suggestion-btn {
      width: 100%;
    }
  }
</style>