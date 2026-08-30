export class StampEngine {
  constructor() {
    this.nextNumber = 1;
    this.currentType = 'arrow';
    this.currentSize = 60;
    this.currentColor = '#FF3B30';
  }

  placeStamp(ctx, type, x, y, size, color, number = null) {
    const renderNumber = number !== null ? number : this.nextNumber;
    
    const cw = ctx.canvas.width;
    const ch = ctx.canvas.height;
    
    const px = x * cw;
    const py = y * ch;
    const pSize = size * cw; // scale size based on width

    ctx.save();
    switch (type) {
      case 'arrow':
        StampEngine.drawArrow(ctx, px, py, pSize, color);
        break;
      case 'circle':
        StampEngine.drawCircle(ctx, px, py, pSize, color);
        break;
      case 'rectangle':
      case 'square':
        StampEngine.drawRectangle(ctx, px, py, pSize, color);
        break;
      case 'star':
        StampEngine.drawStar(ctx, px, py, pSize, color);
        break;
      case 'checkmark':
      case 'check':
        StampEngine.drawCheckmark(ctx, px, py, pSize, color);
        break;
      case 'xmark':
      case 'cross':
        StampEngine.drawXMark(ctx, px, py, pSize, color);
        break;
      case 'number':
        StampEngine.drawNumber(ctx, px, py, pSize, color, renderNumber);
        if (number === null) this.nextNumber++; // Increment if auto-numbering
        break;
    }
    ctx.restore();

    return { type, x, y, size, color, number: renderNumber };
  }

  resetNumberCounter() {
    this.nextNumber = 1;
  }

  setType(type) {
    this.currentType = type;
  }

  setSize(size) {
    this.currentSize = size;
  }

  setColor(color) {
    this.currentColor = color;
  }

  static drawArrow(ctx, x, y, size, color) {
    const scale = size / 100;
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    ctx.beginPath();
    // Draw an upward pointing arrow
    ctx.moveTo(0, -50);
    ctx.lineTo(30, -10);
    ctx.lineTo(10, -10);
    ctx.lineTo(10, 50);
    ctx.lineTo(-10, 50);
    ctx.lineTo(-10, -10);
    ctx.lineTo(-30, -10);
    ctx.closePath();
    ctx.fill();
  }

  static drawCircle(ctx, x, y, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.1;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  static drawRectangle(ctx, x, y, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.1;
    const halfSize = size / 2;
    ctx.strokeRect(x - halfSize, y - halfSize, size, size);
  }

  static drawStar(ctx, x, y, size, color) {
    const outerRadius = size / 2;
    const innerRadius = outerRadius * 0.4;
    const spikes = 5;
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - outerRadius);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius);
      rot += step;
    }
    ctx.lineTo(x, y - outerRadius);
    ctx.closePath();
    ctx.fill();
  }

  static drawCheckmark(ctx, x, y, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y);
    ctx.lineTo(x - size * 0.1, y + size * 0.3);
    ctx.lineTo(x + size * 0.4, y - size * 0.4);
    ctx.stroke();
  }

  static drawXMark(ctx, x, y, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.15;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const hs = size * 0.35;
    ctx.moveTo(x - hs, y - hs);
    ctx.lineTo(x + hs, y + hs);
    ctx.moveTo(x + hs, y - hs);
    ctx.lineTo(x - hs, y + hs);
    ctx.stroke();
  }

  static drawNumber(ctx, x, y, size, color, number) {
    // Circle background
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${size * 0.6}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number.toString(), x, y + size * 0.05);
  }
}
