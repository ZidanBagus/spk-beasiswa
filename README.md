# SPK Beasiswa - Sistem Pendukung Keputusan Beasiswa

Sistem Pendukung Keputusan untuk seleksi beasiswa menggunakan algoritma C4.5 (Decision Tree).

## 🚀 Fitur Utama

### Frontend (React.js)
- **Dashboard Analytics** - Visualisasi data dan statistik komprehensif
- **Manajemen Data Pendaftar** - CRUD data historis pendaftar beasiswa
- **Pembagian Data** - Split data training dan testing untuk model C4.5
- **Proses Seleksi** - Training dan testing model C4.5 dengan visualisasi
- **Simulasi C4.5** - Visualisasi pohon keputusan dan prediksi tunggal
- **Laporan & Analisis** - Export laporan dalam format Excel dan PDF
- **Pengaturan Atribut** - Konfigurasi atribut untuk model C4.5

### Backend (Node.js + Express)
- **RESTful API** - Endpoint lengkap untuk semua operasi
- **Algoritma C4.5** - Implementasi decision tree dari scratch
- **Database Management** - SQLite dengan Sequelize ORM
- **File Upload** - Import data dari Excel
- **Export Features** - Generate laporan PDF dan Excel
- **Model Training** - Training dan evaluasi model C4.5

## 🛠️ Teknologi yang Digunakan

### Frontend
- React.js 18
- React Bootstrap
- React Router DOM
- Chart.js untuk visualisasi
- Axios untuk HTTP requests
- React Toastify untuk notifikasi

### Backend
- Node.js
- Express.js
- Sequelize ORM
- SQLite Database
- Multer untuk file upload
- XLSX untuk Excel processing
- jsPDF untuk PDF generation

## 📦 Instalasi

### Prerequisites
- Node.js (v14 atau lebih baru)
- npm atau yarn

### Backend Setup
```bash
cd backend-main
npm install
npm start
```

### Frontend Setup
```bash
cd my-app-main
npm install
npm start
```

## 🔧 Konfigurasi

### Environment Variables (Backend)
```env
PORT=5000
NODE_ENV=development
DB_PATH=./database.sqlite
```

### Database
Database SQLite akan dibuat otomatis saat pertama kali menjalankan backend.

## 📊 Cara Penggunaan

1. **Import Data Historis** - Upload file Excel dengan data pendaftar beasiswa
2. **Atur Atribut** - Pilih atribut yang akan digunakan untuk model C4.5
3. **Bagi Data** - Split data menjadi training dan testing set
4. **Training Model** - Bangun pohon keputusan C4.5
5. **Evaluasi Model** - Test akurasi model dengan data testing
6. **Prediksi** - Gunakan model untuk prediksi pendaftar baru
7. **Generate Laporan** - Export hasil analisis

## 🎯 Algoritma C4.5

Sistem ini mengimplementasikan algoritma C4.5 untuk:
- Menghitung Information Gain dan Gain Ratio
- Membangun pohon keputusan optimal
- Handling missing values
- Pruning untuk menghindari overfitting
- Evaluasi dengan confusion matrix

## 📈 Fitur Analytics

- **Dashboard Komprehensif** - Statistik real-time
- **Visualisasi Data** - Charts dan graphs interaktif
- **Trend Analysis** - Analisis tren penerimaan
- **Performance Metrics** - Akurasi, precision, recall, F1-score
- **Export Reports** - PDF dan Excel dengan analisis lengkap

## 🔒 Keamanan

- Input validation dan sanitization
- File upload restrictions
- Error handling yang aman
- Database query protection

## 🤝 Kontribusi

1. Fork repository ini
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📝 Lisensi

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Kontak

Project Link: [https://github.com/ZidanBagus/spk-beasiswa](https://github.com/ZidanBagus/spk-beasiswa)

## 🙏 Acknowledgments

- React.js Community
- Bootstrap Team
- Chart.js Contributors
- Node.js Community