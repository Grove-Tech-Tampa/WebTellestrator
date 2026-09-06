export class BrushEngine {
  static getPixelSize(ctx, size) {
    return size * ctx.canvas.width;
  }

  static getPixelPoint(ctx, point) {
    return {
      x: point.x * ctx.canvas.width,
      y: point.y * ctx.canvas.height,
      pressure: (point.pressure !== undefined && point.pressure > 0) ? point.pressure : 0.5
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
          ctx.lineWidth = pSize * 0.6;
          ctx.globalAlpha = opacity !== undefined ? opacity : 0.85;
          break;
        case 'marker':
          ctx.lineWidth = pSize * 2.0;
          ctx.globalAlpha = opacity !== undefined ? opacity : 0.4;
          break;
        case 'brush':
          ctx.lineWidth = pSize;
          ctx.globalAlpha = opacity !== undefined ? opacity : 0.9;
          break;
        default:
          ctx.lineWidth = pSize;
          ctx.globalAlpha = opacity !== undefined ? opacity : 1.0;
      }
    }
  }

  static continueStroke(ctx, fromPoint, toPoint, controlPoint, config) {
    const { tool, size, usePressure = true } = config;
    const pSize = BrushEngine.getPixelSize(ctx, size);
    
    const pFrom = BrushEngine.getPixelPoint(ctx, fromPoint);
    const pTo = BrushEngine.getPixelPoint(ctx, toPoint);
    const pCp = BrushEngine.getPixelPoint(ctx, controlPoint);
    
    const rawPressure = (pFrom.pressure + pTo.pressure) / 2;
    const pressure = usePressure ? rawPressure : 0.5;

    if (usePressure) {
      if (tool === 'brush') {
        ctx.lineWidth = pSize * (0.3 + pressure * 1.4);
      } else if (tool === 'pen' || tool === 'eraser') {
        ctx.lineWidth = pSize * (0.4 + pressure * 1.2);
      } else if (tool === 'pencil') {
        ctx.lineWidth = pSize * 0.6 * (0.5 + pressure * 1.0);
      } else if (tool === 'marker') {
        ctx.lineWidth = pSize * 2.0 * (0.7 + pressure * 0.6);
      }
    } else {
      if (tool === 'brush') ctx.lineWidth = pSize;
      else if (tool === 'pen' || tool === 'eraser') ctx.lineWidth = pSize;
      else if (tool === 'pencil') ctx.lineWidth = pSize * 0.6;
      else if (tool === 'marker') ctx.lineWidth = pSize * 2.0;
    }

    ctx.beginPath();
    ctx.moveTo(pFrom.x, pFrom.y);

    if (tool === 'pencil') {
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
    const { tool, color, size, opacity, usePressure = true } = config;
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
        default:
          ctx.globalAlpha = opacity !== undefined ? opacity : 1.0;
      }
    }

    const pressure = usePressure ? pPt.pressure : 0.5;
    let radius = pSize / 2;
    
    if (tool === 'marker') radius = pSize * (usePressure ? (0.7 + pressure * 0.6) : 1.0);
    else if (tool === 'pencil') radius = pSize * 0.3 * (usePressure ? (0.5 + pressure * 1.0) : 1.0);
    else if (tool === 'brush') radius = (pSize / 2) * (usePressure ? (0.3 + pressure * 1.4) : 1.0);
    else if (tool === 'pen' || tool === 'eraser') radius = (pSize / 2) * (usePressure ? (0.4 + pressure * 1.2) : 1.0);

    ctx.beginPath();
    ctx.arc(pPt.x, pPt.y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1.0;
  }
}
