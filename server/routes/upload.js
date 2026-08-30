const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const collectionService = require('../services/collectionService');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter
});

// Accept both single and array upload
router.post('/collections/:id/upload', upload.any(), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  const collection = collectionService.getCollection(req.params.id);
  if (!collection) {
    return res.status(404).json({ error: 'Collection not found' });
  }

  const addedImages = [];
  for (const file of req.files) {
    const newImage = collectionService.addImage(req.params.id, file);
    if (newImage) {
      newImage.url = `/uploads/${newImage.filename}`;
      addedImages.push(newImage);
    }
  }

  res.status(201).json(addedImages);
});

module.exports = router;
