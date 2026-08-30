export class ColorPicker {
  constructor(elementId, callbacks) {
    this.modal = document.getElementById(elementId);
    this.callbacks = callbacks;
    this.canvas = document.getElementById('hsl-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.preview = document.getElementById('color-preview');
    this.hexInput = document.getElementById('hex-input');
    this.opacitySlider = document.getElementById('cp-opacity');
    
    this.applyBtn = document.getElementById('cp-apply');
    this.cancelBtn = document.getElementById('cp-cancel');
    
    this.currentColor = '#ffffff';
    this.currentOpacity = 1;
    this.isDragging = false;
    
    this.init();
  }

  init() {
    this.applyBtn.addEventListener('click', () => {
      this.callbacks.onColorSelect(this.currentColor, this.currentOpacity);
      this.close();
    });
    
    this.cancelBtn.addEventListener('click', () => this.close());
    
    this.hexInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        this.currentColor = val;
        this.updatePreview();
      }
    });

    this.opacitySlider.addEventListener('input', (e) => {
      this.currentOpacity = parseInt(e.target.value) / 100;
      this.updatePreview();
    });

    const handlePick = (e) => {
      if (!this.isDragging && e.type !== 'mousedown' && e.type !== 'touchstart') return;
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      const pixel = this.ctx.getImageData(x, y, 1, 1).data;
      if (pixel[3] > 0) { // If not transparent
        this.currentColor = '#' + [pixel[0], pixel[1], pixel[2]].map(x => {
          const hex = x.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        }).join('');
        this.hexInput.value = this.currentColor;
        this.updatePreview();
      }
    };

    this.canvas.addEventListener('mousedown', (e) => { this.isDragging = true; handlePick(e); });
    this.canvas.addEventListener('mousemove', handlePick);
    this.canvas.addEventListener('mouseup', () => { this.isDragging = false; });
    this.canvas.addEventListener('mouseleave', () => { this.isDragging = false; });
    
    this.canvas.addEventListener('touchstart', (e) => { this.isDragging = true; handlePick(e); });
    this.canvas.addEventListener('touchmove', handlePick);
    this.canvas.addEventListener('touchend', () => { this.isDragging = false; });
  }

  open(color, opacity, favorites = []) {
    this.currentColor = color;
    this.currentOpacity = opacity;
    this.hexInput.value = color;
    this.opacitySlider.value = opacity * 100;
    this.updatePreview();
    this.renderHSLWheel();
    this.modal.classList.add('show');
  }

  close() {
    this.modal.classList.remove('show');
  }

  updatePreview() {
    this.preview.style.backgroundColor = this.currentColor;
    this.preview.style.opacity = this.currentOpacity;
  }

  renderHSLWheel() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY);
    
    this.ctx.clearRect(0, 0, width, height);
    
    // Draw wheel
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = (angle - 2) * Math.PI / 180;
      const endAngle = (angle + 2) * Math.PI / 180;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      this.ctx.closePath();
      this.ctx.fillStyle = `hsl(${angle}, 100%, 50%)`;
      this.ctx.fill();
    }
    
    // Draw white/black gradient overlay to complete color wheel
    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.9, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
}
