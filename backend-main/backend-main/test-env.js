// Test environment variables
console.log('Environment Variables Test:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('BCRYPT_SALT_ROUNDS:', process.env.BCRYPT_SALT_ROUNDS);

// Test database connection
const { sequelize } = require('./models');

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Test query
    const [results] = await sequelize.query('SELECT COUNT(*) as count FROM "Users"');
    console.log('Users count:', results[0].count);
    
    const [attrs] = await sequelize.query('SELECT COUNT(*) as count FROM "SelectionAttributes"');
    console.log('Attributes count:', attrs[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();