<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Monster } from '$lib/types';
  
  let monsters: Monster[] = [];
  let loading: boolean = true;
  let error: string = '';

  onMount(async () => {
    await loadMonsters();
  });

  async function loadMonsters(): Promise<void> {
    try {
      const response = await fetch('/api/monsters');
      if (response.ok) {
        monsters = await response.json();
      } else {
        error = 'Failed to load monsters';
      }
    } catch (err) {
      error = 'Failed to load monsters';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function deleteMonster(id: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this monster? This will also delete its image.')) return;
    
    try {
      const response = await fetch(`/api/monsters/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadMonsters();
      } else {
        error = 'Failed to delete monster';
      }
    } catch (err) {
      error = 'Failed to delete monster';
      console.error(err);
    }
  }

  function editMonster(id: string): void {
    goto(`/monsters/${id}/edit`);
  }

  function viewMonster(id: string): void {
    goto(`/monsters/${id}`);
  }

  function getDangerLevel(dangerosity: string): { level: string, color: string } {
    const danger = parseInt(dangerosity);
    if (danger <= 2) return { level: 'Low', color: '#22c55e' };
    if (danger <= 5) return { level: 'Medium', color: '#f59e0b' };
    if (danger <= 8) return { level: 'High', color: '#ef4444' };
    return { level: 'Extreme', color: '#dc2626' };
  }
</script>

<svelte:head>
  <title>Monsters Management</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Monsters Management</h1>
    <a href="/monsters/new" class="btn btn-primary">Add New Monster</a>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if loading}
    <div class="loading">Loading monsters...</div>
  {:else}
    <div class="monsters-grid">
      {#each monsters as monster}
        <div class="monster-card">
          <div class="monster-image">
            <img src={monster.image} alt={monster.name} />
            <div class="danger-badge" style="background-color: {getDangerLevel(monster.dangerosity).color}">
              {getDangerLevel(monster.dangerosity).level}
            </div>
          </div>
          
          <div class="monster-info">
            <h3>{monster.name}</h3>
            <div class="monster-details">
              <div class="detail-row"><span class="label">Dragon:</span><span class="value">{monster.dragon}</span></div>
              <div class="detail-row"><span class="label">Size:</span><span class="value">{monster.size}</span></div>
              <div class="detail-row"><span class="label">Weight:</span><span class="value">{monster.weight}</span></div>
              <div class="detail-row"><span class="label">Dangerosity:</span><span class="value">{monster.dangerosity}/10</span></div>
            </div>
            
            <div class="monster-description">
              <p>{monster.description.length > 100 ? monster.description.substring(0, 100) + '...' : monster.description}</p>
            </div>

            <div class="monster-status">
              <span class="status-badge visibility-{monster.visibility}">Visibility: {monster.visibility}</span>
              <span class="status-badge current-{monster.current}">Current: {monster.current}</span>
            </div>
          </div>

          <div class="monster-actions">
            <button on:click={() => viewMonster(monster.id)} class="btn btn-info">View</button>
            <button on:click={() => editMonster(monster.id)} class="btn btn-secondary">Edit</button>
            <button on:click={() => deleteMonster(monster.id)} class="btn btn-danger">Delete</button>
          </div>
        </div>
      {/each}
      
      {#if monsters.length === 0}
        <div class="no-data"><p>No monsters found</p></div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  h1 { font-size: 2rem; font-weight: bold; margin: 0; color: #1f2937; }
  .error-message { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; }
  .loading { display: flex; justify-content: center; align-items: center; height: 200px; font-size: 1.2rem; color: #6b7280; }
  .monsters-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px; }
  .monster-card { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }
  .monster-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
  .monster-image { position: relative; width: 100%; height: 200px; overflow: hidden; }
  .monster-image img { width: 100%; height: 100%; object-fit: cover; }
  .danger-badge { position: absolute; top: 12px; right: 12px; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
  .monster-info { padding: 20px; }
  h3 { margin: 0 0 16px 0; font-size: 1.25rem; font-weight: 600; color: #1f2937; }
  .monster-details { margin-bottom: 16px; }
  .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .label { font-weight: 500; color: #6b7280; }
  .value { font-weight: 500; color: #1f2937; }
  .monster-description { margin-bottom: 16px; color: #6b7280; font-size: 0.875rem; line-height: 1.5; }
  .monster-status { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
  .status-badge[class*="visibility-"] { background: #e0e7ff; color: #3730a3; }
  .status-badge[class*="current-"] { background: #d1fae5; color: #065f46; }
  .monster-actions { padding: 0 20px 20px; display: flex; gap: 8px; }
  .no-data { grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #9ca3af; }
  .btn { padding: 8px 16px; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: background-color 0.2s; flex: 1; text-align: center; }
  .btn-info { background: #06b6d4; color: white; } .btn-info:hover { background: #0891b2; }
  .btn-secondary { background: #6b7280; color: white; } .btn-secondary:hover { background: #4b5563; }
  .btn-danger { background: #ef4444; color: white; } .btn-danger:hover { background: #dc2626; }
  .btn-primary { background: #3b82f6; color: white; } .btn-primary:hover { background: #2563eb; }
  @media (max-width: 768px) { .monsters-grid { grid-template-columns: 1fr; } .header { flex-direction: column; gap: 16px; align-items: stretch; } }
</style>
