// src/routes/badges-fusions/new/+page.svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { CreateBadgeFusionData, BadgeType } from '$lib/types';

  let formData: CreateBadgeFusionData = {
    badge1: 'Artrish',
    badge2: 'Yinva',
    playerId: 0
  };

  let players: any[] = [];
  let loading: boolean = false;
  let error: string = '';

  const badgeTypes: BadgeType[] = [
    'Artrish', 'Yinva', 'Guizamark', 'Shizari', 'Pestia', 
    'Chronos', 'Aqua', 'Goliath', 'Drii', 'Lada', 'Pura'
  ];

  onMount(async () => {
    await loadPlayers();
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

  function getBadgeColor(badgeName: string): string {
    const colors: Record<string, string> = {
      'Artrish': '#ef4444',
      'Yinva': '#3b82f6',
      'Guizamark': '#eab308',
      'Shizari': '#06b6d4',
      'Pestia': '#22c55e',
      'Chronos': '#8b5cf6',
      'Aqua': '#14b8a6',
      'Goliath': '#f59e0b',
      'Drii': '#10b981',
      'Lada': '#a855f7',
      'Pura': '#ec4899'
    };
    return colors[badgeName] || '#6b7280';
  }

  async function handleSubmit(): Promise<void> {
    if (!formData.badge1 || !formData.badge2 || !formData.playerId) {
      error = 'Please fill in all required fields';
      return;
    }

    if (formData.badge1 === formData.badge2) {
      error = 'Cannot fuse the same badge with itself';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await fetch('/api/badges-fusions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        goto('/badges-fusions');
      } else {
        const result = await response.json();
        error = result.error || 'Failed to create badge fusion';
      }
    } catch (err) {
      error = 'Failed to create badge fusion';
      console.error(err);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Create Badge Fusion</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Create Badge Fusion</h1>
    <a href="/badges-fusions" class="btn btn-secondary">Back to Fusions</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="form">
    <div class="form-section">
      <h2>Player Selection</h2>
      
      <div class="form-group">
        <label for="playerId">Player *</label>
        <select bind:value={formData.playerId} id="playerId" required>
          <option value={0}>Select a player</option>
          {#each players as player}
            <option value={parseInt(player.id)}>
              {player.login} (ID: {player.id})
            </option>
          {/each}
        </select>
      </div>
    </div>

    <div class="form-section">
      <h2>Badge Fusion</h2>
      
      <div class="badges-selection">
        <div class="badge-selector">
          <label for="badge1">First Badge *</label>
          <select bind:value={formData.badge1} id="badge1" required>
            {#each badgeTypes as badge}
              <option value={badge}>
                {getBadgeEmoji(badge)} {badge}
              </option>
            {/each}
          </select>
          <div class="badge-preview" style="background-color: {getBadgeColor(formData.badge1)}">
            <div class="preview-emoji">{getBadgeEmoji(formData.badge1)}</div>
            <div class="preview-name">{formData.badge1}</div>
          </div>
        </div>

        <div class="fusion-indicator">
          <div class="fusion-plus">+</div>
          <div class="fusion-arrow">→</div>
        </div>

        <div class="badge-selector">
          <label for="badge2">Second Badge *</label>
          <select bind:value={formData.badge2} id="badge2" required>
            {#each badgeTypes as badge}
              <option value={badge}>
                {getBadgeEmoji(badge)} {badge}
              </option>
            {/each}
          </select>
          <div class="badge-preview" style="background-color: {getBadgeColor(formData.badge2)}">
            <div class="preview-emoji">{getBadgeEmoji(formData.badge2)}</div>
            <div class="preview-name">{formData.badge2}</div>
          </div>
        </div>
      </div>

      {#if formData.badge1 === formData.badge2}
        <div class="warning-message">
          ⚠️ Warning: You cannot fuse the same badge with itself
        </div>
      {:else}
        <div class="fusion-result-preview">
          <div class="result-icon">✨</div>
          <div class="result-text">
            Fusing {formData.badge1} + {formData.badge2}
          </div>
          <div class="result-emojis">
            {getBadgeEmoji(formData.badge1)} + {getBadgeEmoji(formData.badge2)} = 🌈
          </div>
        </div>
      {/if}
    </div>

    <div class="form-actions">
      <button
        type="submit"
        class="btn btn-primary"
        disabled={loading || formData.badge1 === formData.badge2}
      >
        {loading ? 'Creating Fusion...' : 'Create Fusion'}
      </button>
    </div>
  </form>
</div>

<style>
  .container {
    max-width: 900px;
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

  .warning-message {
    background-color: #fef3c7;
    border: 1px solid #fde68a;
    color: #92400e;
    padding: 12px 16px;
    border-radius: 6px;
    margin-top: 16px;
    text-align: center;
    font-weight: 500;
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

  select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #1f2937;
    background-color: white;
    box-sizing: border-box;
  }

  select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .badges-selection {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 20px;
    align-items: start;
  }

  .badge-selector {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .badge-preview {
    padding: 24px 16px;
    border-radius: 12px;
    color: white;
    text-align: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .preview-emoji {
    font-size: 3rem;
    margin-bottom: 8px;
  }

  .preview-name {
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .fusion-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding-top: 40px;
  }

  .fusion-plus, .fusion-arrow {
    font-size: 2rem;
    font-weight: bold;
    color: #f59e0b;
  }

  .fusion-result-preview {
    margin-top: 24px;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 2px dashed #f59e0b;
    padding: 20px;
    border-radius: 12px;
    text-align: center;
  }

  .result-icon {
    font-size: 3rem;
    margin-bottom: 8px;
  }

  .result-text {
    font-weight: 600;
    color: #92400e;
    font-size: 1rem;
    margin-bottom: 12px;
  }

  .result-emojis {
    font-size: 1.5rem;
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

    .badges-selection {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .fusion-indicator {
      transform: rotate(90deg);
      padding-top: 0;
    }
  }
</style>