// Simple app for Vercel serverless
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Sequelize } = require('sequelize');

const app = express();

// Database connection
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

// User model
const User = sequelize.define('User', {
  username: { type: Sequelize.STRING, allowNull: false, unique: true },
  password: { type: Sequelize.STRING, allowNull: false },
  namaLengkap: { type: Sequelize.STRING, allowNull: false }
});

// Basic middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'SPK Beasiswa API is running!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    await sequelize.authenticate();
    const userCount = await User.count();
    
    res.json({ 
      message: 'Database connection successful',
      database_url: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      jwt_secret: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      users_count: userCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth routes
app.get('/api/auth/login', (req, res) => {
  res.json({ message: 'Login endpoint ready. Use POST method.' });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password harus diisi' });
    }
    
    // Find user in database
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '8h' }
    );
    
    res.json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        username: user.username,
        namaLengkap: user.namaLengkap
      },
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Basic API routes
app.get('/api/applicants/stats', (req, res) => {
  res.json({
    totalApplicants: 0,
    applicantsToday: 0,
    applicantsLast7Days: 0
  });
});

app.get('/api/reports/selection-results', (req, res) => {
  res.json({
    results: [],
    total: 0,
    page: 1,
    limit: 10
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;