<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { CreateArmorData, Item } from '$lib/types';

  let formData: CreateArmorData = {
    name: '',
    statistics: '',
    values: '',
    itemId: 0
  };

  let items: Item[] = [];
  let loading: boolean = false;
  let error: string = '';

  // Système de gestion des stats dynamiques
  let statsList: Array<{ stat: string; value: string }> = [
    { stat: '', value: '' }
  ];

  onMount(async () => {
    await loadItems();
  });

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

    if (!formData.name || !formData.itemId || !formData.statistics || !formData.values) {
      error = 'Please fill in all required fields';
      return;
    }

    // Vérifier que le nombre de stats correspond au nombre de valeurs
    const stats = formData.statistics.split(',').filter(s => s.trim());
    const vals = formData.values.split(',').filter(v => v.trim());
    
    if (stats.length !== vals.length) {
      error = 'Number of statistics must match number of values';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await fetch('/api/armors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        goto('/crud/armors');
      } else {
        const result = await response.json();
        error = result.error || 'Failed to create armor';
      }
    } catch (err) {
      error = 'Failed to create armor';
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
    return icons[category] || '🛡️';
  }

  const commonStats = [
    'Defense', 'Strength', 'Vitesse', 'Endurance', 'PV',
    'Maitrise', 'Accuracy', 'Perception', 'Furtivite'
  ];
</script>

<svelte:head>
  <title>Add New Armor</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Add New Armor</h1>
    <a href="/armors" class="btn btn-secondary">Back to Armors</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="form">
    <div class="form-section">
      <h2>Basic Information</h2>
      
      <div class="form-group">
        <label for="name">Armor Name *</label>
        <input
          bind:value={formData.name}
          id="name"
          type="text"
          placeholder="Enter armor name"
          required
        />
      </div>

      <div class="form-group">
        <label for="itemId">Associated Item *</label>
        <select bind:value={formData.itemId} id="itemId" required>
          <option value={0}>Select an item</option>
          {#each items as item}
            <option value={Number(item.id)}>
              {getCategoryIcon(item.category)} {item.category} - Rarity: {item.rarity} (ID: {item.id})
            </option>
          {/each}
        </select>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <h2>Statistics & Values</h2>
        <button type="button" class="btn btn-add" on:click={addStat}>
          + Add Stat
        </button>
      </div>

      <div class="stats-help">
        <p><strong>Common stats:</strong> {commonStats.join(', ')}</p>
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
                placeholder="Value (e.g., 10)"
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

    <div class="form-actions">
      <button
        type="submit"
        class="btn btn-primary"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Armor'}
      </button>
    </div>
  </form>
</div>