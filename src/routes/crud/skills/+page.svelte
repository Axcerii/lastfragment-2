// src/routes/skills/+page.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Skill, SkillStatistic } from '$lib/types';
  
  let skills: Skill[] = [];
  let loading: boolean = true;
  let error: string = '';
  let filterStatistic: string = '';

  const statistics: SkillStatistic[] = [
    'PV', 'QDF', 'Endurance', 'Maitrise', 'Force', 'Defense',
    'Vitesse', 'Precision', 'Perception', 'Furtivite',
    'Charisme', 'Eloquence', 'Intelligence'
  ];

  onMount(async () => {
    await loadSkills();
  });

  async function loadSkills(): Promise<void> {
    try {
      const url = filterStatistic 
        ? `/api/skills?statistics=${filterStatistic}` 
        : '/api/skills';
      
      const response = await fetch(url);
      if (response.ok) {
        skills = await response.json();
      } else {
        error = 'Failed to load skills';
      }
    } catch (err) {
      error = 'Failed to load skills';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function deleteSkill(id: number | string): Promise<void> {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    
    try {
      const response = await fetch(`/api/skills/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadSkills();
      } else {
        error = 'Failed to delete skill';
      }
    } catch (err) {
      error = 'Failed to delete skill';
      console.error(err);
    }
  }

  function editSkill(id: number | string): void {
    goto(`/crud/skills/${id}/edit`);
  }

  function viewSkill(id: number | string): void {
    goto(`/crud/skills/${id}`);
  }

  async function handleFilterChange(): Promise<void> {
    loading = true;
    await loadSkills();
  }

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

  function getLevelBadgeColor(level: number | string): string {
    const lvl = typeof level === 'number' ? level : parseInt(level, 10);
    if (lvl >= 10) return '#ef4444';
    if (lvl >= 7) return '#f59e0b';
    if (lvl >= 4) return '#3b82f6';
    return '#6b7280';
  }
</script>

<svelte:head>
  <title>Skills Management</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Skills Management</h1>
    <a href="/skills/new" class="btn btn-primary">Add New Skill</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <div class="filter-bar">
    <div class="filter-group">
      <label for="filterStatistic">Filter by Statistic:</label>
      <div class="filter-input-group">
        <select
          bind:value={filterStatistic}
          id="filterStatistic"
          on:change={handleFilterChange}
        >
          <option value="">All Statistics</option>
          {#each statistics as stat}
            <option value={stat}>{getStatIcon(stat)} {stat}</option>
          {/each}
        </select>
        {#if filterStatistic}
          <button on:click={() => { filterStatistic = ''; handleFilterChange(); }} class="btn btn-clear">
            Clear
          </button>
        {/if}
      </div>
    </div>
  </div>

  {#if loading}
    <div class="loading">
      <div>Loading skills...</div>
    </div>
  {:else}
    <div class="skills-grid">
      {#each skills as skill}
        <div class="skill-card">
          <div class="skill-header" style="background-color: {getStatColor(skill.statistics)}">
            <div class="stat-icon">{getStatIcon(skill.statistics)}</div>
            <div class="stat-name">{skill.statistics}</div>
            <div class="level-badge" style="background-color: {getLevelBadgeColor(skill.level)}">
              Lvl {skill.level}
            </div>
          </div>

          <div class="skill-body">
            <h3>{skill.name}</h3>
            
            <div class="skill-description">
              <p>{skill.description}</p>
            </div>

            <div class="skill-footer">
              <div class="skill-id">ID: {skill.id}</div>
            </div>
          </div>

          <div class="skill-actions">
            <button
              on:click={() => viewSkill(skill.id)}
              class="btn btn-info"
            >
              View
            </button>
            <button
              on:click={() => editSkill(skill.id)}
              class="btn btn-secondary"
            >
              Edit
            </button>
            <button
              on:click={() => deleteSkill(skill.id)}
              class="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
      
      {#if skills.length === 0}
        <div class="no-data">
          <p>No skills found</p>
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

  .filter-bar {
    background: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .filter-group label {
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }

  .filter-input-group {
    display: flex;
    gap: 8px;
  }

  .filter-input-group select {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    background-color: white;
  }

  .filter-input-group select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    font-size: 1.2rem;
    color: #6b7280;
  }

  .skills-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }

  .skill-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 2px solid #e5e7eb;
  }

  .skill-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  .skill-header {
    padding: 20px;
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .stat-icon {
    font-size: 2rem;
  }

  .stat-name {
    flex: 1;
    font-weight: 700;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .level-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 0.875rem;
    background-color: rgba(0, 0, 0, 0.2);
  }

  .skill-body {
    padding: 20px;
  }

  h3 {
    margin: 0 0 12px 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }

  .skill-description {
    background-color: #f9fafb;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 12px;
    min-height: 80px;
  }

  .skill-description p {
    margin: 0;
    color: #4b5563;
    font-size: 0.875rem;
    line-height: 1.6;
  }

  .skill-footer {
    display: flex;
    justify-content: center;
  }

  .skill-id {
    font-size: 0.75rem;
    color: #9ca3af;
    font-weight: 500;
  }

  .skill-actions {
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

  .btn-clear {
    background-color: #f3f4f6;
    color: #374151;
  }

  .btn-clear:hover {
    background-color: #e5e7eb;
  }

  @media (max-width: 768px) {
    .skills-grid {
      grid-template-columns: 1fr;
    }
    
    .header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }
  }
</style>