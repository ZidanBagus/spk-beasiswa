const express = require('express');
const router = express.Router();
const attributeController = require('../controllers/attributeController');
const { protect } = require('../middlewares/authMiddleware');

// Terapkan middleware 'protect' untuk semua rute di bawah ini
router.use(protect);

// GET /api/attributes - Mendapatkan semua atribut yang tersedia
router.get('/', attributeController.getAllAttributes);

// PUT /api/attributes - Mengupdate status 'isSelected' dari beberapa atribut
router.put('/', attributeController.updateAttributes);

// GET /api/attributes/stats - Mendapatkan statistik untuk dashboard
router.get('/stats', attributeController.getAttributeStats);

module.exports = router;
