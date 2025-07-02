// app.js
require('dotenv').config(); // 1. Muat environment variables dari .env
const express = require('express'); // 2. Impor Express
const cors = require('cors'); // 3. Impor CORS
const db = require('./models'); // 4. Impor setup database dan model Sequelize

// 5. Impor file-file rute Anda
const authRoutes = require('./routes/authRoutes.js');
const attributeRoutes = require('./routes/attributeRoutes.js'); 
//const criteriaRoutes = require('./routes/criteriaRoutes.js'); // SUDAH DIIMPOR
const applicantRoutes = require('./routes/applicantRoutes.js');
const selectionRoutes = require('./routes/selectionRoutes.js');
const reportRoutes = require('./routes/reportRoutes.js');
const selectionBatchRoutes = require('./routes/selectionBatchRoutes.js');

const app = express(); // 6. BUAT INSTANCE APLIKASI EXPRESS DI SINI

// 7. Gunakan Middleware GLOBAL (dijalankan untuk setiap request)
app.use(cors()); // Aktifkan CORS untuk semua origin
app.use(express.json()); // Middleware untuk parsing body request JSON
app.use(express.urlencoded({ extended: true })); // Middleware untuk parsing body request URL-encoded

// (Opsional) Middleware untuk logging request body (sementara untuk debugging jika diperlukan)
/*
app.use((req, res, next) => {
  console.log('-----------------------------------');
  console.log('Request Masuk ke:', req.method, req.originalUrl);
  console.log('Request Headers Content-Type:', req.headers['content-type']);
  console.log('Request Body SEBELUM RUTE:', req.body);
  console.log('-----------------------------------');
  next();
});
*/

// 8. Tes koneksi database (opsional, tapi baik untuk debugging awal)
db.sequelize.authenticate()
  .then(() => console.log('Koneksi database berhasil.'))
  .catch(err => console.error('Tidak bisa konek ke database:', err.message));

// 9. Sinkronisasi database (opsional, lebih baik gunakan migrasi untuk production)
// db.sequelize.sync({ alter: true })
//  .then(() => console.log('Database tersinkronisasi dengan model.'))
//  .catch(err => console.error('Gagal sinkronisasi database:', err));

// 10. Rute dasar untuk tes API
app.get('/', (req, res) => {
  res.json({ message: 'Selamat Datang di API SPK Beasiswa v1.0 - Backend Aktif!' });
});

// 11. Gunakan (pasang) rute-rute yang sudah diimpor
// Semua rute di authRoutes akan diawali /api/auth
app.use('/api/auth', authRoutes); 
// Semua rute di criteriaRoutes akan diawali /api/criteria
//app.use('/api/criteria', criteriaRoutes); //app.use('/api/attributes', attributeRoutes);
app.use('/api/attributes', attributeRoutes);
 app.use('/api/applicants', applicantRoutes); 
app.use('/api/selection', selectionRoutes);
app.use('/api/batches', selectionBatchRoutes);
app.use('/api/reports', reportRoutes);

// 12. Middleware penanganan error sederhana (harus diletakkan di akhir setelah semua rute)
app.use((err, req, res, next) => {
  console.error("Error Stack:", err.stack); 
  res.status(err.status || 500).send({ 
    error: {
      message: err.message || 'Terjadi kesalahan internal pada server!',
      // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined // Opsional: tampilkan stack trace di dev
    }
  });
});

// 13. Ekspor instance app agar bisa digunakan oleh server.js
module.exports = app;