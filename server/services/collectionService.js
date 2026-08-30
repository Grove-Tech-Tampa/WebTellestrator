const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function uuidv4() {
  return crypto.randomBytes(16).toString('hex');
}

const dataDir = path.join(__dirname, '../data');
const collectionsPath = path.join(dataDir, 'collections.json');
const favoritesPath = path.join(dataDir, 'favorites.json');

function readJSON(filepath, defaultData) {
  try {
    if (fs.existsSync(filepath)) {
      const raw = fs.readFileSync(filepath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`Error reading ${filepath}:`, err);
  }
  return defaultData;
}

function writeJSON(filepath, data) {
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${filepath}:`, err);
  }
}

class CollectionService {
  getAllCollections() {
    return readJSON(collectionsPath, []);
  }

  getCollection(id) {
    const collections = this.getAllCollections();
    return collections.find(c => c.id === id);
  }

  createCollection(name) {
    const collections = this.getAllCollections();
    const newCollection = {
      id: uuidv4(),
      name,
      images: [],
      createdAt: new Date().toISOString()
    };
    collections.push(newCollection);
    writeJSON(collectionsPath, collections);
    return newCollection;
  }

  updateCollection(id, name) {
    const collections = this.getAllCollections();
    const idx = collections.findIndex(c => c.id === id);
    if (idx !== -1) {
      collections[idx].name = name;
      writeJSON(collectionsPath, collections);
      return collections[idx];
    }
    return null;
  }

  deleteCollection(id) {
    let collections = this.getAllCollections();
    const collection = collections.find(c => c.id === id);
    if (collection) {
      // Delete associated image files
      collection.images.forEach(img => {
        const filePath = path.join(__dirname, '../../public/uploads', img.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
      collections = collections.filter(c => c.id !== id);
      writeJSON(collectionsPath, collections);
      return true;
    }
    return false;
  }

  addImage(collectionId, fileData) {
    const collections = this.getAllCollections();
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      const newImage = {
        id: uuidv4(),
        filename: fileData.filename,
        originalName: fileData.originalname,
        order: collection.images.length
      };
      collection.images.push(newImage);
      writeJSON(collectionsPath, collections);
      return newImage;
    }
    return null;
  }

  removeImage(collectionId, imageId) {
    const collections = this.getAllCollections();
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      const imgIdx = collection.images.findIndex(i => i.id === imageId);
      if (imgIdx !== -1) {
        const img = collection.images[imgIdx];
        const filePath = path.join(__dirname, '../../public/uploads', img.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        collection.images.splice(imgIdx, 1);
        writeJSON(collectionsPath, collections);
        return true;
      }
    }
    return false;
  }

  reorderImages(collectionId, imageIds) {
    const collections = this.getAllCollections();
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      const imageMap = new Map();
      collection.images.forEach(img => imageMap.set(img.id, img));
      
      const newImages = [];
      imageIds.forEach((id, index) => {
        const img = imageMap.get(id);
        if (img) {
          img.order = index;
          newImages.push(img);
          imageMap.delete(id);
        }
      });
      
      // Append any remaining images
      imageMap.forEach(img => {
        img.order = newImages.length;
        newImages.push(img);
      });
      
      collection.images = newImages;
      writeJSON(collectionsPath, collections);
      return collection;
    }
    return null;
  }

  getFavorites() {
    return readJSON(favoritesPath, { colors: [], brushes: [] });
  }

  updateFavorites(data) {
    const favorites = this.getFavorites();
    if (data.colors) favorites.colors = data.colors;
    if (data.brushes) favorites.brushes = data.brushes;
    writeJSON(favoritesPath, favorites);
    return favorites;
  }
}

module.exports = new CollectionService();
