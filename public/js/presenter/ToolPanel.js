export class ToolPanel {
  constructor(elementId, callbacks) {
    this.container = document.getElementById(elementId);
    this.callbacks = callbacks;
    this.activeTool = 'pen';
    
    this.buttons = {
      tools: this.container.querySelectorAll('[data-tool]'),
      undo: document.getElementById('undo-btn'),
      redo: document.getElementById('redo-btn'),
      clear: document.getElementById('clear-btn'),
      moreColors: document.getElementById('more-colors-btn'),
      library: document.getElementById('library-btn'),
      stampTool: document.getElementById('stamp-tool-btn')
    };

    this.sliders = {
      size: document.getElementById('size-slider'),
      opacity: document.getElementById('opacity-slider')
    };
    
    this.colorPalette = document.getElementById('color-palette');
    this.stampPicker = document.getElementById('stamp-picker');
    
    this.presetColors = [
      '#ffffff', '#ff3b5c', '#ffb84d', '#34d399',
      '#4a9eff', '#9d4edd', '#ff99c8', '#000000'
    ];
    
    this.init();
  }

  init() {
    // Tool buttons
    this.buttons.tools.forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        if (tool === 'stamp') {
          if (this.activeTool === 'stamp') {
            this.toggleStampPicker();
          } else {
            this.setActiveTool('stamp');
            this.callbacks.onToolChange('stamp');
            this.showStampPicker();
          }
        } else {
          this.setActiveTool(tool);
          this.callbacks.onToolChange(tool);
          this.hideStampPicker();
        }
      });
    });

    // Stamp picker
    if (this.stampPicker) {
      this.stampPicker.querySelectorAll('.stamp-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.id === 'stamp-reset-btn') {
            if (this.callbacks.onResetStampNumber) {
              this.callbacks.onResetStampNumber();
            }
          } else {
            const stamp = btn.dataset.stamp;
            if (stamp) {
              this.callbacks.onStampTypeChange(stamp);
              this.hideStampPicker();
            }
          }
        });
      });
    }

    // Sliders
    this.sliders.size.addEventListener('input', (e) => {
      this.callbacks.onSizeChange(parseInt(e.target.value));
    });
    
    this.sliders.opacity.addEventListener('input', (e) => {
      this.callbacks.onOpacityChange(parseInt(e.target.value) / 100);
    });

    // Actions
    this.buttons.undo.addEventListener('click', () => this.callbacks.onUndo());
    this.buttons.redo.addEventListener('click', () => this.callbacks.onRedo());
    this.buttons.clear.addEventListener('click', () => this.callbacks.onClear());
    this.buttons.moreColors.addEventListener('click', () => this.callbacks.onOpenColorPicker());
    this.buttons.library.addEventListener('click', () => this.callbacks.onToggleLibrary());

    // Double tap to collapse could be implemented here
    this.renderPalette();
  }

  renderPalette() {
    this.colorPalette.innerHTML = '';
    this.presetColors.forEach((color, idx) => {
      const circle = document.createElement('div');
      circle.className = 'color-circle' + (idx === 0 ? ' active' : '');
      circle.style.backgroundColor = color;
      circle.dataset.color = color;
      circle.addEventListener('click', () => {
        this.setColor(color);
        this.callbacks.onColorChange(color);
      });
      this.colorPalette.appendChild(circle);
    });
  }

  setActiveTool(tool) {
    this.activeTool = tool;
    this.buttons.tools.forEach(btn => {
      if (btn.dataset.tool === tool) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  setColor(color) {
    const circles = this.colorPalette.querySelectorAll('.color-circle');
    let found = false;
    circles.forEach(circle => {
      if (circle.dataset.color === color) {
        circle.classList.add('active');
        found = true;
      } else {
        circle.classList.remove('active');
      }
    });
    // Add custom color if not in palette
    if (!found) {
      const custom = document.createElement('div');
      custom.className = 'color-circle active';
      custom.style.backgroundColor = color;
      custom.dataset.color = color;
      custom.addEventListener('click', () => {
        this.setColor(color);
        this.callbacks.onColorChange(color);
      });
      this.colorPalette.appendChild(custom);
    }
  }

  setSize(size) {
    this.sliders.size.value = size;
  }

  setOpacity(opacity) {
    this.sliders.opacity.value = opacity * 100;
  }

  updateUndoRedoState(canUndo, canRedo) {
    this.buttons.undo.style.opacity = canUndo ? '1' : '0.5';
    this.buttons.redo.style.opacity = canRedo ? '1' : '0.5';
  }

  toggleStampPicker() {
    this.stampPicker.classList.toggle('show');
  }

  showStampPicker() {
    this.stampPicker.classList.add('show');
  }

  hideStampPicker() {
    this.stampPicker.classList.remove('show');
  }
}
