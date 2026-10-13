// src/routes/armors-in-player/new/+page.svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { CreateArmorInPlayerData } from '$lib/types';

  let formData: CreateArmorInPlayerData = {
    itemInPlayerId: 0,
    armorId: 0,
    statistics: '',
    values: '',
    descriptionAdd: '',
    notes: ''
  };

  let itemsInPlayer: any[] = [];
  let armors: any[] = [];
  let loading: boolean = false;
  let error: string = '';

  let statsList: Array<{ stat: string; value: string }> = [
    { stat: '', value: '' }
  ];

  onMount(async () => {
    await Promise.all([loadItemsInPlayer(), loadArmors()]);
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

  async function loadArmors(): Promise<void> {
    try {
      const response = await fetch('/api/armors');
      if (response.ok) {
        armors = await response.json();
      }
    } catch (err) {
      console.error('Failed to load armors:', err);
    }
  }

  function addStat(): void {
    statsList = [...statsList, { stat: '', value: '' }];
  }

  function removeStat(index: number): void {
    statsList = statsList.filter((_, i) => i !== index);
  }

  function updateFormData(): void {
    formData.statistics = statsList.map(s => s.stat).filter(s => s).join(',');
    formData.values = statsList.map(s => s.value).filter(v => v).join(',');
  }

  async function handleSubmit(): Promise<void> {
    updateFormData();

    if (!formData.itemInPlayerId || !formData.armorId || !formData.statistics || 
        !formData.values || formData.descriptionAdd === undefined || !formData.notes) {
      error = 'Please fill in all required fields';
      return;
    }

    const stats = formData.statistics.split(',').filter(s => s.trim());
    const vals = formData.values.split(',').filter(v => v.trim());
    
    if (stats.length !== vals.length) {
      error = 'Number of statistics must match number of values';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await fetch('/api/armors-in-player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        goto('/crud/armors-in-player');
      } else {
        const result = await response.json();
        error = result.error || 'Failed to equip armor';
      }
    } catch (err) {
      error = 'Failed to equip armor';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  const commonStats = [
    'Defense', 'Strength', 'Vitesse', 'Endurance', 'PV',
    'Maitrise', 'Accuracy', 'Perception', 'Furtivite'
  ];
</script>

<svelte:head>
  <title>Equip Armor</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Equip Armor</h1>
    <a href="/crud/armors-in-player" class="btn btn-secondary">Back to Equipped Armors</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="form">
    <div class="form-section">
      <h2>Player & Armor Selection</h2>
      
      <div class="form-group">
        <label for="itemInPlayerId">Item in Player Inventory *</label>
        <select bind:value={formData.itemInPlayerId} id="itemInPlayerId" required>
          <option value={0}>Select an item in player inventory</option>
          {#each itemsInPlayer as itemInPlayer}
            <option value={parseInt(itemInPlayer.id)}>
              {itemInPlayer.player?.login || 'Unknown'} - 
              {itemInPlayer.item?.category || 'Item'} 
              (ID: {itemInPlayer.id})
            </option>
          {/each}
        </select>
        <small>Select the item instance that this armor is associated with</small>
      </div>

      <div class="form-group">
        <label for="armorId">Armor *</label>
        <select bind:value={formData.armorId} id="armorId" required>
          <option value={0}>Select an armor</option>
          {#each armors as armor}
            <option value={parseInt(armor.id)}>
              {armor.name} (ID: {armor.id})
            </option>
          {/each}
        </select>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <h2>Custom Statistics Modifications</h2>
        <button type="button" class="btn btn-add" on:click={addStat}>
          + Add Stat
        </button>
      </div>

      <div class="stats-help">
        <p><strong>Common stats:</strong> {commonStats.join(', ')}</p>
        <p><small>These custom stats will override or add to the base armor stats</small></p>
      </div>

      <div class="stats-list">
        {#each statsList as stat, index}
          <div class="stat-row">
            <div class="stat-number">{index + 1}</div>
            <div class="stat-inputs">
              <input
                bind:value={stat.stat}
                type="text"
                placeholder="Stat name (e.g., Defense)"
                on:input={updateFormData}
              />
              <input
                bind:value={stat.value}
                type="number"
                placeholder="Value (e.g., 15)"
                on:input={updateFormData}
              />
            </div>
            {#if statsList.length > 1}
              <button type="button" class="btn-remove" on:click={() => removeStat(index)}>
                ×
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <div class="form-section">
      <h2>Additional Information</h2>

      <div class="form-group">
        <label for="descriptionAdd">Description Add</label>
        <input
          bind:value={formData.descriptionAdd}
          id="descriptionAdd"
          type="text"
          placeholder="Additional description text / notes"
        />
        <small>Text for additional description metadata</small>
      </div>

      <div class="form-group">
        <label for="notes">Notes *</label>
        <textarea
          bind:value={formData.notes}
          id="notes"
          placeholder="Add notes about this equipped armor (e.g., enchantments, condition, special properties)"
          rows="4"
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
        {loading ? 'Equipping...' : 'Equip Armor'}
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

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
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
    min-height: 80px;
  }

  small {
    display: block;
    margin-top: 4px;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .stats-help {
    background-color: #f0f9ff;
    border: 1px solid #bae6fd;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 16px;
  }

  .stats-help p {
    margin: 0 0 4px 0;
    font-size: 0.875rem;
    color: #0c4a6e;
  }

  .stats-help p:last-child {
    margin-bottom: 0;
  }

  .stats-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .stat-row {
    display: flex;
    align-items: center;
    gap: 12px;
    background-color: #f9fafb;
    padding: 12px;
    border-radius: 8px;
  }

  .stat-number {
    background-color: #f59e0b;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  .stat-inputs {
    display: flex;
    gap: 12px;
    flex: 1;
  }

  .stat-inputs input {
    margin: 0;
  }

  .btn-remove {
    background-color: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    font-size: 1.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background-color 0.2s;
  }

  .btn-remove:hover {
    background-color: #dc2626;
  }

  .btn-add {
    background-color: #10b981;
    color: white;
    padding: 8px 16px;
    font-size: 0.875rem;
  }

  .btn-add:hover {
    background-color: #059669;
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

    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .stat-inputs {
      flex-direction: column;
      gap: 8px;
    }
  }
</style>