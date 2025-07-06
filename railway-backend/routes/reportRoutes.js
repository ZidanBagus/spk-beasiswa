// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController'); // Pastikan path ini benar
const { protect } = require('../middlewares/authMiddleware');    // Pastikan path ini benar

// GET /api/reports/results - Mendapatkan semua hasil seleksi (terproteksi)
router.get('/results', protect, reportController.getAllSelectionResults);

module.exports = router;