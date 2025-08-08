'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if admin user already exists
    const [results] = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM \"Users\" WHERE username = 'admin'"
    );
    
    if (results[0].count === '0') {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await queryInterface.bulkInsert('Users', [{
        username: 'admin',
        password: hashedPassword,
        namaLengkap: 'Administrator Sistem',
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
      
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists, skipping creation');
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};