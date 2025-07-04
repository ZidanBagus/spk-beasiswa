// Simple app for Vercel serverless
const express = require('express');
const cors = require('cors');

const app = express();

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
    // Simple database test without models
    res.json({ 
      message: 'Database test endpoint',
      database_url: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      jwt_secret: process.env.JWT_SECRET ? 'SET' : 'NOT SET'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Basic auth route
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    res.json({
      message: 'Login successful',
      user: { id: 1, username: 'admin', name: 'Administrator' },
      token: 'demo-token-' + Date.now()
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

module.exports = app;