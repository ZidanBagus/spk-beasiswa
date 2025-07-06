// Manual data import script
require('dotenv').config();
const { User, SelectionAttribute, Applicant } = require('./models');
const bcrypt = require('bcryptjs');

async function importData() {
  try {
    console.log('Starting data import...');
    
    // Clear existing data
    await User.destroy({ where: {} });
    await SelectionAttribute.destroy({ where: {} });
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin', 10);
    await User.create({
      username: 'admin',
      password: hashedPassword,
      namaLengkap: 'Administrator Sistem'
    });
    
    // Create selection attributes
    const attributes = [
      { attributeName: 'ipk', displayName: 'IPK', isSelected: true },
      { attributeName: 'penghasilanOrtu', displayName: 'Penghasilan Orang Tua', isSelected: true },
      { attributeName: 'jmlTanggungan', displayName: 'Jumlah Tanggungan', isSelected: true },
      { attributeName: 'ikutOrganisasi', displayName: 'Keikutsertaan Organisasi', isSelected: true },
      { attributeName: 'ikutUKM', displayName: 'Keikutsertaan UKM', isSelected: true }
    ];
    
    await SelectionAttribute.bulkCreate(attributes);
    
    console.log('Data import completed successfully!');
    console.log('Admin login: username=admin, password=admin');
    
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error.message);
    process.exit(1);
  }
}

// Set environment
process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_Hsczr6wXb1qC@ep-lively-lab-a1r820jx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

importData();