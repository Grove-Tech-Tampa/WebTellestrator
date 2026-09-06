const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function uuidv4() {
  return crypto.randomBytes(16).toString('hex');
}

const dataDir = path.join(__dirname, '../data');
const knownViewersPath = path.join(dataDir, 'known_viewers.json');

const defaultViewers = [
  {
    id: 'v_spurgeon',
    name: 'Spurgeon',
    pin: '1001',
    createdAt: new Date().toISOString(),
    lastSeen: null,
    lastIp: null
  },
  {
    id: 'v_whitfield',
    name: 'Whitfield',
    pin: '1002',
    createdAt: new Date().toISOString(),
    lastSeen: null,
    lastIp: null
  }
];

function readJSON(filepath, defaultData) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (fs.existsSync(filepath)) {
      const raw = fs.readFileSync(filepath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`Error reading ${filepath}:`, err);
  }
  // Initialize default file if missing
  writeJSON(filepath, defaultData);
  return defaultData;
}

function writeJSON(filepath, data) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${filepath}:`, err);
  }
}

class KnownViewerService {
  getAllKnownViewers() {
    return readJSON(knownViewersPath, defaultViewers);
  }

  getKnownViewerById(id) {
    const viewers = this.getAllKnownViewers();
    return viewers.find(v => v.id === id);
  }

  getKnownViewerByPin(pin) {
    const viewers = this.getAllKnownViewers();
    return viewers.find(v => v.pin === pin);
  }

  registerKnownViewer(data) {
    const { name, pin, ip } = data;
    if (!name || !pin) return null;

    const viewers = this.getAllKnownViewers();
    
    // Check if pin is already assigned
    let existing = viewers.find(v => v.pin === pin || v.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      existing.name = name;
      existing.pin = pin;
      if (ip) existing.lastIp = ip;
      existing.lastSeen = new Date().toISOString();
      writeJSON(knownViewersPath, viewers);
      return existing;
    }

    const newViewer = {
      id: 'v_' + uuidv4().substring(0, 8),
      name,
      pin,
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      lastIp: ip || null
    };

    viewers.push(newViewer);
    writeJSON(knownViewersPath, viewers);
    return newViewer;
  }

  updateKnownViewer(id, data) {
    const viewers = this.getAllKnownViewers();
    const idx = viewers.findIndex(v => v.id === id);
    if (idx !== -1) {
      if (data.name) viewers[idx].name = data.name;
      if (data.pin) viewers[idx].pin = data.pin;
      writeJSON(knownViewersPath, viewers);
      return viewers[idx];
    }
    return null;
  }

  deleteKnownViewer(id) {
    let viewers = this.getAllKnownViewers();
    const initialLen = viewers.length;
    viewers = viewers.filter(v => v.id !== id);
    if (viewers.length !== initialLen) {
      writeJSON(knownViewersPath, viewers);
      return true;
    }
    return false;
  }

  touchKnownViewer(pin, ip) {
    const viewers = this.getAllKnownViewers();
    const viewer = viewers.find(v => v.pin === pin);
    if (viewer) {
      viewer.lastSeen = new Date().toISOString();
      if (ip) viewer.lastIp = ip;
      writeJSON(knownViewersPath, viewers);
      return viewer;
    }
    return null;
  }
}

module.exports = new KnownViewerService();
