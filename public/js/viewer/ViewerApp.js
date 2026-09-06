import { SocketClient } from '../shared/SocketClient.js';
import { EVENTS } from '../shared/constants.js';
import { DrawingEngine } from '../canvas/DrawingEngine.js';

class ViewerApp {
  constructor() {
    this.pinOverlay = document.getElementById('pin-overlay');
    this.pinInput = document.getElementById('viewer-pin');
    this.targetSelect = document.getElementById('target-device-select');
    this.joinBtn = document.getElementById('join-btn');
    this.errorMsg = document.getElementById('error-msg');
    this.statusIndicator = document.getElementById('status-indicator');
    
    this.init();
  }

  async init() {
    // 1. Fetch Known Viewer Targets
    await this.loadKnownViewers();

    // 2. Check URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const pinParam = urlParams.get('pin');
    const savedPin = localStorage.getItem('telestrator_viewer_pin');
    
    const pinToUse = pinParam || savedPin;

    if (pinToUse) {
      this.pinInput.value = pinToUse;
      if (this.targetSelect) this.targetSelect.value = pinToUse;
      this.joinSession();
    }

    if (this.targetSelect) {
      this.targetSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) {
          this.pinInput.value = val;
          localStorage.setItem('telestrator_viewer_pin', val);
        }
      });
    }

    this.joinBtn.addEventListener('click', () => this.joinSession());
    this.pinInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.joinSession();
    });
  }

  async loadKnownViewers() {
    if (!this.targetSelect) return;
    try {
      const res = await fetch('/api/known-viewers');
      if (res.ok) {
        const viewers = await res.json();
        this.targetSelect.innerHTML = '<option value="">-- Select Target Computer --</option>';
        viewers.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v.pin;
          opt.textContent = `${v.name} (PIN: ${v.pin})`;
          this.targetSelect.appendChild(opt);
        });
      }
    } catch (e) {
      console.error('Failed to load known viewers for selection', e);
    }
  }

  joinSession() {
    const pin = this.pinInput.value.trim();
    if (!pin) return;

    localStorage.setItem('telestrator_viewer_pin', pin);

    this.joinBtn.disabled = true;
    if (this.errorMsg) this.errorMsg.classList.add('hidden');

    // Create SocketClient instance
    this.socket = new SocketClient();
    
    // Connect to drawing engine
    const container = document.getElementById('viewer-container');
    if (!this.drawingEngine) {
      this.drawingEngine = new DrawingEngine(container, { mode: 'viewer' });
    }

    // Register all socket event listeners BEFORE connect()
    this.socket.on(EVENTS.SESSION_JOINED, () => {
      if (this.pinOverlay) this.pinOverlay.classList.add('hidden');
      if (this.statusIndicator) this.statusIndicator.classList.add('connected');
    });

    this.socket.on(EVENTS.SESSION_ERROR, (data) => {
      if (this.errorMsg) {
        this.errorMsg.textContent = (data && data.message) ? data.message : 'Invalid PIN or unable to connect.';
        this.errorMsg.classList.remove('hidden');
      }
      this.joinBtn.disabled = false;
      this.socket.disconnect();
    });

    this.socket.on(EVENTS.STROKE_START, (data) => this.drawingEngine.replayStrokeStart(data));
    this.socket.on(EVENTS.STROKE_MOVE, (data) => this.drawingEngine.replayStrokeMove(data));
    this.socket.on(EVENTS.STROKE_END, () => this.drawingEngine.replayStrokeEnd());
    this.socket.on(EVENTS.STAMP_PLACE, (data) => this.drawingEngine.replayStampPlace(data));
    this.socket.on(EVENTS.CANVAS_CLEAR, () => this.drawingEngine.clearAnnotations());
    
    this.socket.on(EVENTS.IMAGE_CHANGE, (data) => {
      if (data.imageUrl) {
        this.drawingEngine.setBackgroundImage(data.imageUrl);
      }
      if (data.annotations) {
        this.drawingEngine.restoreFromSnapshot(data.annotations);
      } else {
        this.drawingEngine.clearAnnotations();
      }
    });

    this.socket.on(EVENTS.CANVAS_SNAPSHOT, (data) => {
      if (data.snapshot) {
        this.drawingEngine.restoreFromSnapshot(data.snapshot);
      }
    });

    this.socket.on('disconnect', () => {
      if (this.statusIndicator) this.statusIndicator.classList.remove('connected');
    });

    this.socket.on('connect', () => {
      if (this.pinOverlay && this.pinOverlay.classList.contains('hidden')) {
        if (this.statusIndicator) this.statusIndicator.classList.add('connected');
      }
    });

    // Now connect
    this.socket.connect('viewer', pin);
  }
}

// Start app
window.addEventListener('DOMContentLoaded', () => {
  new ViewerApp();
});
