    'use strict';
    const express = require('express');
    const router = express.Router();
    const selectionBatchController = require('../controllers/selectionBatchController');
    const { protect } = require('../middlewares/authMiddleware');

    // Semua rute di bawah ini memerlukan login
    router.use(protect);

    // GET /api/batches - Mendapatkan semua riwayat batch pengujian
    router.get('/', selectionBatchController.getAllBatches);

    module.exports = router;
    