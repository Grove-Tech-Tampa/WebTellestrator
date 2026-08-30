export class CanvasHistory {
  constructor(maxStates = 20) {
    this.maxStates = maxStates;
    this.histories = new Map();
  }

  // Helper to get or create history for an imageId
  _getHistory(imageId) {
    if (!this.histories.has(imageId)) {
      this.histories.set(imageId, { states: [], currentIndex: -1 });
    }
    return this.histories.get(imageId);
  }

  pushState(imageId, canvas) {
    const history = this._getHistory(imageId);
    
    // Truncate redo states
    if (history.currentIndex < history.states.length - 1) {
      history.states = history.states.slice(0, history.currentIndex + 1);
    }
    
    // Add new state
    const dataUrl = canvas.toDataURL();
    history.states.push(dataUrl);
    
    // Enforce max states limit
    if (history.states.length > this.maxStates) {
      history.states.shift();
    } else {
      history.currentIndex++;
    }
  }

  undo(imageId) {
    const history = this._getHistory(imageId);
    if (history.currentIndex > 0) {
      history.currentIndex--;
      return history.states[history.currentIndex];
    } else if (history.currentIndex === 0) {
      history.currentIndex = -1;
      return null; // Represents empty canvas state (before any drawing)
    }
    return null;
  }

  redo(imageId) {
    const history = this._getHistory(imageId);
    if (history.currentIndex < history.states.length - 1) {
      history.currentIndex++;
      return history.states[history.currentIndex];
    }
    return null;
  }

  canUndo(imageId) {
    const history = this._getHistory(imageId);
    return history.currentIndex >= 0;
  }

  canRedo(imageId) {
    const history = this._getHistory(imageId);
    return history.currentIndex < history.states.length - 1;
  }

  clearHistory(imageId) {
    this.histories.delete(imageId);
  }

  clearAll() {
    this.histories.clear();
  }
}
