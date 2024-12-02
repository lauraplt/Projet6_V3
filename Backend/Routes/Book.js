const express = require('express');
const router = express.Router();
const auth = require('../Middleware/auth');
const bookCtrl = require('../Controllers/Book');
const { upload, optimizeImage } = require('../Middleware/multer-config');

// --- Books

// Index
router.get('/', bookCtrl.getAllBooks);
router.get('/bestrating', bookCtrl.getBestRating);

// Create
router.post('/', auth, upload, optimizeImage, bookCtrl.createBook);

// Read
router.get('/:id', bookCtrl.getOneBook);

// Update
router.put('/:id', auth, upload, optimizeImage, bookCtrl.modifyBook);

// Delete
router.delete('/:id', auth, bookCtrl.deleteBook);

// --- Books -> Rating

// Create Rating
router.post('/:id/rating', auth, bookCtrl.createRating);

module.exports = router;