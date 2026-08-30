export class BrushEngine {
  static getPixelSize(ctx, size) {
    return size * ctx.canvas.width;
  }

  static getPixelPoint(ctx, point) {
    return {
      x: point.x * ctx.canvas.width,
      y: point.y * ctx.canvas.height,
      pressure: point.pressure !== undefined ? point.pressure : 0.5
    };
  }

  static beginStroke(ctx, point, config) {
    const { tool, color, size, opacity } = config;
    const pSize = BrushEngine.getPixelSize(ctx, size);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
      ctx.lineWidth = pSize;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      
      switch (tool) {
        case 'pen':
          ctx.lineWidth = pSize;
          ctx.globalAlpha = opacity !== undefined ? opacity : 1.0;
          break;
        case 'pencil':
          ctx.lineWidth = pSize * 0.6; // Thinner
          ctx.globalAlpha = opacity !== undefined ? opacity : 0.85;
          break;
        case 'marker':
          ctx.lineWidth = pSize * 2.0; // Wider
          ctx.globalAlpha = opacity !== undefined ? opacity : 0.4;
          break;
        case 'brush':
          // Width handled in continueStroke
          ctx.globalAlpha = opacity !== undefined ? opacity : 0.9;
          break;
        default:
          ctx.lineWidth = pSize;
          ctx.globalAlpha = opacity !== undefined ? opacity : 1.0;
      }
    }
  }

  static continueStroke(ctx, fromPoint, toPoint, controlPoint, config) {
    const { tool, size, pressureSensitivity = 0.5 } = config;
    const pSize = BrushEngine.getPixelSize(ctx, size);
    
    const pFrom = BrushEngine.getPixelPoint(ctx, fromPoint);
    const pTo = BrushEngine.getPixelPoint(ctx, toPoint);
    const pCp = BrushEngine.getPixelPoint(ctx, controlPoint);
    
    const pressure = (pFrom.pressure + pTo.pressure) / 2;
    
    if (tool === 'brush') {
      ctx.lineWidth = pSize * (0.2 + pressure * pressureSensitivity * 2);
    } else if (tool === 'pen' || tool === 'eraser') {
      // slight pressure sensitivity for pen
      ctx.lineWidth = pSize * (0.8 + pressure * pressureSensitivity * 0.4);
    }

    ctx.beginPath();
    ctx.moveTo(pFrom.x, pFrom.y);

    if (tool === 'pencil') {
      // Add slight randomness to control point for rough edge effect
      const noise = pSize * 0.2;
      const rx = (Math.random() - 0.5) * noise;
      const ry = (Math.random() - 0.5) * noise;
      ctx.quadraticCurveTo(pCp.x + rx, pCp.y + ry, pTo.x, pTo.y);
    } else {
      ctx.quadraticCurveTo(pCp.x, pCp.y, pTo.x, pTo.y);
    }
    
    ctx.stroke();
  }

  static endStroke(ctx, config) {
    if (config.tool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1.0;
  }

  static drawDot(ctx, point, config) {
    const { tool, color, size, opacity } = config;
    const pSize = BrushEngine.getPixelSize(ctx, size);
    const pPt = BrushEngine.getPixelPoint(ctx, point);
    
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.globalAlpha = 1;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = color;
      
      switch (tool) {
        case 'pencil':
          ctx.globalAlpha = opacity !== undefined ? opacity : 0.85;
          break;
        case 'marker':
          ctx.globalAlpha = opacity !== undefined ? opacity : 0.4;
          break;
        case 'brush':
          ctx.globalAlpha = opacity !== undefined ? opacity : 0.9;
          break;
        default: // pen
          ctx.globalAlpha = opacity !== undefined ? opacity : 1.0;
      }
    }

    const pressure = pPt.pressure;
    let radius = pSize / 2;
    
    if (tool === 'marker') radius = pSize;
    else if (tool === 'pencil') radius = pSize * 0.3;
    else if (tool === 'brush') radius = (pSize / 2) * (0.2 + pressure * 1.0);
    else if (tool === 'pen') radius = (pSize / 2) * (0.8 + pressure * 0.4);

    ctx.beginPath();
    ctx.arc(pPt.x, pPt.y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1.0;
  }
}
