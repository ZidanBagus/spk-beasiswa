const db = require('../models');
const User = db.User;
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
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

    // Pastikan JWT_SECRET ada sebelum digunakan
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET tidak terdefinisi di file .env');
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.status(200).json({
      message: 'Login berhasil!',
      user: payload,
      token: token
    });
  } catch (error) {
    // --- TAMBAHKAN BARIS INI UNTUK MELIHAT ERROR DETAIL ---
    console.error('LOGIN GAGAL - DETAIL ERROR:', error); 
    // --------------------------------------------------------
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};