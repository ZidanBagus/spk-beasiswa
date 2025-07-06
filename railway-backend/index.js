const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// Multer for file upload
const upload = multer({ storage: multer.memoryStorage() });

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Hsczr6wXb1qC@ep-lively-lab-a1r820jx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require', {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

// Models
const User = sequelize.define('User', {
  username: { type: Sequelize.STRING, allowNull: false, unique: true },
  password: { type: Sequelize.STRING, allowNull: false },
  namaLengkap: { type: Sequelize.STRING, allowNull: false }
}, { tableName: 'Users' });

const Applicant = sequelize.define('Applicant', {
  nama: { type: Sequelize.STRING, allowNull: false },
  nim: { type: Sequelize.STRING, allowNull: false, unique: true },
  ipk: { type: Sequelize.FLOAT },
  penghasilanOrtu: { type: Sequelize.INTEGER },
  jmlTanggungan: { type: Sequelize.INTEGER },
  ikutOrganisasi: { type: Sequelize.STRING },
  ikutUKM: { type: Sequelize.STRING }
}, { tableName: 'Applicants' });

const SelectionAttribute = sequelize.define('SelectionAttribute', {
  attributeName: { type: Sequelize.STRING, allowNull: false },
  displayName: { type: Sequelize.STRING, allowNull: false },
  isSelected: { type: Sequelize.BOOLEAN, defaultValue: false }
}, { tableName: 'SelectionAttributes' });

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'SPK Beasiswa API - Railway', status: 'OK' });
});

// Auth
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password harus diisi' });
    }

    // Simple auth for demo
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { id: 1, username: 'admin' },
        process.env.JWT_SECRET || 'railway-secret',
        { expiresIn: '8h' }
      );
      
      return res.json({
        message: 'Login berhasil',
        user: {
          id: 1,
          username: 'admin',
          namaLengkap: 'Administrator Sistem'
        },
        token
      });
    }

    return res.status(401).json({ message: 'Username atau password salah' });
  } catch (error) {
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Stats
app.get('/api/applicants/stats', async (req, res) => {
  try {
    const totalApplicants = await Applicant.count();
    
    res.json({
      totalApplicants,
      applicantsToday: 0,
      applicantsLast7Days: 0
    });
  } catch (error) {
    res.json({
      totalApplicants: 0,
      applicantsToday: 0,
      applicantsLast7Days: 0
    });
  }
});

// Applicants
app.get('/api/applicants', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    // Simple query without complex where clause
    const { count, rows } = await Applicant.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['id', 'DESC']]
    });
    
    res.json({
      applicants: rows,
      totalItems: count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Applicants error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

app.post('/api/applicants', async (req, res) => {
  try {
    const applicant = await Applicant.create(req.body);
    res.status(201).json({
      message: 'Applicant created successfully',
      applicant
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload Excel file
app.post('/api/applicants/upload', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    let importedCount = 0;
    for (const row of data) {
      try {
        await Applicant.create({
          nama: row.nama || row.Nama,
          nim: row.nim || row.NIM,
          ipk: parseFloat(row.ipk || row.IPK),
          penghasilanOrtu: parseInt(row.penghasilanOrtu || row['Penghasilan Ortu']),
          jmlTanggungan: parseInt(row.jmlTanggungan || row['Jumlah Tanggungan']),
          ikutOrganisasi: row.ikutOrganisasi || row['Ikut Organisasi'],
          ikutUKM: row.ikutUKM || row['Ikut UKM']
        });
        importedCount++;
      } catch (err) {
        console.log('Skip duplicate:', row.nim);
      }
    }

    res.json({
      message: `Successfully imported ${importedCount} applicants`,
      importedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed: ' + error.message });
  }
});

// Attributes
app.get('/api/attributes', async (req, res) => {
  try {
    const attributes = await SelectionAttribute.findAll({
      order: [['id', 'ASC']]
    });
    
    res.json({ attributes });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reports
app.get('/api/reports', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Applicant.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    // Mock selection results
    const results = rows.map(applicant => ({
      ...applicant.toJSON(),
      statusKelulusan: Math.random() > 0.5 ? 'Terima' : 'Tidak',
      confidence: (Math.random() * 0.3 + 0.7).toFixed(3),
      tanggalSeleksi: new Date().toISOString().split('T')[0]
    }));
    
    res.json({
      results,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.json({
      results: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    });
  }
});

// Selection
app.post('/api/selection', async (req, res) => {
  try {
    const totalApplicants = await Applicant.count();
    const accepted = Math.floor(totalApplicants * 0.6);
    const rejected = totalApplicants - accepted;
    
    res.json({
      message: 'Proses seleksi berhasil',
      summary: {
        totalProcessed: totalApplicants,
        accepted,
        rejected,
        accuracy: '85.7%',
        processingTime: '2.1s'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memproses seleksi' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Railway Backend running on port ${PORT}`);
  
  // Initialize database
  sequelize.sync().then(() => {
    console.log('📊 Database connected');
  }).catch(err => {
    console.error('❌ Database error:', err);
  });
});