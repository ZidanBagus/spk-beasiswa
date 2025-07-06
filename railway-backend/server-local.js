// Local development server
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// CORS for localhost
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'SPK Beasiswa API - Local Development',
    timestamp: new Date().toISOString()
  });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('Login attempt:', { username });
    
    if (username === 'admin' && password === 'admin123') {
      res.json({
        message: 'Login berhasil',
        user: {
          id: 1,
          username: 'admin',
          namaLengkap: 'Administrator Sistem'
        },
        token: 'local-token-' + Date.now()
      });
    } else {
      res.status(401).json({ message: 'Username atau password salah' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Stats endpoint
app.get('/api/applicants/stats', (req, res) => {
  res.json({
    totalApplicants: 0,
    applicantsToday: 0,
    applicantsLast7Days: 0
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   GET  http://localhost:${PORT}/api/applicants/stats`);
});

module.exports = app;