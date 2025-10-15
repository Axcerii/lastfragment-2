<script lang="ts">
  import { goto } from '$app/navigation';
  import type { CreateCharacterData } from '$lib/types';

  let formData: CreateCharacterData = {
    visibility: 1,
    name: '',
    flux: '',
    dragon: '',
    title: '',
    theme: '',
    race: 'Humain',
    country: 'Inconnu',
    image: '', // ça contiendra le nom ou l’URL générée par ton backend
    description: '',
    category: '',
    current: 1
  };

  let imageFile: File | null = null; // le fichier image sélectionné
  let loading: boolean = false;
  let error: string = '';

  const races: Array<CreateCharacterData['race']> = [
    'Humain', 'Geant', 'Eternelle', 'Inconnu', 'Dragon', 'Ange'
  ];

  const countries: Array<CreateCharacterData['country']> = [
    'Augeaime', 'Inconnu', 'Irisia', 'Amari', 'Mudan', 'Edenia', 'Celeste', 'Saxifra'
  ];

  async function handleSubmit(): Promise<void> {
    if (!formData.name || !formData.dragon || !imageFile || 
        !formData.description || !formData.category) {
      error = 'Please fill in all required fields';
      return;
    }

    loading = true;
    error = '';

    try {
      // Construction d’un FormData multipart
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('dragon', formData.dragon);
      fd.append('race', formData.race);
      fd.append('country', formData.country);
      fd.append('visibility', String(formData.visibility));
      fd.append('current', String(formData.current));
      fd.append('description', formData.description);
      fd.append('category', formData.category);

      if (formData.flux) fd.append('flux', formData.flux);
      if (formData.title) fd.append('title', formData.title);
      if (formData.theme) fd.append('theme', formData.theme);

      if (imageFile) {
        fd.append('image', imageFile); // Fichier envoyé au backend
      }

      const response = await fetch('/api/characters', {
        method: 'POST',
        body: fd
      });

      if (response.ok) {
        goto('/characters');
      } else {
        const result = await response.json();
        error = result.error || 'Failed to create character';
      }
    } catch (err) {
      error = 'Failed to create character';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      imageFile = target.files[0];
    }
  }
</script>

<svelte:head>
  <title>Add New Character</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Add New Character</h1>
    <a href="/characters" class="btn btn-secondary">Back to Characters</a>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

 <form on:submit|preventDefault={handleSubmit} class="form" enctype="multipart/form-data">
    <div class="form-row">
      <div class="form-group">
        <label for="name">Name *</label>
        <input
          bind:value={formData.name}
          id="name"
          type="text"
          placeholder="Character name"
          required
        />
      </div>

      <div class="form-group">
        <label for="dragon">Dragon *</label>
        <input
          bind:value={formData.dragon}
          id="dragon"
          type="text"
          placeholder="Dragon name"
          required
        />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="race">Race *</label>
        <select bind:value={formData.race} id="race" required>
          {#each races as race}
            <option value={race}>{race}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label for="country">Country *</label>
        <select bind:value={formData.country} id="country" required>
          {#each countries as country}
            <option value={country}>{country}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="title">Title</label>
        <input
          bind:value={formData.title}
          id="title"
          type="text"
          placeholder="Character title"
        />
      </div>

      <div class="form-group">
        <label for="theme">Theme</label>
        <input
          bind:value={formData.theme}
          id="theme"
          type="text"
          placeholder="Character theme"
        />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="flux">Flux</label>
        <input
          bind:value={formData.flux}
          id="flux"
          type="text"
          placeholder="Flux information"
        />
      </div>

      <div class="form-group">
        <label for="category">Category *</label>
        <input
          bind:value={formData.category}
          id="category"
          type="text"
          placeholder="Character category"
          required
        />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="visibility">Visibility *</label>
        <input
          bind:value={formData.visibility}
          id="visibility"
          type="number"
          min="0"
          max="10"
          required
        />
      </div>

      <div class="form-group">
        <label for="current">Current *</label>
        <input
          bind:value={formData.current}
          id="current"
          type="number"
          min="0"
          max="10"
          required
        />
      </div>
    </div>

    <div class="form-group">
      <label for="image">Image *</label>
      <input
        id="image"
        type="file"
        accept="image/*"
        on:change={handleFileChange}
        required
      />
    </div>

    <div class="form-group">
      <label for="description">Description *</label>
      <textarea
        bind:value={formData.description}
        id="description"
        placeholder="Character description"
        rows="4"
        required
      ></textarea>
    </div>

    <div class="form-actions">
      <button
        type="submit"
        class="btn btn-primary"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Character'}
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
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .form-row {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }

  .form-group {
    flex: 1;
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

  .form-actions {
    display: flex;
    justify-content: flex-start;
    margin-top: 24px;
  }

  .btn {
    display: inline-block;
    padding: 10px 20px;
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
    .form-row {
      flex-direction: column;
      gap: 0;
    }
  }
</style>