// src/routes/items/new/+page.svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import type { CreateItemData, Item } from '$lib/types';

  let formData: CreateItemData = {
    category: 'Autre',
    rarity: 1,
    weight: 1,
    description: ''
  };

  let loading: boolean = false;
  let error: string = '';

  const categories: Array<Item['category']> = [
    'Casque', 'Torse', 'Gantelets', 'Jambieres', 'Outil', 'Arme', 
    'Fiole', 'Nourriture', 'Munitions', 'Important', 'Autre', 'Materiaux', 
    'Animal', 'Sac'
  ];

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

  async function handleSubmit(): Promise<void> {
    if (!formData.description) {
      error = 'Please fill in all required fields';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        goto('/items');
      } else {
        const result = await response.json();
        error = result.error || 'Failed to create item';
      }
    } catch (err) {
      error = 'Failed to create item';
      console.error(err);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Add New Item</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Add New Item</h1>
    <a href="/items" class="btn btn-secondary">Back to Items</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="form">
    <div class="form-section">
      <h2>Item Information</h2>
      
      <div class="form-group">
        <label for="category">Category *</label>
        <select bind:value={formData.category} id="category" required>
          {#each categories as category}
            <option value={category}>{getCategoryIcon(category)} {category}</option>
          {/each}
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="rarity">Rarity (1-5) *</label>
          <input
            bind:value={formData.rarity}
            id="rarity"
            type="number"
            min="1"
            max="5"
            required
          />
          <small>1=Common, 2=Uncommon, 3=Rare, 4=Epic, 5=Legendary</small>
        </div>

        <div class="form-group">
          <label for="weight">Weight (kg) *</label>
          <input
            bind:value={formData.weight}
            id="weight"
            type="number"
            min="0"
            step="0.1"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label for="description">Description *</label>
        <textarea
          bind:value={formData.description}
          id="description"
          placeholder="Detailed item description"
          rows="5"
          required
        ></textarea>
      </div>
    </div>

    <div class="form-actions">
      <button
        type="submit"
        class="btn btn-primary"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Item'}
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

  .form-section:last-child {
    border-bottom: none;
  }

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 20px 0;
  }

  .form-row {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }

  .form-group {
    flex: 1;
    margin-bottom: 16px;
  }

  label {
    display: block;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
    font-size: 0.875rem;
  }

  input, select, textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #1f2937;
    background-color: white;
    box-sizing: border-box;
  }

  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }

  small {
    display: block;
    margin-top: 4px;
    font-size: 0.75rem;
    color: #6b7280;
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
    .form-row {
      flex-direction: column;
      gap: 0;
    }
    
    .header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }
  }
</style>