import { BrushEngine } from './BrushEngine.js';
import { StampEngine } from './StampEngine.js';
import { CanvasHistory } from './CanvasHistory.js';

export class DrawingEngine {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = {
      mode: 'presenter', // 'presenter' | 'viewer'
      width: 1920,
      height: 1080,
      ...options
    };
    
    this.activePointerId = null;
    this.isDrawing = false;
    this.currentTool = 'pen';
    this.currentColor = '#FF3B30';
    this.currentSize = 5;
    this.currentOpacity = 1.0;
    this.points = [];
    
    this.allowTouchInput = true;
    this.allowStylusInput = true;
    
    this.annotationSnapshots = new Map(); // Map<imageId, dataURL>
    this.history = new CanvasHistory();
    this.stampEngine = new StampEngine();

    // Callbacks
    this.onStrokeStart = () => {};
    this.onStrokeMove = () => {};
    this.onStrokeEnd = () => {};
    this.onStampPlace = () => {};

    // Bound event listeners
    this._handlePointerDown = this.handlePointerDown.bind(this);
    this._handlePointerMove = this.handlePointerMove.bind(this);
    this._handlePointerUp = this.handlePointerUp.bind(this);
    this._handlePointerCancel = this.handlePointerCancel.bind(this);
    this._handleResize = this.handleResize.bind(this);

