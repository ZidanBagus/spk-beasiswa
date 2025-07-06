// Minimal working app for debugging
const express = require('express');
const cors = require('cors');

const app = express();

// Basic CORS
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});

// Simple login without database
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('Login attempt:', { username, password });
    
    if (username === 'admin' && password === 'admin123') {
      res.json({
        message: 'Login berhasil',
        user: {
          id: 1,
          username: 'admin',
          namaLengkap: 'Administrator Sistem'
        },
        token: 'simple-token-' + Date.now()
      });
    } else {
      res.status(401).json({ message: 'Username atau password salah' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Basic endpoints
app.get('/api/applicants/stats', (req, res) => {
  res.json({
    totalApplicants: 0,
    applicantsToday: 0,
    applicantsLast7Days: 0
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Server error' });
});

module.exports = app;