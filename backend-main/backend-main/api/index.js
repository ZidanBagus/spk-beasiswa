// api/index.js - Main endpoint
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  return res.json({ 
    message: 'SPK Beasiswa API is working!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/auth/login',
      'GET /api/applicants/stats'
    ]
  });
}