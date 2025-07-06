// api/login.js - Vercel Function for login
import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 1. Konfigurasi Koneksi Database (langsung di sini)
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

// 2. Definisi Model User (harus sama dengan di models/user.js)
const User = sequelize.define('User', {
  username: { type: Sequelize.STRING, allowNull: false, unique: true },
  password: { type: Sequelize.STRING, allowNull: false },
  namaLengkap: { type: Sequelize.STRING, allowNull: true }
}, {
  tableName: 'Users', // Pastikan nama tabel benar
  timestamps: false // Sesuaikan jika tabel Anda punya createdAt/updatedAt
});

// Tambahkan method validasi password ke prototype
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// 3. Handler Utama
export default async function handler(req, res) {
  // Atur header CORS
  res.setHeader('Access-Control-Allow-Origin', '*'); // Sebaiknya diganti dengan URL frontend Vercel Anda
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Tes koneksi database
    await sequelize.authenticate();
    
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username: username } });

    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      namaLengkap: user.namaLengkap,
    };

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET tidak terdefinisi di environment variables');
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    return res.status(200).json({
      message: 'Login berhasil!',
      user: payload,
      token: token
    });

  } catch (error) {
    console.error('LOGIN GAGAL - DETAIL ERROR:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server: ' + error.message });
  }
}