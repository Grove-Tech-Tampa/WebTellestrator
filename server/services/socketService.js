const EVENTS = {
  SESSION_CREATE: 'session:create',
  SESSION_JOIN: 'session:join',
  SESSION_JOINED: 'session:joined',
  SESSION_ERROR: 'session:error',
  SESSION_PRESENTER_JOINED: 'session:presenter-joined',
  SESSION_PRESENTER_LEFT: 'session:presenter-left',
  STROKE_START: 'stroke:start',
  STROKE_MOVE: 'stroke:move',
  STROKE_END: 'stroke:end',
  CANVAS_CLEAR: 'canvas:clear',
  CANVAS_SNAPSHOT: 'canvas:snapshot',
  CANVAS_RESTORE: 'canvas:restore',
  STAMP_PLACE: 'stamp:place',
  IMAGE_CHANGE: 'image:change',
  IMAGE_ANNOTATIONS: 'image:annotations',
  NDI_TOGGLE: 'ndi:toggle',
  NDI_STATUS: 'ndi:status',
};

const sessions = new Map();

module.exports = function(io) {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on(EVENTS.SESSION_JOIN, (data) => {
      if (!data || !data.pin) return;
      const cleanPin = String(data.pin).trim();
      const role = data.role || 'viewer';
      
      let session = sessions.get(cleanPin);
      if (!session) {
        session = {
          pin: cleanPin,
          presenter: role === 'presenter' ? socket.id : null,
          viewers: new Set(),
          currentImageId: null,
          currentImageUrl: null,
          annotationMap: new Map() // imageId -> snapshot
        };
        sessions.set(cleanPin, session);
        console.log(`[Session Created] PIN: ${cleanPin} by ${role}`);
      }
      
      if (role === 'presenter') {
        session.presenter = socket.id;
        socket.join(cleanPin);
        socket.emit(EVENTS.SESSION_JOINED, { role, pin: cleanPin });
        socket.to(cleanPin).emit(EVENTS.SESSION_PRESENTER_JOINED);
        console.log(`[Presenter Joined] PIN: ${cleanPin}`);
      } else if (role === 'viewer') {
        session.viewers.add(socket.id);
        socket.join(cleanPin);
        socket.emit(EVENTS.SESSION_JOINED, { role, pin: cleanPin });
        console.log(`[Viewer Joined] PIN: ${cleanPin}`);
        
        // Late-join support: send current image & annotations if available
        if (session.currentImageUrl) {
          const snapshot = session.annotationMap.get(session.currentImageId);
          socket.emit(EVENTS.IMAGE_CHANGE, {
            imageId: session.currentImageId,
            imageUrl: session.currentImageUrl,
            annotations: snapshot || null
          });
        }
      }
      socket.data.pin = cleanPin;
      socket.data.role = role;
    });

    const relayEvent = (event, isVolatile = false) => {
      socket.on(event, (data) => {
        const pin = socket.data.pin;
        if (pin && socket.data.role === 'presenter') {
          if (isVolatile) {
            socket.volatile.to(pin).emit(event, data);
          } else {
            socket.to(pin).emit(event, data);
          }
        }
      });
    };

    relayEvent(EVENTS.STROKE_START);
    relayEvent(EVENTS.STROKE_MOVE, true);
    relayEvent(EVENTS.STROKE_END);
    relayEvent(EVENTS.STAMP_PLACE);

    socket.on(EVENTS.CANVAS_CLEAR, (data) => {
      const pin = socket.data.pin;
      const session = sessions.get(pin);
      const imageId = data ? data.imageId : (session ? session.currentImageId : null);
      if (session && socket.data.role === 'presenter') {
        if (imageId) {
          session.annotationMap.delete(imageId);
        }
        socket.to(pin).emit(EVENTS.CANVAS_CLEAR, { imageId });
      }
    });

    socket.on(EVENTS.IMAGE_CHANGE, (data) => {
      if (!data) return;
      const { imageId, imageUrl, previousImageId, annotationSnapshot } = data;
      const pin = socket.data.pin;
      const session = sessions.get(pin);
      if (session && socket.data.role === 'presenter') {
        if (previousImageId && annotationSnapshot) {
          session.annotationMap.set(previousImageId, annotationSnapshot);
        }
        session.currentImageId = imageId;
        session.currentImageUrl = imageUrl;
        
        const existingAnnotations = session.annotationMap.get(imageId) || null;
        socket.to(pin).emit(EVENTS.IMAGE_CHANGE, {
          imageId,
          imageUrl,
          annotations: existingAnnotations
        });
      }
    });

    socket.on(EVENTS.CANVAS_SNAPSHOT, (data) => {
      if (!data) return;
      const { imageId, snapshot } = data;
      const pin = socket.data.pin;
      const session = sessions.get(pin);
      if (session && socket.data.role === 'presenter') {
        if (imageId && snapshot) {
          session.annotationMap.set(imageId, snapshot);
        }
      }
    });

    socket.on('disconnect', () => {
      const { pin, role } = socket.data;
      if (pin) {
        const session = sessions.get(pin);
        if (session) {
          if (role === 'presenter' && session.presenter === socket.id) {
            session.presenter = null;
            socket.to(pin).emit(EVENTS.SESSION_PRESENTER_LEFT);
          } else if (role === 'viewer') {
            session.viewers.delete(socket.id);
          }
        }
      }
    });
  });
};
