<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Character } from '$lib/types';
  
  let characters: Character[] = [];
  let loading: boolean = true;
  let error: string = '';

  onMount(async () => {
    await loadCharacters();
  });

  async function loadCharacters(): Promise<void> {
    try {
      const response = await fetch('/api/characters');
      if (response.ok) {
        characters = await response.json();
      } else {
        error = 'Failed to load characters';
      }
    } catch (err) {
      error = 'Failed to load characters';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function deleteCharacter(id: number | string): Promise<void> {
    if (!confirm('Are you sure you want to delete this character?')) return;
    
    try {
      const response = await fetch(`/api/characters/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadCharacters();
      } else {
        error = 'Failed to delete character';
      }
    } catch (err) {
      error = 'Failed to delete character';
      console.error(err);
    }
  }

  function editCharacter(id: number | string): void {
    goto(`/crud/characters/${id}/edit`);
  }

  function viewCharacter(id: number | string): void {
    goto(`/crud/characters/${id}`);
  }
</script>

<svelte:head>
  <title>Characters Management</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Characters Management</h1>
    <a href="/characters/new" class="btn btn-primary">Add New Character</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  {#if loading}
    <div class="loading">
      <div>Loading characters...</div>
    </div>
  {:else}
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Race</th>
            <th>Country</th>
            <th>Dragon</th>
            <th>Category</th>
            <th>Visibility</th>
            <th>Current</th>
            <th>Players</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each characters as character}
            <tr>
              <td>{character.id}</td>
              <td>
                <strong>{character.name}</strong>
                {#if character.title}
                  <div class="subtitle">"{character.title}"</div>
                {/if}
              </td>
              <td>{character.race}</td>
              <td>{character.country}</td>
              <td>{character.dragon}</td>
              <td>{character.category}</td>
              <td>
                <span class="visibility-badge visibility-{character.visibility}">
                  {character.visibility}
                </span>
              </td>
              <td>
                <span class="current-badge current-{character.current}">
                  {character.current}
                </span>
              </td>
              <td>
                {#if character.players && character.players.length > 0}
                  <div class="players-list">
                    {#each character.players as player}
                      <span class="player-tag">{player.login}</span>
                    {/each}
                  </div>
                {:else}
                  <span class="no-data">No players</span>
                {/if}
              </td>
              <td class="actions">
                <button
                  on:click={() => viewCharacter(character.id)}
                  class="btn btn-info"
                >
                  View
                </button>
                <button
                  on:click={() => editCharacter(character.id)}
                  class="btn btn-secondary"
                >
                  Edit
                </button>
                <button
                  on:click={() => deleteCharacter(character.id)}
                  class="btn btn-danger"
                >
                  Delete
                </button>
              </td>
            </tr>
          {/each}
          {#if characters.length === 0}
            <tr>
              <td colspan="10" class="no-data-row">
                No characters found
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
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

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    font-size: 1.2rem;
    color: #6b7280;
  }

  .table-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 1000px;
  }

  th {
    background-color: #f9fafb;
    padding: 12px 16px;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #e5e7eb;
  }

  td {
    padding: 12px 16px;
    text-align: left;
    font-size: 0.875rem;
    color: #1f2937;
    border-bottom: 1px solid #e5e7eb;
  }

  tr:hover {
    background-color: #f9fafb;
  }

  .subtitle {
    font-size: 0.75rem;
    color: #6b7280;
    font-style: italic;
  }

  .visibility-badge, .current-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .visibility-badge {
    background-color: #e0e7ff;
    color: #3730a3;
  }

  .current-badge {
    background-color: #d1fae5;
    color: #065f46;
  }

  .players-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .player-tag {
    background-color: #f3f4f6;
    color: #374151;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
  }

  .no-data {
    color: #9ca3af;
    font-style: italic;
  }

  .no-data-row {
    text-align: center;
    color: #9ca3af;
    font-style: italic;
    padding: 32px;
  }

  .actions {
    white-space: nowrap;
  }

  .btn {
    display: inline-block;
    padding: 6px 12px;
    margin: 0 2px;
    border: none;
    border-radius: 4px;
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
</style>