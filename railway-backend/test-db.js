// Test database connection and check seeded data
require('dotenv').config();
const { User, SelectionAttribute } = require('./models');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test Users
    const users = await User.findAll();
    console.log('Users in database:', users.length);
    users.forEach(user => {
      console.log(`- ${user.username} (${user.namaLengkap})`);
    });
    
    // Test Selection Attributes
    const attributes = await SelectionAttribute.findAll();
    console.log('\nSelection Attributes:', attributes.length);
    attributes.forEach(attr => {
      console.log(`- ${attr.attributeName}: ${attr.displayName} (Selected: ${attr.isSelected})`);
    });
    
    console.log('\nDatabase test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database test failed:', error.message);
    process.exit(1);
  }
}

testDatabase();