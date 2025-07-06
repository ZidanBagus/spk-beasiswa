// api/execute-query.js - Execute SQL queries
const { Sequelize } = require('sequelize');

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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const { query } = req.body;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Query tidak boleh kosong' });
    }
    
    // Execute query
    const [results, metadata] = await sequelize.query(query);
    
    return res.json({
      success: true,
      message: 'Query berhasil dieksekusi',
      results: results,
      rowCount: Array.isArray(results) ? results.length : metadata?.rowCount || 0,
      query: query
    });
    
  } catch (error) {
    console.error('Query execution error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error: ' + error.message,
      query: req.body.query
    });
  }
}