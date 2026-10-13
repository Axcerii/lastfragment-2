<script lang="ts">
  import { goto } from '$app/navigation';
  import type { CreateItemData, ItemCategory } from '$lib/types';

  let formData: CreateItemData = {
    name: '',
    category: 'Autre',
    rarity: 1,
    weight: 1,
    description: ''
  };

  let loading: boolean = false;
  let error: string = '';

  const categories: Array<ItemCategory> = [
    'Casque', 'Torse', 'Gantelets', 'Jambieres', 'Outil', 'Arme', 
    'Fiole', 'Nourriture', 'Munitions', 'Important', 'Autre', 'Materiaux', 
    'Animal', 'Sac'
  ];

  function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Casque': '🪖',
      'Torse': '🛡️',
      'Gantelets': '🥊',
      'Jambieres': '👢',
      'Jambières': '👢',
      'Outil': '🔧',
      'Arme': '⚔️',
      'Fiole': '🧪',
      'Nourriture': '🍖',
      'Munitions': '💣',
      'Important': '⭐',
      'Autre': '📦',
      'Materiaux': '⛏️',
      'Matériaux': '⛏️',
      'Animal': '🐾',
      'Sac': '🎒'
    };
    return icons[category] || '📦';
  }

  async function handleSubmit(): Promise<void> {
    if (!formData.name || !formData.description) {
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
        goto('/crud/items');
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
    <a href="/crud/items" class="btn btn-secondary">Back to Items</a>
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
        <label for="name">Name *</label>
        <input
          bind:value={formData.name}
          id="name"
          type="text"
          placeholder="e.g. Épée en fer, Potion de soin..."
          required
        />
      </div>

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
    font-weight: 700;
    color: #1f2937;
  }

  .btn {
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background-color: #e5e7eb;
    color: #374151;
  }

  .btn-secondary:hover {
    background-color: #d1d5db;
  }

  .error-message {
    background-color: #fee2e2;
    color: #991b1b;
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 20px;
    border: 1px solid #fecaca;
  }

  .form {
    background: white;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .form-section {
    margin-bottom: 24px;
  }

  .form-section h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e7eb;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #374151;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
    color: #1f2937;
  }

  input:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  small {
    display: block;
    margin-top: 4px;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }

  @media (max-width: 640px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }
</style>