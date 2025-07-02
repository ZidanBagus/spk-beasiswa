// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware'); // Impor middleware protect

// POST /api/auth/login (Publik)
router.post('/login', authController.login);

// (Opsional) POST /api/auth/register (Bisa diproteksi atau untuk admin awal)
// router.post('/register', authController.register);

// GET /api/auth/me (Rute Terproteksi: hanya untuk user yang sudah login)
router.get('/me', protect, (req, res) => {
  // req.user disisipkan oleh middleware 'protect'
  if (req.user) {
    res.status(200).json({
      id: req.user.id,
      username: req.user.username,
      namaLengkap: req.user.namaLengkap
      // Jangan kirim password atau informasi sensitif lainnya
    });
  } else {
    // Seharusnya tidak terjadi jika 'protect' bekerja dengan benar
    res.status(404).json({ message: "User tidak ditemukan setelah autentikasi." });
  }
});

module.exports = router;