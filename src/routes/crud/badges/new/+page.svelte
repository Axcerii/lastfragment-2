// src/routes/badges/new/+page.svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import type { CreateBadgeData } from '$lib/types';

  let formData: CreateBadgeData = {
    badges: '',
    name: '',
    description: ''
  };

  let loading: boolean = false;
  let error: string = '';

  const badgeTypes = [
    'Artrish', 'Yinva', 'Guizamark', 'Shizari', 'Pestia', 
    'Chronos', 'Aqua', 'Goliath', 'Drii', 'Lada', 'Pura'
  ];

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

  async function handleSubmit(): Promise<void> {
    if (!formData.badges || !formData.name || !formData.description) {
      error = 'Please fill in all required fields';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await fetch('/api/badges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        goto('/badges');
      } else {
        const result = await response.json();
        error = result.error || 'Failed to create badge';
      }
    } catch (err) {
      error = 'Failed to create badge';
      console.error(err);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Add New Badge</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Add New Badge</h1>
    <a href="/badges" class="btn btn-secondary">Back to Badges</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="form">
    <div class="form-section">
      <h2>Badge Information</h2>
      
      <div class="form-group">
        <label for="badges">Badge Type *</label>
        <select bind:value={formData.badges} id="badges" required>
          <option value="">Select a badge type</option>
          {#each badgeTypes as type}
            <option value={type}>
              {getBadgeEmoji(type)} {type}
            </option>
          {/each}
        </select>
        <small>Select the elemental or dragon type for this badge</small>
      </div>

      <div class="form-group">
        <label for="name">Badge Name *</label>
        <input
          bind:value={formData.name}
          id="name"
          type="text"
          placeholder="Enter badge name"
          required
        />
      </div>

      <div class="form-group">
        <label for="description">Description *</label>
        <textarea
          bind:value={formData.description}
          id="description"
          placeholder="Describe the badge's powers, origin, and significance"
          rows="5"
          required
        ></textarea>
      </div>
    </div>

    {#if formData.badges}
      <div class="preview-section">
        <h2>Preview</h2>
        <div class="badge-preview">
          <div class="preview-icon">
            {getBadgeEmoji(formData.badges)}
          </div>
          <div class="preview-type">{formData.badges}</div>
          <div class="preview-name">{formData.name || 'Badge Name'}</div>
          <div class="preview-desc">
            {formData.description || 'Badge description will appear here...'}
          </div>
        </div>
      </div>
    {/if}

    <div class="form-actions">
      <button
        type="submit"
        class="btn btn-primary"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Badge'}
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
    min-height: 100px;
  }

  small {
    display: block;
    margin-top: 4px;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .badge-preview {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px 20px;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }

  .preview-icon {
    font-size: 5rem;
    margin-bottom: 16px;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }

  .preview-type {
    font-weight: 700;
    font-size: 1.125rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 12px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .preview-name {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 16px;
  }

  .preview-desc {
    font-size: 0.875rem;
    line-height: 1.6;
    opacity: 0.95;
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
  }
</style>