// routes/criteriaRoutes.js
const express = require('express');
const router = express.Router();
const criteriaController = require('../controllers/criteriaController');
const { protect } = require('../middlewares/authMiddleware'); // Impor middleware protect

// Semua rute di bawah ini akan diproteksi dan memerlukan token JWT yang valid

// GET /api/criteria - Mendapatkan semua kriteria
router.get('/', protect, criteriaController.getAllCriteria);

// PUT /api/criteria/:id - Mengupdate kriteria (misalnya bobot)
router.put('/:id', protect, criteriaController.updateCriteria);

// GET /api/criteria/:id - Mendapatkan satu kriteria by ID (jika Anda mengaktifkan controllernya)
// router.get('/:id', protect, criteriaController.getCriteriaById);

module.exports = router;