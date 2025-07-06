// File: backend-main/api/login.js

import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Cors from 'cors';

// Inisialisasi middleware CORS
// Ganti '*' dengan URL Vercel frontend Anda untuk keamanan yang lebih baik
// Contoh: 'https://nama-proyek-frontend-anda.vercel.app'
const cors = Cors({
  methods: ['POST', 'GET', 'HEAD', 'OPTIONS'],
  origin: process.env.FRONTEND_URL || '*', 
});

// Helper untuk menjalankan middleware di lingkungan serverless
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Konfigurasi Database dan Model (tetap sama)
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

const User = sequelize.define('User', {
  username: { type: Sequelize.STRING, allowNull: false, unique: true },
  password: { type: Sequelize.STRING, allowNull: false },
  namaLengkap: { type: Sequelize.STRING, allowNull: true }
}, {
  tableName: 'Users',
  timestamps: false
});

User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Handler utama
export default async function handler(req, res) {
  console.log(`[LOG] /api/login function invoked with method: ${req.method}`);
  
  try {
    // Jalankan middleware CORS
    await runMiddleware(req, res, cors);
    
    console.log('[LOG] CORS middleware passed.');

    // Logika login Anda dimulai di sini
    if (req.method === 'POST') {
      await sequelize.authenticate();
      console.log('[LOG] Database connection successful.');

      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: 'Username dan password diperlukan.' });
      }

      const user = await User.findOne({ where: { username: username } });

      if (!user || !(await user.validatePassword(password))) {
        return res.status(401).json({ message: 'Login gagal. Periksa username dan password Anda.' });
      }

      const payload = { id: user.id, username: user.username, namaLengkap: user.namaLengkap };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

      return res.status(200).json({ message: 'Login berhasil!', user: payload, token });
    } else {
      // Untuk metode selain POST (misalnya GET atau preflight OPTIONS), cukup kembalikan status OK
      res.status(200).json({ message: 'OK' });
    }

  } catch (error) {
    console.error('[FATAL] Error in /api/login handler:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}