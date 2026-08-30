// Telestrator - Socket.IO Client Wrapper
// Handles connection, reconnection, and event management

import { EVENTS } from './constants.js';

export class SocketClient {
  constructor() {
    this.socket = null;
    this.sessionPin = null;
    this.role = null; // 'presenter' or 'viewer'
    this.listeners = new Map();
    this.connected = false;
    this.onConnectionChange = null;
  }

  connect(role, pin) {
    this.role = role;
    this.sessionPin = pin;

    // Socket.IO is loaded via script tag
    this.socket = io({
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log(`[Socket] Connected as ${role}`);
      if (this.onConnectionChange) this.onConnectionChange(true);

      // Join session
      this.socket.emit(EVENTS.SESSION_JOIN, { pin, role });
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log(`[Socket] Disconnected: ${reason}`);
      if (this.onConnectionChange) this.onConnectionChange(false);
    });

    this.socket.on('reconnect', () => {
      console.log('[Socket] Reconnected, rejoining session...');
      this.socket.emit(EVENTS.SESSION_JOIN, { pin: this.sessionPin, role: this.role });
    });

    this.socket.on(EVENTS.SESSION_ERROR, (data) => {
      console.error('[Socket] Session error:', data.message);
      if (this.onSessionError) this.onSessionError(data.message);
    });

    this.socket.on(EVENTS.SESSION_JOINED, (data) => {
      console.log('[Socket] Joined session:', data);
      if (this.onSessionJoined) this.onSessionJoined(data);
    });

    // Re-register all listeners
    for (const [event, callbacks] of this.listeners) {
      for (const cb of callbacks) {
        this.socket.on(event, cb);
      }
    }

    return this;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
    return this;
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const cbs = this.listeners.get(event);
      const idx = cbs.indexOf(callback);
      if (idx !== -1) cbs.splice(idx, 1);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
    return this;
  }

  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
    return this;
  }

  // Volatile emit - for high-frequency data like stroke movements
  // Dropped if the client falls behind
  emitVolatile(event, data) {
    if (this.socket && this.connected) {
      this.socket.volatile.emit(event, data);
    }
    return this;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.connected;
  }
}
