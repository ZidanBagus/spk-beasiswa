## 2. `README.md` untuk Proyek Backend (Node.js)

Buat file bernama `README.md` di **root folder proyek backend** Anda dan isi dengan kode Markdown berikut:

```markdown
# SPK Beasiswa Mahasiswa - Backend

Ini adalah RESTful API yang menjadi backend untuk aplikasi **Sistem Pendukung Keputusan (SPK) Penerimaan Beasiswa**. Dibangun di atas platform Node.js dengan framework Express.js, API ini bertanggung jawab atas semua logika bisnis, manajemen data, dan implementasi inti dari algoritma C4.5.

Backend ini menyediakan endpoint yang aman dan terstruktur untuk diakses oleh aplikasi frontend.

---

## ✨ Fitur Utama

-   **RESTful API:** Menyediakan endpoint yang jelas dan terstruktur untuk semua operasi CRUD (Create, Read, Update, Delete).
-   **Autentikasi JWT:** Mengamankan endpoint dengan JSON Web Tokens, memastikan hanya admin yang terautentikasi yang dapat mengakses data sensitif.
-   **Manajemen Data:** Berinteraksi dengan database PostgreSQL menggunakan **Sequelize ORM** untuk mengelola data pendaftar, kriteria, dan hasil seleksi.
-   **Upload File Excel:** Menggunakan **Multer** untuk menerima unggahan file dan **XLSX (SheetJS)** untuk mem-parsing data pendaftar secara massal.
-   **Logika Inti C4.5:** Mengimplementasikan aturan keputusan C4.5 dari penelitian untuk mengklasifikasikan kelayakan pendaftar.
-   **Agregasi Data:** Menyediakan endpoint khusus untuk statistik dashboard (misalnya, jumlah pendaftar per periode waktu) dan ringkasan laporan.
-   **Manajemen Skema Database:** Menggunakan migrasi dan seeder dari **Sequelize CLI** untuk mengelola struktur dan data awal database.
-   **Keamanan Password:** Menggunakan **bcrypt.js** untuk melakukan hashing pada password admin sebelum disimpan.

---

## 🛠️ Teknologi & Library

-   **Runtime Environment:** [Node.js](https://nodejs.org/)
-   **Framework:** [Express.js](https://expressjs.com/)
-   **Database:** [PostgreSQL](https://www.postgresql.org/)
-   **ORM (Object-Relational Mapper):** [Sequelize](https://sequelize.org/)
-   **Autentikasi:** [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
-   **Password Hashing:** [bcrypt.js](https://github.com/dcodeIO/bcrypt.js)
-   **File Upload:** [Multer](https://github.com/expressjs/multer)
-   **Excel Parsing:** [XLSX (SheetJS)](https://sheetjs.com/)
-   **CORS Handling:** [cors](https://github.com/expressjs/cors)
-   **Environment Variables:** [dotenv](https://github.com/motdotla/dotenv)
-   **Development Tool:** [Nodemon](https://nodemon.io/)

---

## 🚀 Persiapan dan Instalasi

Pastikan Anda memiliki **Node.js** (versi 18 atau lebih baru), **npm**, dan **server PostgreSQL** yang sudah terinstal dan berjalan.

### 1. Clone Repositori
```bash
git clone [https://github.com/NAMA_USER_ANDA/spk-beasiswa-backend.git](https://github.com/NAMA_USER_ANDA/spk-beasiswa-backend.git)
cd spk-beasiswa-backend
2. Instal Dependensi
Bash

npm install
3. Konfigurasi Database & Environment
a. Pastikan server PostgreSQL Anda berjalan.
b. Buat database baru di PostgreSQL, contohnya: spk_beasiswa_dev.
c. Salin file .env.example (jika ada) menjadi .env, atau buat file .env baru di direktori root.
d. Isi file .env dengan kredensial database Anda dan JWT secret:
env # .env PORT=5001 DATABASE_URL=postgresql://USERNAME_DB:PASSWORD_DB@localhost:5432/spk_beasiswa_dev JWT_SECRET=INI_ADALAH_KUNCI_RAHASIA_YANG_SANGAT_AMAN_DAN_PANJANG_UNTUK_TANDA_TANGAN_JWT BCRYPT_SALT_ROUNDS=10
e. Sesuaikan file config/config.json untuk environment development jika diperlukan.

4. Jalankan Migrasi & Seeder Database
Jalankan perintah ini dari root folder proyek untuk membuat semua tabel dan mengisi data awal (admin & kriteria).

Bash

npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
User admin default yang dibuat adalah: username: admin, password: [password_anda_di_seeder].

🏃 Menjalankan API Server
Mode Development
Jalankan perintah berikut untuk memulai server dengan nodemon (auto-reload saat ada perubahan file).

Bash

npm run dev
Server API akan berjalan di http://localhost:5001 (atau port lain yang didefinisikan di .env).

Mode Produksi
Bash

npm start
📁 Struktur Folder Proyek
/
|-- /config         # Konfigurasi database Sequelize
|-- /controllers    # Logika bisnis untuk setiap rute API
|-- /middlewares    # Middleware kustom (e.g., authMiddleware)
|-- /migrations     # File migrasi database Sequelize
|-- /models         # Definisi model data Sequelize
|-- /routes         # Definisi rute API
|-- /seeders        # File seeder data awal Sequelize
|-- .env            # File environment variables (diabaikan oleh Git)
|-- app.js          # File utama aplikasi Express
|-- server.js       # File untuk menjalankan server
`-- package.json
