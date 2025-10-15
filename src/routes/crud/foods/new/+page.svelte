// src/routes/foods/new/+page.svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import type { CreateFoodData, Food } from '$lib/types';

  let formData: CreateFoodData = {
    name: '',
    weight: 1,
    type: 'rations',
    price: 10
  };

  let loading: boolean = false;
  let error: string = '';

  const foodTypes: Array<Food['type']> = ['viandes', 'boissons', 'fruits', 'rations'];

  function getFoodIcon(type: string): string {
    const icons: Record<string, string> = {
      'viandes': '🍖',
      'boissons': '🍷',
      'fruits': '🍎',
      'rations': '🥫'
    };
    return icons[type] || '🍽️';
  }

  async function handleSubmit(): Promise<void> {
    if (!formData.name || formData.weight === undefined || 
        !formData.type || formData.price === undefined) {
      error = 'Please fill in all required fields';
      return;
    }

    if (formData.weight <= 0) {
      error = 'Weight must be greater than 0';
      return;
    }

    if (formData.price < 0) {
      error = 'Price cannot be negative';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await fetch('/api/foods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        goto('/foods');
      } else {
        const result = await response.json();
        error = result.error || 'Failed to create food';
      }
    } catch (err) {
      error = 'Failed to create food';
      console.error(err);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Add New Food</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Add New Food</h1>
    <a href="/foods" class="btn btn-secondary">Back to Foods</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="form">
    <div class="form-section">
      <h2>Food Information</h2>
      
      <div class="form-group">
        <label for="name">Food Name *</label>
        <input
          bind:value={formData.name}
          id="name"
          type="text"
          placeholder="Enter food name (e.g., Apple, Bread, Water)"
          required
        />
      </div>

      <div class="form-group">
        <label for="type">Food Type *</label>
        <select bind:value={formData.type} id="type" required>
          {#each foodTypes as type}
            <option value={type}>
              {getFoodIcon(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          {/each}
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="weight">Weight (kg) *</label>
          <input
            bind:value={formData.weight}
            id="weight"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.5"
            required
          />
          <small>Weight in kilograms</small>
        </div>

        <div class="form-group">
          <label for="price">Price (gold) *</label>
          <input
            bind:value={formData.price}
            id="price"
            type="number"
            min="0"
            step="1"
            placeholder="10"
            required
          />
          <small>Price in gold coins</small>
        </div>
      </div>
    </div>

    <div class="preview-section">
      <h2>Preview</h2>
      <div class="food-preview">
        <div class="preview-icon">{getFoodIcon(formData.type)}</div>
        <div class="preview-name">{formData.name || 'Food Name'}</div>
        <div class="preview-details">
          <div class="preview-detail">
            <span>⚖️</span>
            <span>{formData.weight} kg</span>
          </div>
          <div class="preview-detail">
            <span>💰</span>
            <span>{formData.price} gold</span>
          </div>
        </div>
        <div class="preview-type">{formData.type}</div>
      </div>
    </div>

    <div class="form-actions">
      <button
        type="submit"
        class="btn btn-primary"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Food'}
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

  .form-section, .preview-section {
    padding: 24px;
    border-bottom: 1px solid #e5e7eb;
  }

  .form-section:last-of-type, .preview-section:last-of-type {
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

  .food-preview {
    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
    border: 2px dashed #d1d5db;
    border-radius: 12px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .preview-icon {
    font-size: 4rem;
  }

  .preview-name {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    text-align: center;
  }

  .preview-details {
    display: flex;
    gap: 24px;
    margin-top: 8px;
  }

  .preview-detail {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.875rem;
    color: #4b5563;
    font-weight: 500;
  }

  .preview-type {
    background-color: #3b82f6;
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 8px;
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

    .preview-details {
      flex-direction: column;
      gap: 8px;
    }
  }
</style>