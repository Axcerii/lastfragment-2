<script lang="ts">
  import { goto } from '$app/navigation';
  import type { CreateMonsterData } from '$lib/types';

  let formData: CreateMonsterData = {
    visibility: 1,
    name: '',
    dragon: '',
    size: '',
    weight: '',
    dangerosity: 1,
    effect: '',
    description: '',
    current: 1
  };

  let imageFile: File | null = null;
  let imagePreview: string = '';
  let loading: boolean = false;
  let error: string = '';

  function handleImageChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      imageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      imageFile = null;
      imagePreview = '';
    }
  }

  async function handleSubmit(): Promise<void> {
    if (!formData.name || !formData.dragon || !formData.size || 
        !formData.weight || !formData.effect || !formData.description) {
      error = 'Please fill in all required fields';
      return;
    }
    if (!imageFile) {
      error = 'Please select an image';
      return;
    }

    loading = true;
    error = '';

    try {
      const submitFormData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        submitFormData.append(key, value.toString());
      });
      submitFormData.append('image', imageFile);

      const response = await fetch('/api/monsters', {
        method: 'POST',
        body: submitFormData
      });

      if (response.ok) {
        goto('/monsters');
      } else {
        const result = await response.json();
        error = result.error || 'Failed to create monster';
      }
    } catch (err) {
      error = 'Failed to create monster';
      console.error(err);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Add New Monster</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>Add New Monster</h1>
    <a href="/monsters" class="btn btn-secondary">Back to Monsters</a>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="form" enctype="multipart/form-data">
    <!-- Basic Information -->
    <div class="form-section">
      <h2>Basic Information</h2>
      <div class="form-row">
        <div class="form-group">
          <label for="name">Name *</label>
          <input bind:value={formData.name} id="name" type="text" required />
        </div>
        <div class="form-group">
          <label for="dragon">Dragon *</label>
          <input bind:value={formData.dragon} id="dragon" type="text" required />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="size">Size *</label>
          <input bind:value={formData.size} id="size" type="text" required />
        </div>
        <div class="form-group">
          <label for="weight">Weight *</label>
          <input bind:value={formData.weight} id="weight" type="text" required />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="dangerosity">Dangerosity *</label>
          <input bind:value={formData.dangerosity} id="dangerosity" type="number" min="1" max="10" required />
        </div>
        <div class="form-group">
          <label for="visibility">Visibility *</label>
          <input bind:value={formData.visibility} id="visibility" type="number" min="0" max="10" required />
        </div>
      </div>
      <div class="form-group">
        <label for="current">Current *</label>
        <input bind:value={formData.current} id="current" type="number" min="0" max="10" required />
      </div>
    </div>

    <!-- Image -->
    <div class="form-section">
      <h2>Image</h2>
      <div class="form-group">
        <label for="image">Monster Image *</label>
        <input id="image" type="file" accept="image/*" on:change={handleImageChange} required />
        {#if imagePreview}
          <div class="image-preview"><img src={imagePreview} alt="Preview" /></div>
        {/if}
      </div>
    </div>

    <!-- Details -->
    <div class="form-section">
      <h2>Details</h2>
      <div class="form-group">
        <label for="effect">Effect *</label>
        <textarea bind:value={formData.effect} id="effect" required></textarea>
      </div>
      <div class="form-group">
        <label for="description">Description *</label>
        <textarea bind:value={formData.description} id="description" required></textarea>
      </div>
    </div>

    <div class="form-actions">
      <button type="submit" class="btn btn-primary" disabled={loading}>
        {loading ? 'Creating...' : 'Create Monster'}
      </button>
    </div>
  </form>
</div>

<style>
  .container { max-width: 800px; margin: 0 auto; padding: 20px; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  h1 { font-size: 2rem; font-weight: bold; color: #1f2937; }
  .error-message { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; }
  .form { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
  .form-section { padding: 24px; border-bottom: 1px solid #e5e7eb; }
  .form-section:last-child { border-bottom: none; }
  h2 { font-size: 1.25rem; font-weight: 600; margin-bottom: 20px; color: #1f2937; }
  .form-row { display: flex; gap: 16px; margin-bottom: 16px; }
  .form-group { flex: 1; margin-bottom: 16px; }
  label { display: block; font-weight: 500; margin-bottom: 6px; }
  input, textarea { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; }
  input:focus, textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  textarea { resize: vertical; min-height: 80px; }
  .image-preview { margin-top: 16px; text-align: center; }
  .image-preview img { max-width: 100%; max-height: 200px; border-radius: 6px; }
  .form-actions { padding: 24px; background: #f9fafb; display: flex; }
  .btn { padding: 12px 24px; border-radius: 6px; font-size: 0.875rem; font-weight: 500; cursor: pointer; }
  .btn-primary { background: #3b82f6; color: white; } .btn-primary:hover { background: #2563eb; }
  .btn-secondary { background: #6b7280; color: white; } .btn-secondary:hover { background: #4b5563; }
</style>
