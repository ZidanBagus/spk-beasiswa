// routes/applicantRoutes.js
const express = require('express');
const router = express.Router();
const applicantController = require('../controllers/applicantController');
const { protect } = require('../middlewares/authMiddleware');
const multer = require('multer'); // Pastikan multer diimpor

// Konfigurasi Multer untuk menyimpan file di memory (sebagai buffer)
const storage = multer.memoryStorage(); 
const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Filter hanya file excel
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Format file tidak didukung! Hanya file Excel (.xlsx, .xls) yang diizinkan.'), false);
        }
    },
    limits: {
        fileSize: 1024 * 1024 * 5 // Batas ukuran file 5MB (sesuaikan jika perlu)
    }
});

router.use(protect); // Terapkan middleware protect ke semua rute di bawah ini

// Rute CRUD yang sudah ada
router.post('/', applicantController.createApplicant);
router.get('/', applicantController.getAllApplicants);
router.get('/stats', applicantController.getApplicantStats); // Rute statistik
router.get('/:id', applicantController.getApplicantById);
router.put('/:id', applicantController.updateApplicant);
router.delete('/:id', applicantController.deleteApplicant);

// Rute untuk UPLOAD EXCEL (AKTIFKAN BARIS INI)
router.post('/upload', upload.single('excelFile'), applicantController.uploadApplicants); 

// Middleware penanganan error spesifik untuk multer (PENTING untuk diaktifkan juga)
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: `File terlalu besar. Maksimal 5MB.` }); // Sesuaikan dengan batas Anda
        }
        return res.status(400).json({ message: `Multer error: ${err.message}` });
    } else if (err) {
        // Ini akan menangkap error dari fileFilter juga
        return res.status(400).json({ message: err.message });
    }
    // Jika bukan error multer atau fileFilter, lanjutkan ke error handler Express berikutnya
    // Jika tidak ada error handler lain, Express akan menangani sebagai error internal
    next(err); 
});

module.exports = router;