import { SocketClient } from '../shared/SocketClient.js';
import { EVENTS } from '../shared/constants.js';
import { DrawingEngine } from '../canvas/DrawingEngine.js';
import { ToolPanel } from './ToolPanel.js';
import { ColorPicker } from './ColorPicker.js';
import { CollectionManager } from './CollectionManager.js';
import { NavigationMode } from './NavigationMode.js';

class PresenterApp {
  constructor() {
    this.init();
  }

  async init() {
    // 1. Get/Generate PIN
    const urlParams = new URLSearchParams(window.location.search);
    let pin = urlParams.get('pin');
    if (!pin) {
      pin = Math.floor(1000 + Math.random() * 9000).toString();
      window.history.replaceState({}, '', `?pin=${pin}`);
    }
    document.getElementById('pin-display').textContent = `PIN: ${pin}`;

    // 2. Setup Drawing Engine
    const canvasContainer = document.getElementById('canvas-container');
    this.drawingEngine = new DrawingEngine(canvasContainer, { mode: 'presenter' });

    // 3. Setup Socket
    this.socket = new SocketClient();

    // 4. Setup ToolPanel
    this.toolPanel = new ToolPanel('tool-dock', {
      onToolChange: (tool) => this.drawingEngine.setTool(tool),
      onColorChange: (color) => this.drawingEngine.setColor(color),
      onSizeChange: (size) => this.drawingEngine.setSize(size),
      onOpacityChange: (opacity) => this.drawingEngine.setOpacity(opacity),
      onClear: () => {
        this.drawingEngine.clearAnnotations();
        const currId = this.navMode && this.navMode.images[this.navMode.currentIndex] 
          ? this.navMode.images[this.navMode.currentIndex].id 
          : null;
        this.socket.emit(EVENTS.CANVAS_CLEAR, { imageId: currId });
        this.sendSnapshot();
      },
      onUndo: () => {
        if (this.drawingEngine.history) {
          const currIdx = this.navMode ? this.navMode.currentIndex : 0;
          const snapshot = this.drawingEngine.history.undo(currIdx);
          if (snapshot) {
            this.drawingEngine.restoreFromSnapshot(snapshot);
            this.sendSnapshot();
          }
        }
      },
      onRedo: () => {
        if (this.drawingEngine.history) {
          const currIdx = this.navMode ? this.navMode.currentIndex : 0;
          const snapshot = this.drawingEngine.history.redo(currIdx);
          if (snapshot) {
            this.drawingEngine.restoreFromSnapshot(snapshot);
            this.sendSnapshot();
          }
        }
      },
      onStampTypeChange: (stamp) => this.drawingEngine.setStampType(stamp),
      onResetStampNumber: () => {
        if (this.drawingEngine && this.drawingEngine.stampEngine) {
          this.drawingEngine.stampEngine.resetNumberCounter();
        }
      },
      onOpenColorPicker: () => {
        this.colorPicker.open(this.drawingEngine.currentColor, this.drawingEngine.currentOpacity);
      },
      onToggleLibrary: () => this.collectionManager.open()
    });

    // 5. Setup ColorPicker
    this.colorPicker = new ColorPicker('color-picker-modal', {
      onColorSelect: (color, opacity) => {
        this.drawingEngine.setColor(color);
        this.drawingEngine.setOpacity(opacity);
        this.toolPanel.setColor(color);
        this.toolPanel.setOpacity(opacity);
      }
    });

    // 6. Setup NavigationMode
    const savedNavMode = localStorage.getItem('telestrator_nav_mode') || 'button';
    const savedUsePressure = localStorage.getItem('telestrator_use_pressure') !== 'false';
    this.drawingEngine.setUsePressure(savedUsePressure);

    this.navMode = new NavigationMode({
      mode: savedNavMode,
      drawingEngine: this.drawingEngine,
      onImageChange: (image, index, total, prevImageId, prevSnapshot) => {
        const counterEl = document.getElementById('image-counter');
        if (counterEl) counterEl.textContent = `${index + 1} of ${total}`;
        const currentSnapshot = this.drawingEngine.getAnnotationSnapshot();
        this.socket.emit(EVENTS.IMAGE_CHANGE, { 
          imageId: image.id,
          imageUrl: image.url, 
          previousImageId: prevImageId,
          annotationSnapshot: prevSnapshot,
          annotations: currentSnapshot 
        });
      }
    });

    // 7. Setup CollectionManager
    this.collectionManager = new CollectionManager('side-panel', {
      onImageSelect: (images, index) => {
        this.navMode.setImages(images);
        this.navMode.goTo(index);
      }
    });

    // 8. Wire drawing engine events to socket
    this.drawingEngine.on('stroke:start', (data) => this.socket.emit(EVENTS.STROKE_START, data));
    this.drawingEngine.on('stroke:move', (data) => this.socket.emitVolatile(EVENTS.STROKE_MOVE, data));
    this.drawingEngine.on('stroke:end', () => {
      this.socket.emit(EVENTS.STROKE_END);
      const currIdx = this.navMode ? this.navMode.currentIndex : 0;
      if (this.drawingEngine.history) {
        this.drawingEngine.history.pushState(currIdx, this.drawingEngine.drawCanvas);
      }
    });
    this.drawingEngine.on('stamp:place', (data) => this.socket.emit(EVENTS.STAMP_PLACE, data));

    // Connect socket to server
    this.socket.connect('presenter', pin);

    // 9. Settings modal listeners
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const navModeSelect = document.getElementById('nav-mode-select');
    const toggleFingerInput = document.getElementById('toggle-finger-input');
    const toggleStylusInput = document.getElementById('toggle-stylus-input');
    const togglePressureInput = document.getElementById('toggle-pressure-input');

    if (settingsBtn && settingsModal) {
      settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('show');
      });
    }
    if (closeSettingsBtn && settingsModal) {
      closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('show');
      });
    }
    if (navModeSelect) {
      navModeSelect.value = savedNavMode;
      navModeSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        this.navMode.setMode(val);
        localStorage.setItem('telestrator_nav_mode', val);
      });
    }
    if (toggleFingerInput) {
      toggleFingerInput.addEventListener('change', (e) => {
        this.drawingEngine.setAllowTouchInput(e.target.checked);
      });
    }
    if (toggleStylusInput) {
      toggleStylusInput.addEventListener('change', (e) => {
        this.drawingEngine.setAllowStylusInput(e.target.checked);
      });
    }
    if (togglePressureInput) {
      togglePressureInput.checked = savedUsePressure;
      togglePressureInput.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        this.drawingEngine.setUsePressure(enabled);
        localStorage.setItem('telestrator_use_pressure', enabled ? 'true' : 'false');
      });
    }

    // Sync state for late joiners every 5 seconds
    setInterval(() => this.sendSnapshot(), 5000);
  }

  sendSnapshot() {
    if (this.drawingEngine && this.socket && this.navMode && this.navMode.images[this.navMode.currentIndex]) {
      const currentImage = this.navMode.images[this.navMode.currentIndex];
      const snapshot = this.drawingEngine.getAnnotationSnapshot();
      if (snapshot) {
        this.socket.emit(EVENTS.CANVAS_SNAPSHOT, { 
          imageId: currentImage.id, 
          snapshot 
        });
      }
    }
  }
}

// Start app
window.addEventListener('DOMContentLoaded', () => {
  new PresenterApp();
});
