// src/routes/badges/+page.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Badge } from '$lib/types';
  
  let badges: Badge[] = [];
  let loading: boolean = true;
  let error: string = '';

  onMount(async () => {
    await loadBadges();
  });

  async function loadBadges(): Promise<void> {
    try {
      const response = await fetch('/api/badges');
      if (response.ok) {
        badges = await response.json();
      } else {
        error = 'Failed to load badges';
      }
    } catch (err) {
      error = 'Failed to load badges';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function deleteBadge(id: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this badge?')) return;
    
    try {
      const response = await fetch(`/api/badges/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadBadges();
      } else {
        error = 'Failed to delete badge';
      }
    } catch (err) {
      error = 'Failed to delete badge';
      console.error(err);
    }
  }

  function editBadge(id: string): void {
    goto(`/badges/${id}/edit`);
  }

  function viewBadge(id: string): void {
    goto(`/badges/${id}`);
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

  function getBadgeColor(index: number): string {
    const colors = [
      '#ef4444', '#f59e0b', '#eab308', '#22c55e', 
      '#10b981', '#14b8a6', '#06b6d4', '#3b82f6',
      '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'
    ];
    return colors[index % colors.length];
  }
</script>

<svelte:head>
  <title>Badges Management</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Badges Management</h1>
    <a href="/badges/new" class="btn btn-primary">Add New Badge</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  {#if loading}
    <div class="loading">
      <div>Loading badges...</div>
    </div>
  {:else}
    <div class="badges-grid">
      {#each badges as badge, index}
        <div class="badge-card">
          <div class="badge-icon-section" style="background-color: {getBadgeColor(index)}">
            <div class="badge-emoji">{getBadgeEmoji(badge.badges)}</div>
            <div class="badge-type">{badge.badges}</div>
          </div>

          <div class="badge-body">
            <h3>{badge.name}</h3>
            
            <div class="badge-description">
              <p>{badge.description}</p>
            </div>

            <div class="badge-id">
              ID: {badge.id}
            </div>
          </div>

          <div class="badge-actions">
            <button
              on:click={() => viewBadge(badge.id)}
              class="btn btn-info"
            >
              View
            </button>
            <button
              on:click={() => editBadge(badge.id)}
              class="btn btn-secondary"
            >
              Edit
            </button>
            <button
              on:click={() => deleteBadge(badge.id)}
              class="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
      
      {#if badges.length === 0}
        <div class="no-data">
          <p>No badges found</p>
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

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    font-size: 1.2rem;
    color: #6b7280;
  }

  .badges-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
  }

  .badge-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 3px solid #e5e7eb;
  }

  .badge-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }

  .badge-icon-section {
    padding: 32px 20px;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    position: relative;
    overflow: hidden;
  }

  .badge-icon-section::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
    animation: shimmer 3s infinite;
  }

  @keyframes shimmer {
    0%, 100% { transform: translate(-50%, -50%); }
    50% { transform: translate(0%, 0%); }
  }

  .badge-emoji {
    font-size: 4rem;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
    position: relative;
    z-index: 1;
  }

  .badge-type {
    font-weight: 700;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    position: relative;
    z-index: 1;
  }

  .badge-body {
    padding: 20px;
  }

  h3 {
    margin: 0 0 12px 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
    text-align: center;
  }

  .badge-description {
    background-color: #f9fafb;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 12px;
    min-height: 80px;
  }

  .badge-description p {
    margin: 0;
    color: #4b5563;
    font-size: 0.875rem;
    line-height: 1.6;
  }

  .badge-id {
    text-align: center;
    font-size: 0.75rem;
    color: #9ca3af;
    font-weight: 500;
  }

  .badge-actions {
    padding: 0 20px 20px 20px;
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

  @media (max-width: 768px) {
    .badges-grid {
      grid-template-columns: 1fr;
    }
    
    .header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }
  }
</style>