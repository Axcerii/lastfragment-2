<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  interface Player {
    id: string;
    login: string;
    password: string;
    role: string;
    team: string;
    characterId: string | null;
    character?: {
      id: string;
      name: string;
    };
  }

  let players: Player[] = [];
  let loading = true;
  let error = '';

  onMount(async () => {
    await loadPlayers();
  });

  async function loadPlayers() {
    try {
      const response = await fetch('/api/players');
      if (response.ok) {
        players = await response.json();
        // Convertir les BigInt reçus en strings
        players = players.map(player => ({
          ...player,
          id: player.id.toString(),
          role: player.role.toString(),
          team: player.team.toString(),
          characterId: player.characterId?.toString() || null
        }));
      } else {
        error = 'Failed to load players';
      }
    } catch (err) {
      error = 'Failed to load players';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function deletePlayer(id: string) {
    if (!confirm('Are you sure you want to delete this player?')) return;
    
    try {
      const response = await fetch(`/api/players/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadPlayers();
      } else {
        error = 'Failed to delete player';
      }
    } catch (err) {
      error = 'Failed to delete player';
      console.error(err);
    }
  }

  function editPlayer(id: string) {
    goto(`/players/${id}/edit`);
  }

  function viewPlayer(id: string) {
    goto(`/players/${id}`);
  }
</script>

<svelte:head>
  <title>Players Management</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Players Management</h1>
    <a href="/players/new" class="add-btn">
      Add New Player
    </a>
  </div>

  {#if error}
    <div class="error">
      {error}
    </div>
  {/if}

  {#if loading}
    <div class="loading">
      <div>Loading players...</div>
    </div>
  {:else}
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Login</th>
            <th>Role</th>
            <th>Team</th>
            <th>Character</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each players as player}
            <tr>
              <td>{player.id}</td>
              <td>{player.login}</td>
              <td>{player.role}</td>
              <td>{player.team}</td>
              <td>{player.character?.name || 'No character'}</td>
              <td>
                <button on:click={() => viewPlayer(player.id)} class="btn view">View</button>
                <button on:click={() => editPlayer(player.id)} class="btn edit">Edit</button>
                <button on:click={() => deletePlayer(player.id)} class="btn delete">Delete</button>
              </td>
            </tr>
          {/each}
          {#if players.length === 0}
            <tr>
              <td colspan="6" class="no-data">
                No players found
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
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .header h1 {
    font-size: 1.875rem; /* 30px */
    font-weight: bold;
  }

  .add-btn {
    background-color: #3b82f6;
    color: #fff;
    font-weight: bold;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    text-decoration: none;
    transition: background-color 0.2s ease;
  }

  .add-btn:hover {
    background-color: #1d4ed8;
  }

  .error {
    background-color: #fee2e2;
    border: 1px solid #f87171;
    color: #b91c1c;
    padding: 0.75rem 1rem;
    border-radius: 0.25rem;
    margin-bottom: 1rem;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 16rem; /* h-64 */
    font-size: 1.25rem;
  }

  .table-wrapper {
    background-color: #fff;
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead {
    background-color: #f9fafb;
  }

  th {
    padding: 0.75rem 1.5rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #e5e7eb;
  }

  td {
    padding: 1rem 1.5rem;
    font-size: 0.875rem;
    color: #111827;
    white-space: nowrap;
    border-bottom: 1px solid #e5e7eb;
  }

  tr:hover {
    background-color: #f9fafb;
  }

  .btn {
    font-size: 0.875rem;
    font-weight: 500;
    margin-right: 0.75rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .btn.view {
    color: #4f46e5;
  }

  .btn.view:hover {
    color: #312e81;
  }

  .btn.edit {
    color: #2563eb;
  }

  .btn.edit:hover {
    color: #1e3a8a;
  }

  .btn.delete {
    color: #dc2626;
  }

  .btn.delete:hover {
    color: #7f1d1d;
  }

  .no-data {
    padding: 1rem 1.5rem;
    text-align: center;
    color: #6b7280;
  }
</style>
