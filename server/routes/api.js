const express = require('express');
const router = express.Router();
const collectionService = require('../services/collectionService');
const knownViewerService = require('../services/knownViewerService');
const socketService = require('../services/socketService');

// Collections
router.get('/collections', (req, res) => {
  res.json(collectionService.getAllCollections());
});

router.post('/collections', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const collection = collectionService.createCollection(name);
  res.status(201).json(collection);
});

router.put('/collections/:id', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const collection = collectionService.updateCollection(req.params.id, name);
  if (collection) res.json(collection);
  else res.status(404).json({ error: 'Collection not found' });
});

router.delete('/collections/:id', (req, res) => {
  const success = collectionService.deleteCollection(req.params.id);
  if (success) res.status(204).end();
  else res.status(404).json({ error: 'Collection not found' });
});

// Images
router.get('/collections/:id/images', (req, res) => {
  const collection = collectionService.getCollection(req.params.id);
  if (collection) {
    const imagesWithUrl = collection.images.map(img => ({
      ...img,
      url: `/uploads/${img.filename}`
    }));
    res.json(imagesWithUrl);
  } else {
    res.status(404).json({ error: 'Collection not found' });
  }
});

router.put('/collections/:id/reorder', (req, res) => {
  const { imageIds } = req.body;
  if (!Array.isArray(imageIds)) return res.status(400).json({ error: 'imageIds must be an array' });
  const collection = collectionService.reorderImages(req.params.id, imageIds);
  if (collection) res.json(collection);
  else res.status(404).json({ error: 'Collection not found' });
});

router.delete('/collections/:id/images/:imageId', (req, res) => {
  const success = collectionService.removeImage(req.params.id, req.params.imageId);
  if (success) res.status(204).end();
  else res.status(404).json({ error: 'Image not found' });
});

// Favorites
router.get('/favorites', (req, res) => {
  res.json(collectionService.getFavorites());
});

router.put('/favorites', (req, res) => {
  const favorites = collectionService.updateFavorites(req.body);
  res.json(favorites);
});

// Known Viewer Devices
router.get('/known-viewers', (req, res) => {
  const viewers = knownViewerService.getAllKnownViewers();
  const enriched = viewers.map(v => {
    const sessionInfo = socketService.getPinSessionInfo ? socketService.getPinSessionInfo(v.pin) : { isOnline: false, viewerCount: 0 };
    return {
      ...v,
      isOnline: sessionInfo.isOnline,
      viewerCount: sessionInfo.viewerCount,
      hasPresenter: sessionInfo.hasPresenter
    };
  });
  res.json(enriched);
});

router.post('/known-viewers', (req, res) => {
  const { name, pin } = req.body;
  if (!name || !pin) return res.status(400).json({ error: 'Name and PIN are required' });
  const clientIp = req.ip || req.connection.remoteAddress;
  const viewer = knownViewerService.registerKnownViewer({ name, pin: String(pin).trim(), ip: clientIp });
  res.status(201).json(viewer);
});

router.put('/known-viewers/:id', (req, res) => {
  const { name, pin } = req.body;
  const viewer = knownViewerService.updateKnownViewer(req.params.id, { name, pin: pin ? String(pin).trim() : undefined });
  if (viewer) res.json(viewer);
  else res.status(404).json({ error: 'Viewer device not found' });
});

router.delete('/known-viewers/:id', (req, res) => {
  const success = knownViewerService.deleteKnownViewer(req.params.id);
  if (success) res.status(204).end();
  else res.status(404).json({ error: 'Viewer device not found' });
});

module.exports = router;
