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

// In-memory cache to prevent frequent disk writes
let cachedViewers = null;
let lastDiskWriteTime = 0;

function readJSON(filepath, defaultData) {
  if (cachedViewers) return cachedViewers;
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (fs.existsSync(filepath)) {
      const raw = fs.readFileSync(filepath, 'utf8');
      cachedViewers = JSON.parse(raw);
      return cachedViewers;
    }
  } catch (err) {
    console.error(`Error reading ${filepath}:`, err);
  }
  // Initialize default file if missing
  cachedViewers = defaultData;
  writeJSON(filepath, defaultData);
  return defaultData;
}

function writeJSON(filepath, data) {
  cachedViewers = data;
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    lastDiskWriteTime = Date.now();
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
      const now = new Date();
      const last = viewer.lastSeen ? new Date(viewer.lastSeen) : 0;
      const timeDiff = (now - last) / 1000;
      
      viewer.lastSeen = now.toISOString();
      if (ip) viewer.lastIp = ip;

      // Throttle disk writes: only persist to JSON if > 60 seconds have elapsed or IP changed
      if (timeDiff > 60 || (ip && viewer.lastIp !== ip)) {
        writeJSON(knownViewersPath, viewers);
      }
      return viewer;
    }
    return null;
  }
}

module.exports = new KnownViewerService();
