const express = require('express');
const router = express.Router();
const selectionController = require('../controllers/selectionController');
const { protect } = require('../middlewares/authMiddleware');

// Terapkan middleware 'protect' untuk semua rute di bawah ini
router.use(protect);

// Rute untuk melatih model dengan data latih
router.post('/train', selectionController.trainModel);

// Rute untuk menguji model dengan data uji hasil split
router.post('/test', selectionController.testModel);

// Rute untuk mengaplikasikan model ke seluruh dataset pendaftar
router.post('/test-all', selectionController.testModelOnAllData);

// Rute untuk mendapatkan visualisasi pohon keputusan
router.get('/visualize', selectionController.getTreeVisualization);

// Rute untuk melakukan prediksi pada satu kasus data
router.post('/predict-single', selectionController.predictSingle);

// Rute untuk mengecek status model apakah sudah dilatih atau belum
router.get('/model-status', selectionController.checkModelStatus);

module.exports = router;
