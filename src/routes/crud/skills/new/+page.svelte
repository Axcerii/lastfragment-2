// src/routes/skills/new/+page.svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import type { CreateSkillData, SkillStatistic } from '$lib/types';

  let formData: CreateSkillData = {
    statistics: 'Force',
    name: '',
    description: '',
    level: 1
  };

  let loading: boolean = false;
  let error: string = '';

  const statistics: SkillStatistic[] = [
    'PV', 'QDF', 'Endurance', 'Maitrise', 'Force', 'Defense',
    'Vitesse', 'Precision', 'Perception', 'Furtivite',
    'Charisme', 'Eloquence', 'Intelligence'
  ];

  function getStatIcon(stat: string): string {
    const icons: Record<string, string> = {
      'PV': '❤️',
      'QDF': '⚡',
      'Endurance': '🛡️',
      'Maîtrise': '🎯',
      'Force': '💪',
      'Défense': '🛡️',
      'Vitesse': '⚡',
      'Précision': '🎯',
      'Perception': '👁️',
      'Furtivité': '🌙',
      'Charisme': '✨',
      'Éloquence': '💬',
      'Intelligence': '🧠'
    };
    return icons[stat] || '⭐';
  }

  function getStatColor(stat: string): string {
    const colors: Record<string, string> = {
      'PV': '#ef4444',
      'QDF': '#eab308',
      'Endurance': '#22c55e',
      'Maîtrise': '#3b82f6',
      'Force': '#f97316',
      'Défense': '#14b8a6',
      'Vitesse': '#06b6d4',
      'Précision': '#8b5cf6',
      'Perception': '#6366f1',
      'Furtivité': '#6b7280',
      'Charisme': '#ec4899',
      'Éloquence': '#a855f7',
      'Intelligence': '#10b981'
    };
    return colors[stat] || '#6b7280';
  }

  async function handleSubmit(): Promise<void> {
    if (!formData.statistics || !formData.name || !formData.description || 
        formData.level === undefined) {
      error = 'Please fill in all required fields';
      return;
    }

    if (formData.level < 1) {
      error = 'Level must be at least 1';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        goto('/skills');
      } else {
        const result = await response.json();
        error = result.error || 'Failed to create skill';
      }
    } catch (err) {
      error = 'Failed to create skill';
      console.error(err);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Add New Skill</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Add New Skill</h1>
    <a href="/skills" class="btn btn-secondary">Back to Skills</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="form">
    <div class="form-section">
      <h2>Skill Information</h2>
      
      <div class="form-group">
        <label for="statistics">Related Statistic *</label>
        <select bind:value={formData.statistics} id="statistics" required>
          {#each statistics as stat}
            <option value={stat}>
              {getStatIcon(stat)} {stat}
            </option>
          {/each}
        </select>
        <small>Select which character statistic this skill is related to</small>
      </div>

      <div class="form-group">
        <label for="name">Skill Name *</label>
        <input
          bind:value={formData.name}
          id="name"
          type="text"
          placeholder="Enter skill name (e.g., Power Strike, Shadow Step)"
          required
        />
      </div>

      <div class="form-group">
        <label for="level">Skill Level *</label>
        <input
          bind:value={formData.level}
          id="level"
          type="number"
          min="1"
          max="20"
          required
        />
        <small>Skill level (1-20). Higher levels indicate more powerful skills</small>
      </div>

      <div class="form-group">
        <label for="description">Description *</label>
        <textarea
          bind:value={formData.description}
          id="description"
          placeholder="Describe what this skill does, its effects, and how to use it"
          rows="6"
          required
        ></textarea>
      </div>
    </div>

    <div class="preview-section">
      <h2>Skill Preview</h2>
      <div class="skill-preview">
        <div class="preview-header" style="background-color: {getStatColor(formData.statistics)}">
          <div class="preview-icon">{getStatIcon(formData.statistics)}</div>
          <div class="preview-stat">{formData.statistics}</div>
          <div class="preview-level">Lvl {formData.level}</div>
        </div>
        <div class="preview-body">
          <h3>{formData.name || 'Skill Name'}</h3>
          <div class="preview-description">
            {formData.description || 'Skill description will appear here...'}
          </div>
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button
        type="submit"
        class="btn btn-primary"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Skill'}
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
    min-height: 120px;
  }

  small {
    display: block;
    margin-top: 4px;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .skill-preview {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .preview-header {
    padding: 20px;
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .preview-icon {
    font-size: 2rem;
  }

  .preview-stat {
    flex: 1;
    font-weight: 700;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .preview-level {
    padding: 6px 12px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 0.875rem;
    background-color: rgba(0, 0, 0, 0.2);
  }

  .preview-body {
    padding: 20px;
    background-color: #f9fafb;
  }

  h3 {
    margin: 0 0 12px 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }

  .preview-description {
    background-color: white;
    padding: 12px;
    border-radius: 8px;
    color: #4b5563;
    font-size: 0.875rem;
    line-height: 1.6;
    min-height: 80px;
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