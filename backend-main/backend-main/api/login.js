// api/login.js - Vercel Function for login
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const { username, password } = req.body;
    
    console.log('Login attempt:', { username, password });
    
    if (username === 'admin' && password === 'admin123') {
      return res.json({
        message: 'Login berhasil',
        user: {
          id: 1,
          username: 'admin',
          namaLengkap: 'Administrator Sistem'
        },
        token: 'simple-token-' + Date.now()
      });
    } else {
      return res.status(401).json({ message: 'Username atau password salah' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
}