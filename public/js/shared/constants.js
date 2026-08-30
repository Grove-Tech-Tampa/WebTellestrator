// Telestrator - Shared Constants
// Used by both presenter and viewer clients

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;
export const ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT;

// Socket event names
export const EVENTS = {
  // Session
  SESSION_CREATE: 'session:create',
  SESSION_JOIN: 'session:join',
  SESSION_JOINED: 'session:joined',
  SESSION_ERROR: 'session:error',
  SESSION_PRESENTER_JOINED: 'session:presenter-joined',
  SESSION_PRESENTER_LEFT: 'session:presenter-left',

  // Drawing
  STROKE_START: 'stroke:start',
  STROKE_MOVE: 'stroke:move',
  STROKE_END: 'stroke:end',
  CANVAS_CLEAR: 'canvas:clear',
  CANVAS_SNAPSHOT: 'canvas:snapshot',
  CANVAS_RESTORE: 'canvas:restore',

  // Stamps
  STAMP_PLACE: 'stamp:place',

  // Images
  IMAGE_CHANGE: 'image:change',
  IMAGE_ANNOTATIONS: 'image:annotations',

  // NDI
  NDI_TOGGLE: 'ndi:toggle',
  NDI_STATUS: 'ndi:status',
};

// Drawing tools
export const TOOLS = {
  PEN: 'pen',
  PENCIL: 'pencil',
  MARKER: 'marker',
  BRUSH: 'brush',
  ERASER: 'eraser',
  STAMP: 'stamp',
};

// Stamp types
export const STAMPS = {
  ARROW: 'arrow',
  CIRCLE: 'circle',
  RECTANGLE: 'rectangle',
  STAR: 'star',
  CHECKMARK: 'checkmark',
  XMARK: 'xmark',
  NUMBER: 'number',
};

// Default tool settings
export const DEFAULTS = {
  TOOL: TOOLS.PEN,
  COLOR: '#FF3B30',
  SIZE: 4,
  OPACITY: 1.0,
  PRESSURE_SENSITIVITY: true,
};

// Preset colors optimized for projection readability
export const PRESET_COLORS = [
  '#FF3B30', // Red
  '#FF9500', // Orange
  '#FFCC00', // Yellow
  '#34C759', // Green
  '#00C7BE', // Teal
  '#30B0C7', // Cyan
  '#007AFF', // Blue
  '#5856D6', // Indigo
  '#AF52DE', // Purple
  '#FF2D55', // Pink
  '#FFFFFF', // White
  '#8E8E93', // Gray
];

// Brush configs
export const BRUSH_CONFIGS = {
  [TOOLS.PEN]: {
    name: 'Pen',
    icon: '✒️',
    minSize: 1,
    maxSize: 20,
    defaultSize: 4,
    defaultOpacity: 1.0,
    pressureSensitivity: 0.5,
    smoothing: 0.3,
    compositeOp: 'source-over',
  },
  [TOOLS.PENCIL]: {
    name: 'Pencil',
    icon: '✏️',
    minSize: 1,
    maxSize: 10,
    defaultSize: 2,
    defaultOpacity: 0.85,
    pressureSensitivity: 0.7,
    smoothing: 0.1,
    compositeOp: 'source-over',
  },
  [TOOLS.MARKER]: {
    name: 'Marker',
    icon: '🖍️',
    minSize: 10,
    maxSize: 60,
    defaultSize: 25,
    defaultOpacity: 0.4,
    pressureSensitivity: 0.2,
    smoothing: 0.5,
    compositeOp: 'source-over',
  },
  [TOOLS.BRUSH]: {
    name: 'Brush',
    icon: '🖌️',
    minSize: 2,
    maxSize: 40,
    defaultSize: 8,
    defaultOpacity: 0.9,
    pressureSensitivity: 0.8,
    smoothing: 0.4,
    compositeOp: 'source-over',
  },
  [TOOLS.ERASER]: {
    name: 'Eraser',
    icon: '🧽',
    minSize: 5,
    maxSize: 80,
    defaultSize: 20,
    defaultOpacity: 1.0,
    pressureSensitivity: 0.3,
    smoothing: 0.2,
    compositeOp: 'destination-out',
  },
};

// Navigation modes
export const NAV_MODES = {
  SWIPE: 'swipe',
  BUTTON: 'button',
};
