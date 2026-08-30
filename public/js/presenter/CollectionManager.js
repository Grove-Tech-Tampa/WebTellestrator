export class CollectionManager {
  constructor(panelId, callbacks) {
    this.panel = document.getElementById(panelId);
    this.overlay = document.getElementById('side-panel-overlay');
    this.callbacks = callbacks; // { onImageSelect, onPanelToggle }
    
    this.closeBtn = document.getElementById('close-panel-btn');
    this.collectionSelect = document.getElementById('collection-select');
    this.addCollectionBtn = document.getElementById('add-collection-btn');
    this.deleteCollectionBtn = document.getElementById('delete-collection-btn');
    this.uploadZone = document.getElementById('upload-zone');
    this.fileInput = document.getElementById('file-input');
    this.imageGrid = document.getElementById('image-grid');
    
    this.collections = [];
    this.currentCollection = null;
    this.images = [];
    
    this.init();
  }

  init() {
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());
    if (this.overlay) this.overlay.addEventListener('click', () => this.close());
    
    if (this.uploadZone && this.fileInput) {
      this.uploadZone.addEventListener('click', () => this.fileInput.click());
      
      // Drag & Drop
      this.uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.uploadZone.classList.add('drag-over');
      });
      this.uploadZone.addEventListener('dragleave', () => {
        this.uploadZone.classList.remove('drag-over');
      });
      this.uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.uploadZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
          this.uploadImages(e.dataTransfer.files);
        }
      });
      
      this.fileInput.addEventListener('change', () => {
        if (this.fileInput.files.length > 0) {
          this.uploadImages(this.fileInput.files);
        }
      });
    }

    if (this.collectionSelect) {
      this.collectionSelect.addEventListener('change', (e) => {
        const id = e.target.value;
        if (id) {
          this.selectCollection(id);
        } else {
          this.images = [];
          this.renderThumbnails();
        }
      });
    }

    if (this.addCollectionBtn) {
      this.addCollectionBtn.addEventListener('click', () => {
        const name = prompt('Enter collection name:', 'New Collection');
        if (name) this.createCollection(name);
      });
    }

    if (this.deleteCollectionBtn) {
      this.deleteCollectionBtn.addEventListener('click', () => {
        if (this.currentCollection) {
          if (confirm(`Delete collection "${this.currentCollection.name}" and all its photos?`)) {
            this.deleteCollection(this.currentCollection.id);
          }
        }
      });
    }
    
    this.loadCollections();
  }

  open() {
    if (this.panel) this.panel.classList.add('open');
    if (this.overlay) this.overlay.classList.add('show');
    if (this.callbacks.onPanelToggle) this.callbacks.onPanelToggle(true);
  }

  close() {
    if (this.panel) this.panel.classList.remove('open');
    if (this.overlay) this.overlay.classList.remove('show');
    if (this.callbacks.onPanelToggle) this.callbacks.onPanelToggle(false);
  }

  async loadCollections() {
    try {
      const res = await fetch('/api/collections');
      if (res.ok) {
        this.collections = await res.json();
        if (this.collections.length === 0) {
          // Auto create a default collection
          await this.createCollection('Main Presentation');
        } else {
          this.renderCollectionOptions();
          this.selectCollection(this.collections[0].id);
        }
      }
    } catch(e) {
      console.error('Failed to load collections', e);
    }
  }

  renderCollectionOptions() {
    if (!this.collectionSelect) return;
    this.collectionSelect.innerHTML = '<option value="">Select Collection</option>';
    this.collections.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      this.collectionSelect.appendChild(opt);
    });
    if (this.currentCollection) {
      this.collectionSelect.value = this.currentCollection.id;
    }
  }

  async createCollection(name) {
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const c = await res.json();
        this.collections.push(c);
        this.currentCollection = c;
        this.renderCollectionOptions();
        await this.selectCollection(c.id);
      }
    } catch(e) {
      console.error('Failed to create collection', e);
    }
  }

  async deleteCollection(id) {
    try {
      const res = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
      if (res.ok) {
        this.collections = this.collections.filter(c => c.id !== id);
        this.currentCollection = null;
        this.images = [];
        if (this.collections.length === 0) {
          await this.createCollection('Main Presentation');
        } else {
          this.renderCollectionOptions();
          await this.selectCollection(this.collections[0].id);
        }
      }
    } catch(e) {
      console.error('Failed to delete collection', e);
    }
  }

  async selectCollection(id) {
    this.currentCollection = this.collections.find(c => c.id === id);
    if (this.collectionSelect) this.collectionSelect.value = id;
    try {
      const res = await fetch(`/api/collections/${id}/images`);
      if (res.ok) {
        this.images = await res.json();
        this.renderThumbnails();
        if (this.images.length > 0 && !this.hasSelectedInitial) {
          this.hasSelectedInitial = true;
          this.callbacks.onImageSelect(this.images, 0);
        }
      }
    } catch(e) {
      console.error('Failed to fetch collection images', e);
    }
  }

  async uploadImages(files) {
    if (!this.currentCollection) {
      await this.createCollection('Main Presentation');
    }
    const formData = new FormData();
    for (const file of files) {
      formData.append('images', file);
    }
    
    try {
      const res = await fetch(`/api/collections/${this.currentCollection.id}/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const newImages = await res.json();
        this.images.push(...newImages);
        this.renderThumbnails();
        if (this.fileInput) this.fileInput.value = '';
      }
    } catch(e) {
      console.error('Upload failed', e);
    }
  }

  async deleteImage(imageId) {
    if (!this.currentCollection) return;
    try {
      const res = await fetch(`/api/collections/${this.currentCollection.id}/images/${imageId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const deletedIdx = this.images.findIndex(img => img.id === imageId);
        this.images = this.images.filter(img => img.id !== imageId);
        this.renderThumbnails();
        if (this.images.length > 0) {
          const nextIdx = Math.min(deletedIdx, this.images.length - 1);
          this.callbacks.onImageSelect(this.images, nextIdx >= 0 ? nextIdx : 0);
        } else {
          if (this.callbacks.onImageSelect) {
            this.callbacks.onImageSelect([], -1);
          }
        }
      }
    } catch(e) {
      console.error('Failed to delete image', e);
    }
  }

  async saveReorder() {
    if (!this.currentCollection) return;
    try {
      await fetch(`/api/collections/${this.currentCollection.id}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds: this.images.map(img => img.id) })
      });
    } catch(e) {
      console.error('Failed to save reorder', e);
    }
  }

  renderThumbnails() {
    if (!this.imageGrid) return;
    this.imageGrid.innerHTML = '';
    this.images.forEach((img, idx) => {
      const el = document.createElement('div');
      el.className = 'image-thumbnail';
      el.style.backgroundImage = `url(${img.url})`;
      el.dataset.id = img.id;
      el.draggable = true;
      
      const delBtn = document.createElement('button');
      delBtn.className = 'thumb-delete-btn';
      delBtn.innerHTML = '✕';
      delBtn.title = 'Delete photo';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this photo?')) {
          this.deleteImage(img.id);
        }
      });
      el.appendChild(delBtn);

      el.addEventListener('click', () => {
        this.callbacks.onImageSelect(this.images, idx);
        this.close();
      });
      
      // Simple DnD reorder
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', idx.toString());
      });
      el.addEventListener('dragover', (e) => e.preventDefault());
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
        const toIdx = idx;
        if (!isNaN(fromIdx) && fromIdx !== toIdx) {
          const [moved] = this.images.splice(fromIdx, 1);
          this.images.splice(toIdx, 0, moved);
          this.renderThumbnails();
          this.callbacks.onImageSelect(this.images, toIdx);
          this.saveReorder();
        }
      });
      
      this.imageGrid.appendChild(el);
    });
  }
}