    this.init();
  }

  on(event, cb) {
    if (event === 'stroke:start') this.onStrokeStart = cb;
    else if (event === 'stroke:move') this.onStrokeMove = cb;
    else if (event === 'stroke:end') this.onStrokeEnd = cb;
    else if (event === 'stamp:place') this.onStampPlace = cb;
    return this;
  }
  
  init() {
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
    
    // Background canvas
    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.style.position = 'absolute';
    this.bgCanvas.style.top = '0';
    this.bgCanvas.style.left = '0';
    this.bgCanvas.style.width = '100%';
    this.bgCanvas.style.height = '100%';
    this.bgCtx = this.bgCanvas.getContext('2d', { alpha: false });
    
    // Drawing canvas
    this.drawCanvas = document.createElement('canvas');
    this.drawCanvas.style.position = 'absolute';
    this.drawCanvas.style.top = '0';
    this.drawCanvas.style.left = '0';
    this.drawCanvas.style.width = '100%';
    this.drawCanvas.style.height = '100%';
    this.drawCanvas.style.touchAction = 'none'; // Critical for pointer events
    this.drawCtx = this.drawCanvas.getContext('2d', { desynchronized: true, alpha: true });
    
    this.container.appendChild(this.bgCanvas);
    this.container.appendChild(this.drawCanvas);
    
    this.handleResize();
    window.addEventListener('resize', this._handleResize);
    
    if (this.options.mode === 'presenter') {
      this.drawCanvas.addEventListener('pointerdown', this._handlePointerDown);
      this.drawCanvas.addEventListener('pointermove', this._handlePointerMove);
      this.drawCanvas.addEventListener('pointerup', this._handlePointerUp);
      this.drawCanvas.addEventListener('pointercancel', this._handlePointerCancel);
      this.drawCanvas.addEventListener('pointerout', this._handlePointerUp);
    }
  }

  handleResize() {
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Maintain aspect ratio fitting inside container
    const aspect = this.options.width / this.options.height;
    let cw = rect.width;
    let ch = rect.width / aspect;
    
    if (ch > rect.height) {
      ch = rect.height;
      cw = rect.height * aspect;
    }
    
    // Center canvases
    const left = (rect.width - cw) / 2;
    const top = (rect.height - ch) / 2;
    
    [this.bgCanvas, this.drawCanvas].forEach(c => {
      c.style.width = `${cw}px`;
      c.style.height = `${ch}px`;
      c.style.left = `${left}px`;
      c.style.top = `${top}px`;
      
      c.width = cw * dpr;
      c.height = ch * dpr;
    });
    
    // Redraw background image after resize clears canvas
    this.renderBgImage();

    // Restore annotations if present after resize clears canvas
    if (this.currentSnapshot) {
      this.restoreFromSnapshot(this.currentSnapshot);
    }
  }

  renderBgImage() {
    if (!this.currentBgImg || !this.bgCanvas) return;
    this.clearBackground();
    const cw = this.bgCanvas.width;
    const ch = this.bgCanvas.height;
    const imgAspect = this.currentBgImg.width / this.currentBgImg.height;
    const canvasAspect = cw / ch;
    let dw = cw, dh = ch, dx = 0, dy = 0;
    if (imgAspect > canvasAspect) {
      dh = cw / imgAspect;
      dy = (ch - dh) / 2;
    } else {
      dw = ch * imgAspect;
      dx = (cw - dw) / 2;
    }
    this.bgCtx.drawImage(this.currentBgImg, dx, dy, dw, dh);
  }

  setBackgroundImage(url) {
    if (!url) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.currentBgImg = img;
        this.currentImageUrl = url;
        this.clearBackground();
        const cw = this.bgCanvas.width;
        const ch = this.bgCanvas.height;
        
        // Fit image maintaining aspect ratio
        const imgAspect = img.width / img.height;
        const canvasAspect = cw / ch;
        
        let dw = cw;
        let dh = ch;
        let dx = 0;
        let dy = 0;
        
        if (imgAspect > canvasAspect) {
          dh = cw / imgAspect;
          dy = (ch - dh) / 2;
        } else {
          dw = ch * imgAspect;
          dx = (cw - dw) / 2;
        }
        
        this.bgCtx.drawImage(img, dx, dy, dw, dh);
        resolve();
      };
      img.onerror = (err) => {
        console.error('Failed to load background image:', url, err);
        reject(err);
      };
      img.src = url;
    });
  }

  clearBackground() {
    this.bgCtx.fillStyle = '#000000';
    this.bgCtx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
  }

  setTool(toolName) { this.currentTool = toolName; }
  setStampType(stamp) { 
    this.currentTool = stamp; 
    if (this.stampEngine) this.stampEngine.setType(stamp);
  }
  setColor(color) { this.currentColor = color; }
  setSize(size) { this.currentSize = size; }
  setOpacity(opacity) { this.currentOpacity = opacity; }

  setAllowTouchInput(allowed) { this.allowTouchInput = !!allowed; }
  setAllowStylusInput(allowed) { this.allowStylusInput = !!allowed; }

  // Snapshot handling
  saveAnnotationSnapshot(imageId) {
    const dataUrl = this.drawCanvas.toDataURL();
    this.annotationSnapshots.set(imageId, dataUrl);
    this.currentSnapshot = dataUrl;
  }
  
  restoreAnnotationSnapshot(imageId) {
    const dataUrl = this.annotationSnapshots.get(imageId);
    if (dataUrl) {
      return this.restoreFromSnapshot(dataUrl);
    } else {
      this.clearAnnotations();
      return Promise.resolve();
    }
  }
  
  getAnnotationSnapshot() {
    return this.drawCanvas.toDataURL();
  }
  
  clearAnnotations() {
    if (this.drawCtx && this.drawCanvas) {
      this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
    }
    this.currentSnapshot = null;
  }
  
  hasAnnotations(imageId) {
    return this.annotationSnapshots.has(imageId);
  }

  restoreFromSnapshot(dataUrl) {
    if (!dataUrl) {
      this.clearAnnotations();
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (this.drawCtx && this.drawCanvas) {
          this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
          this.drawCtx.drawImage(img, 0, 0, this.drawCanvas.width, this.drawCanvas.height);
        }
        this.currentSnapshot = dataUrl;
        resolve();
      };
      img.onerror = () => {
        this.clearAnnotations();
        resolve();
      };
      img.src = dataUrl;
    });
  }

  getCompositeDataURL() {
    const compCanvas = document.createElement('canvas');
    compCanvas.width = this.bgCanvas.width;
    compCanvas.height = this.bgCanvas.height;
    const ctx = compCanvas.getContext('2d');
    
    ctx.drawImage(this.bgCanvas, 0, 0);
    ctx.drawImage(this.drawCanvas, 0, 0);
    return compCanvas.toDataURL('image/jpeg', 0.9);
  }

  // Pointer event handlers
  normalizeEvent(e) {
    const rect = this.drawCanvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      pressure: e.pressure !== undefined ? e.pressure : 0.5
    };
  }

  handlePointerDown(e) {
    // User-configured input toggles (Finger touch vs Apple Pencil / Stylus)
    if (!this.allowTouchInput && e.pointerType === 'touch') return;
    if (!this.allowStylusInput && e.pointerType === 'pen') return;

    // Palm rejection / multi-touch prevention
    if (this.activePointerId !== null) return;
    if (e.pointerType === 'pen' && e.pressure === 0) return; // Hover protection
    if (e.pointerType === 'touch' && (e.width > 25 || e.height > 25)) return; // Palm rejection

    this.activePointerId = e.pointerId;
    this.drawCanvas.setPointerCapture(e.pointerId);

    const normPt = this.normalizeEvent(e);
    this.points = [normPt];

    if (this.isStampTool(this.currentTool)) {
      const stampData = this.stampEngine.placeStamp(
        this.drawCtx, this.currentTool, normPt.x, normPt.y, this.currentSize / 1000, this.currentColor
      );
      this.currentSnapshot = this.drawCanvas.toDataURL();
      this.onStampPlace(stampData);
      this.activePointerId = null; // Stamping is a one-tap action
    } else {
      this.isDrawing = true;
      const config = this.getBrushConfig();
      BrushEngine.beginStroke(this.drawCtx, normPt, config);
      
      this.onStrokeStart({
        tool: this.currentTool,
        color: this.currentColor,
        size: this.currentSize,
        opacity: this.currentOpacity,
        point: normPt
      });
    }
  }

  handlePointerMove(e) {
    if (!this.isDrawing || e.pointerId !== this.activePointerId) return;

    // Use getCoalescedEvents for higher frequency points if available
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    
    const config = this.getBrushConfig();
    const newPoints = [];

    events.forEach(evt => {
      const normPt = this.normalizeEvent(evt);
      this.points.push(normPt);
      newPoints.push(normPt);

      if (this.points.length >= 3) {
        const p1 = this.points[this.points.length - 3];
        const p2 = this.points[this.points.length - 2];
        const p3 = this.points[this.points.length - 1];
        
        // Midpoint for smoother curve
        const cp = p2;
        const to = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
        const from = this.points.length === 3 ? p1 : { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

        BrushEngine.continueStroke(this.drawCtx, from, to, cp, config);
      }
    });

    if (newPoints.length > 0) {
      this.onStrokeMove({ points: newPoints });
    }
  }

  handlePointerUp(e) {
    if (e.pointerId !== this.activePointerId) return;
    
    if (this.isDrawing) {
      // If just a tap (only 1 point), draw a dot
      if (this.points.length === 1) {
        BrushEngine.drawDot(this.drawCtx, this.points[0], this.getBrushConfig());
      }
      BrushEngine.endStroke(this.drawCtx, this.getBrushConfig());
      this.isDrawing = false;
      this.currentSnapshot = this.drawCanvas.toDataURL();
      this.onStrokeEnd();
    }
    
    this.activePointerId = null;
    this.points = [];
  }

  handlePointerCancel(e) {
    this.handlePointerUp(e);
  }

  isStampTool(tool) {
    return ['arrow', 'circle', 'rectangle', 'star', 'checkmark', 'xmark', 'number'].includes(tool);
  }

  getBrushConfig() {
    const normalizedSize = this.currentSize / 1000;
    return {
      tool: this.currentTool,
      color: this.currentColor,
      size: normalizedSize,
      opacity: this.currentOpacity,
      pressureSensitivity: 0.5
    };
  }

  // Replay for viewers
  replayStrokeStart(data) {
    const { tool, color, size, opacity, point } = data;
    const config = { tool, color, size: size / 1000, opacity, pressureSensitivity: 0.5 };
    BrushEngine.beginStroke(this.drawCtx, point, config);
    this.replayPoints = [point];
    this.replayConfig = config;
  }

  replayStrokeMove(data) {
    if (!this.replayPoints) return;
    data.points.forEach(pt => {
      this.replayPoints.push(pt);
      if (this.replayPoints.length >= 3) {
        const p1 = this.replayPoints[this.replayPoints.length - 3];
        const p2 = this.replayPoints[this.replayPoints.length - 2];
        const p3 = this.replayPoints[this.replayPoints.length - 1];
        
        const cp = p2;
        const to = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
        const from = this.replayPoints.length === 3 ? p1 : { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

        BrushEngine.continueStroke(this.drawCtx, from, to, cp, this.replayConfig);
      }
    });
  }

  replayStrokeEnd() {
    if (this.replayPoints && this.replayPoints.length === 1) {
      BrushEngine.drawDot(this.drawCtx, this.replayPoints[0], this.replayConfig);
    }
    if (this.replayConfig) {
      BrushEngine.endStroke(this.drawCtx, this.replayConfig);
    }
    this.replayPoints = null;
    this.replayConfig = null;
    this.currentSnapshot = this.drawCanvas.toDataURL();
  }

  replayStampPlace(data) {
    const { type, x, y, size, color, number } = data;
    this.stampEngine.placeStamp(this.drawCtx, type, x, y, size / 1000, color, number);
    this.currentSnapshot = this.drawCanvas.toDataURL();
  }

  destroy() {
    window.removeEventListener('resize', this._handleResize);
    if (this.options.mode === 'presenter') {
      this.drawCanvas.removeEventListener('pointerdown', this._handlePointerDown);
      this.drawCanvas.removeEventListener('pointermove', this._handlePointerMove);
      this.drawCanvas.removeEventListener('pointerup', this._handlePointerUp);
      this.drawCanvas.removeEventListener('pointercancel', this._handlePointerCancel);
      this.drawCanvas.removeEventListener('pointerout', this._handlePointerUp);
    }
    if (this.container.contains(this.bgCanvas)) this.container.removeChild(this.bgCanvas);
    if (this.container.contains(this.drawCanvas)) this.container.removeChild(this.drawCanvas);
  }
}
