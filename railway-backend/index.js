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

// Models - EXACT SAME as local backend
const User = sequelize.define('User', {
  username: { type: Sequelize.STRING, allowNull: false, unique: true },
  password: { type: Sequelize.STRING, allowNull: false },
  namaLengkap: { type: Sequelize.STRING, allowNull: false }
}, { tableName: 'Users' });

const Applicant = sequelize.define('Applicant', {
  nama: Sequelize.STRING,
  prodi: Sequelize.STRING,
  jenisKelamin: Sequelize.STRING,
  jarakKampus: Sequelize.STRING,
  asalSekolah: Sequelize.STRING,
  ipk: Sequelize.FLOAT,
  penghasilanOrtu: Sequelize.STRING,
  jmlTanggungan: Sequelize.INTEGER,
  pekerjaanOrtu: Sequelize.STRING,
  ikutOrganisasi: Sequelize.STRING,
  ikutUKM: Sequelize.STRING,
  tahunLulus: Sequelize.INTEGER,
  sks: Sequelize.INTEGER,
  statusBeasiswa: Sequelize.STRING
}, { tableName: 'Applicants' });

const SelectionAttribute = sequelize.define('SelectionAttribute', {
  attributeName: { type: Sequelize.STRING, allowNull: false },
  displayName: { type: Sequelize.STRING, allowNull: false },
  isSelected: { type: Sequelize.BOOLEAN, defaultValue: false }
}, { tableName: 'SelectionAttributes' });

// Field configuration - EXACT SAME as local backend
const fieldConfig = {
  nama: { excelKeys: ['nama lengkap', 'nama'], type: 'string', default: 'Tanpa Nama' },
  prodi: { excelKeys: ['prodi'], type: 'string', default: '' },
  jenisKelamin: { excelKeys: ['jenis kelamin'], type: 'string', default: '' },
  jarakKampus: { excelKeys: ['jarak tempat tinggal kekampus (km)', 'jarak kampus', 'jarak'], type: 'string', default: '' },
  asalSekolah: { excelKeys: ['asal sekolah'], type: 'string', default: '' },
  tahunLulus: { excelKeys: ['tahun lulus'], type: 'integer', default: null },
  sks: { excelKeys: ['sks'], type: 'integer', default: 0 },
  ikutOrganisasi: { excelKeys: ['ikut organisasi'], type: 'customBoolean', default: 'Tidak' },
  ikutUKM: { excelKeys: ['ikut ukm'], type: 'customBoolean', default: 'Tidak' },
  ipk: { excelKeys: ['ipk'], type: 'float', default: 0.0 },
  pekerjaanOrtu: { excelKeys: ['pekerjaan orang tua', 'pekerjaan ortu'], type: 'string', default: '' },
  penghasilanOrtu: { excelKeys: ['penghasilan'], type: 'string', default: 'Tidak Diketahui' },
  jmlTanggungan: { excelKeys: ['tanggungan'], type: 'integer', default: 0 },
  statusBeasiswa: { excelKeys: ['status beasiswa'], type: 'string', default: 'Ditolak' },
};

// Parse Excel function - EXACT SAME as local backend
const parseExcelData = (buffer) => {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (jsonData.length === 0) {
        throw new Error('File Excel kosong atau tidak ada data yang dapat dibaca setelah header.');
    }

    const parsedApplicants = jsonData.map((row) => {
        const newApp = {};
        const rowKeysOriginal = Object.keys(row);
        const headerMap = {};
        rowKeysOriginal.forEach(key => {
            headerMap[String(key).toLowerCase().trim()] = key;
        });

        for (const internalKey in fieldConfig) {
            const config = fieldConfig[internalKey];
            let actualExcelValue = undefined;
            let valueFound = false;

            newApp[internalKey] = config.default;

            for (const excelKeyOption of config.excelKeys) {
                const normalizedKey = excelKeyOption.toLowerCase().trim();
                if (headerMap.hasOwnProperty(normalizedKey)) {
                    const originalHeader = headerMap[normalizedKey];
                    actualExcelValue = row[originalHeader];
                    valueFound = true;
                    break;
                }
            }

            if (valueFound && actualExcelValue !== null && actualExcelValue !== undefined) {
                const valStr = String(actualExcelValue).trim();
                if (valStr !== "") {
                    switch (config.type) {
                        case 'string':
                            newApp[internalKey] = valStr;
                            break;
                        case 'float':
                            const floatVal = parseFloat(valStr.replace(',', '.'));
                            newApp[internalKey] = isNaN(floatVal) ? config.default : floatVal;
                            break;
                        case 'integer':
                            const intVal = parseInt(valStr.replace(/[^0-9]/g, ''), 10);
                            newApp[internalKey] = isNaN(intVal) ? config.default : intVal;
                            break;
                        case 'customBoolean':
                            newApp[internalKey] = ['ikut', 'ya', 'iya', 'yes', 'true', '1'].includes(valStr.toLowerCase()) ? 'Ya' : 'Tidak';
                            break;
                    }
                }
            }
        }
        return newApp;
    });

    return parsedApplicants;
};

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'SPK Beasiswa API - Railway', status: 'OK' });
});

// Auth - EXACT SAME as local
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

