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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const totalApplicants = await Applicant.count();
    
    return res.json({
      totalApplicants,
      applicantsToday: 0,
      applicantsLast7Days: 0
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    return res.json({
      totalApplicants: 0,
      applicantsToday: 0,
      applicantsLast7Days: 0
    });
  }
};