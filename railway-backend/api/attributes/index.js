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

// SelectionAttribute model
const SelectionAttribute = sequelize.define('SelectionAttribute', {
  attributeName: { type: Sequelize.STRING, allowNull: false },
  displayName: { type: Sequelize.STRING, allowNull: false },
  isSelected: { type: Sequelize.BOOLEAN, defaultValue: false }
}, {
  tableName: 'SelectionAttributes'
});

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    if (req.method === 'GET') {
      const attributes = await SelectionAttribute.findAll({
        order: [['id', 'ASC']]
      });
      
      return res.json({
        attributes
      });
    }
    
    if (req.method === 'PUT') {
      const { attributes } = req.body;
      
      for (const attr of attributes) {
        await SelectionAttribute.update(
          { isSelected: attr.isSelected },
          { where: { id: attr.id } }
        );
      }
      
      return res.json({ message: 'Attributes updated successfully' });
    }
    
    return res.status(405).json({ message: 'Method not allowed' });
    
  } catch (error) {
    console.error('Attributes error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};