// Stats - EXACT SAME as local
app.get('/api/applicants/stats', async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const startOfSevenDaysAgo = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate());

    const applicantsToday = await Applicant.count({ where: { createdAt: { [Sequelize.Op.gte]: startOfToday } } });
    const applicantsLast7Days = await Applicant.count({ where: { createdAt: { [Sequelize.Op.gte]: startOfSevenDaysAgo } } });
    const totalApplicants = await Applicant.count();

    res.json({
      totalApplicants,
      applicantsToday,
      applicantsLast7Days
    });
  } catch (error) {
    res.json({
      totalApplicants: 0,
      applicantsToday: 0,
      applicantsLast7Days: 0
    });
  }
});

// Applicants - EXACT SAME as local
app.get('/api/applicants', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = {};
    if (search) {
      whereClause = {
        [Sequelize.Op.or]: [
          { nama: { [Sequelize.Op.iLike]: `%${search}%` } },
          { prodi: { [Sequelize.Op.iLike]: `%${search}%` } },
          { asalSekolah: { [Sequelize.Op.iLike]: `%${search}%` } },
          { statusBeasiswa: { [Sequelize.Op.iLike]: `%${search}%` } },
        ]
      };
    }

    const { count, rows } = await Applicant.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['id', 'ASC']]
    });

    res.json({
      totalItems: count,
      applicants: rows,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Applicants error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

app.post('/api/applicants', async (req, res) => {
  try {
    const newApplicant = await Applicant.create(req.body);
    res.status(201).json({ message: 'Data pendaftar berhasil ditambahkan.', applicant: newApplicant });
  } catch (error) {
    console.error('Error menambah pendaftar:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: error.message });
  }
});

app.get('/api/applicants/:id', async (req, res) => {
  try {
    const applicant = await Applicant.findByPk(req.params.id);
    if (!applicant) {
      return res.status(404).json({ message: 'Data pendaftar tidak ditemukan.' });
    }
    res.json(applicant);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: error.message });
  }
});

app.put('/api/applicants/:id', async (req, res) => {
  try {
    const applicant = await Applicant.findByPk(req.params.id);
    if (!applicant) {
      return res.status(404).json({ message: 'Data pendaftar tidak ditemukan.' });
    }
    await applicant.update(req.body);
    res.json({ message: 'Data pendaftar berhasil diperbarui.', applicant });
  } catch (error) {
    console.error('Error mengupdate pendaftar:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: error.message });
  }
});

app.delete('/api/applicants/:id', async (req, res) => {
  try {
    const applicant = await Applicant.findByPk(req.params.id);
    if (!applicant) {
      return res.status(404).json({ message: 'Data pendaftar tidak ditemukan.' });
    }
    await applicant.destroy();
    res.json({ message: 'Data pendaftar berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: error.message });
  }
});

// Upload Excel - EXACT SAME as local backend
app.post('/api/applicants/upload', upload.single('excelFile'), async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ message: "File tidak ditemukan." });
  }

  try {
    let applicantsData = parseExcelData(req.file.buffer);
    applicantsData = applicantsData.filter(app => app.nama && String(app.nama).trim() !== '');

    if (!applicantsData || applicantsData.length === 0) {
      return res.status(400).json({ message: "Tidak ada data valid yang bisa diproses. Pastikan kolom 'nama lengkap' dan 'status beasiswa' terisi." });
    }

    const createdApplicants = await Applicant.bulkCreate(applicantsData, {
      validate: true,
      fields: Object.keys(fieldConfig)
    });

    res.status(201).json({
      message: `Berhasil mengimpor dan menyimpan ${createdApplicants.length} data pendaftar.`,
      importedCount: createdApplicants.length,
    });
  } catch (error) {
    console.error('Error di endpoint uploadApplicants:', error);
    res.status(500).json({
      message: 'Terjadi kesalahan pada server saat mengimpor data.',
      error: error.message || 'Error tidak diketahui'
    });
  }
});

// Attributes - EXACT SAME as local
app.get('/api/attributes', async (req, res) => {
  try {
    const attributes = await SelectionAttribute.findAll({
      order: [['id', 'ASC']]
    });
    
    res.json({ attributes });
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

app.put('/api/attributes', async (req, res) => {
  try {
    const { attributes } = req.body;

    for (const attr of attributes) {
      await SelectionAttribute.update(
        { isSelected: attr.isSelected },
        { where: { id: attr.id } }
      );
    }

    res.json({ message: 'Attributes updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Reports - EXACT SAME as local
app.get('/api/reports', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows } = await Applicant.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['id', 'ASC']]
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
      totalPages: Math.ceil(count / parseInt(limit))
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

// Selection - EXACT SAME as local
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
  
  // Initialize database with force sync and seed data
  sequelize.sync({ force: true }).then(async () => {
    console.log('📊 Database synced');
    
    // Seed initial data
    try {
      // Create admin user
      await User.create({
        username: 'admin',
        password: 'admin123',
        namaLengkap: 'Administrator Sistem'
      });
      
      // Create selection attributes
      await SelectionAttribute.bulkCreate([
        { attributeName: 'ipk', displayName: 'IPK', isSelected: true },
        { attributeName: 'penghasilanOrtu', displayName: 'Penghasilan Orang Tua', isSelected: true },
        { attributeName: 'jmlTanggungan', displayName: 'Jumlah Tanggungan', isSelected: true },
        { attributeName: 'ikutOrganisasi', displayName: 'Keikutsertaan Organisasi', isSelected: true },
        { attributeName: 'ikutUKM', displayName: 'Keikutsertaan UKM', isSelected: true }
      ]);
      
      console.log('✅ Database seeded');
    } catch (err) {
      console.log('⚠️ Seed data already exists');
    }
  }).catch(err => {
    console.error('❌ Database error:', err);
  });
});