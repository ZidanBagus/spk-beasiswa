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

// Applicant model
const Applicant = sequelize.define('Applicant', {
  nama: { type: Sequelize.STRING, allowNull: false },
  nim: { type: Sequelize.STRING, allowNull: false, unique: true },
  ipk: { type: Sequelize.FLOAT },
  penghasilanOrtu: { type: Sequelize.INTEGER },
  jmlTanggungan: { type: Sequelize.INTEGER }
}, {
  tableName: 'Applicants'
});

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    if (req.method === 'GET') {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;
      
      const { count, rows } = await Applicant.findAndCountAll({
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });
      
      return res.json({
        applicants: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      });
    }
    
    if (req.method === 'POST') {
      const applicant = await Applicant.create(req.body);
      return res.status(201).json(applicant);
    }
    
    return res.status(405).json({ message: 'Method not allowed' });
    
  } catch (error) {
    console.error('Applicants error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};