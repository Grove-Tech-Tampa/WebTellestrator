export class NavigationMode {
  constructor(options) {
    this.mode = options.mode || 'button';
    this.onImageChange = options.onImageChange;
    this.drawingEngine = options.drawingEngine;
    
    this.prevBtn = document.getElementById('nav-prev');
    this.nextBtn = document.getElementById('nav-next');
    
    this.images = [];
    this.currentIndex = -1;
    
    this.init();
    this.initTouchSwipe();
  }

  init() {
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prev());
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.next());
    this.updateUI();
  }

  initTouchSwipe() {
    const container = document.getElementById('canvas-container') || document.body;
    
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let touchCount = 0;

    // Touch events for mobile/iPad Safari
    container.addEventListener('touchstart', (e) => {
      touchCount = e.touches.length;
      if (e.touches.length === 1 || e.touches.length === 2) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTime = Date.now();
      }
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      if (!e.changedTouches || e.changedTouches.length === 0) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const elapsedTime = Date.now() - startTime;

      // Swipe criteria:
      // 1. Elapsed time < 600ms
      // 2. Horizontal distance |deltaX| > 45px
      // 3. Dominantly horizontal movement: |deltaX| > |deltaY| * 1.2
      if (elapsedTime < 600 && Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        const containerRect = container.getBoundingClientRect();
        const startRelX = (startX - containerRect.left) / containerRect.width;

        // Active conditions for swipe:
        // A) If mode is 'swipe'
        // B) OR if user performs a 2-finger swipe anywhere
        // C) OR if 1-finger swipe starts near outer left/right margins (outer 30%)
        const isTwoFinger = (touchCount >= 2);
        const isEdgeSwipe = (startRelX < 0.3 || startRelX > 0.7);

        if (this.mode === 'swipe' || isTwoFinger || isEdgeSwipe) {
          if (deltaX < 0) {
            this.next();
          } else {
            this.prev();
          }
        }
      }
    }, { passive: true });
  }

  setMode(mode) {
    this.mode = mode;
    this.updateUI();
  }

  setImages(images) {
    this.images = images;
    if (this.images.length > 0 && this.currentIndex === -1) {
      this.goTo(0);
    } else {
      this.updateUI();
    }
  }

  async goTo(index) {
    if (index < 0 || index >= this.images.length) return;
    
    let prevImageId = null;
    let prevSnapshot = null;

    // Save current slide annotations before switching
    if (this.currentIndex >= 0 && this.images[this.currentIndex]) {
      prevImageId = this.images[this.currentIndex].id;
      prevSnapshot = this.drawingEngine.getAnnotationSnapshot();
      this.drawingEngine.saveAnnotationSnapshot(prevImageId);
    }
    
    this.currentIndex = index;
    const newImage = this.images[index];
    
    // Change background image (async)
    if (newImage && newImage.url) {
      await this.drawingEngine.setBackgroundImage(newImage.url);
    }
    
    // Restore annotations for target image (async)
    if (newImage && newImage.id) {
      await this.drawingEngine.restoreAnnotationSnapshot(newImage.id);
    } else {
      this.drawingEngine.clearAnnotations();
    }
    
    this.updateUI();
    if (this.onImageChange) {
      this.onImageChange(newImage, index, this.images.length, prevImageId, prevSnapshot);
    }
  }

  next() {
    if (this.currentIndex < this.images.length - 1) {
      this.goTo(this.currentIndex + 1);
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.goTo(this.currentIndex - 1);
    }
  }

  updateUI() {
    if (!this.prevBtn || !this.nextBtn) return;
    if (this.mode === 'button') {
      this.prevBtn.style.display = (this.currentIndex > 0) ? 'block' : 'none';
      this.nextBtn.style.display = (this.currentIndex < this.images.length - 1) ? 'block' : 'none';
    } else {
      this.prevBtn.style.display = 'none';
      this.nextBtn.style.display = 'none';
    }
  }
}
