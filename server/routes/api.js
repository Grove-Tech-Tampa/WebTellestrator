const express = require('express');
const router = express.Router();
const collectionService = require('../services/collectionService');

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

module.exports = router;
