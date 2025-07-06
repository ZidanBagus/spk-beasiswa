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

const SelectionBatch = sequelize.define('SelectionBatch', {
  namaBatch: { type: Sequelize.STRING, allowNull: false },
  userId: { type: Sequelize.INTEGER, allowNull: false },
  catatan: Sequelize.TEXT,
  akurasi: Sequelize.FLOAT
}, { tableName: 'SelectionBatches' });

const SelectionResult = sequelize.define('SelectionResult', {
  applicantId: { type: Sequelize.INTEGER, allowNull: false },
  namaPendaftar: Sequelize.STRING,
  ipk: Sequelize.FLOAT,
  penghasilanOrtu: Sequelize.STRING,
  jmlTanggungan: Sequelize.INTEGER,
  ikutOrganisasi: Sequelize.STRING,
  ikutUKM: Sequelize.STRING,
  statusKelulusan: Sequelize.STRING,
  alasanKeputusan: Sequelize.TEXT,
  batchId: Sequelize.INTEGER,
  tanggalSeleksi: Sequelize.DATE
}, { tableName: 'SelectionResults' });

// Associations
SelectionBatch.belongsTo(User, { foreignKey: 'userId', as: 'user' });
SelectionResult.belongsTo(SelectionBatch, { foreignKey: 'batchId', as: 'batch' });
SelectionResult.belongsTo(Applicant, { foreignKey: 'applicantId', as: 'applicant' });

// Global variables for model state - EXACT SAME as local
let trainedModel = null;
let calculationSteps = [];

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

// C4.5 Engine - EXACT SAME as local backend
const NUMERIC_ATTRIBUTES = ['ipk', 'jmlTanggungan'];

const calculateEntropy = (data) => {
    if (data.length === 0) return 0;
    const classCounts = data.reduce((counts, item) => {
        const aClass = item.statusKelulusan;
        counts[aClass] = (counts[aClass] || 0) + 1;
        return counts;
    }, {});

    let entropy = 0;
    const totalSize = data.length;
    for (const aClass in classCounts) {
        const probability = classCounts[aClass] / totalSize;
        if (probability > 0) {
            entropy -= probability * Math.log2(probability);
        }
    }
    return entropy;
};

const splitData = (data, attribute, value) => {
    return data.filter(item => item[attribute] === value);
};

const calculateGainRatioForCategorical = (data, attribute, totalEntropy) => {
    const totalSize = data.length;
    const uniqueValues = [...new Set(data.map(item => item[attribute]))];
    let newEntropy = 0;
    let splitInfo = 0;

    for (const value of uniqueValues) {
        const subset = splitData(data, attribute, value);
        const subsetSize = subset.length;
        const probability = subsetSize / totalSize;

        if (probability > 0) {
            newEntropy += probability * calculateEntropy(subset);
            splitInfo -= probability * Math.log2(probability);
        }
    }

    const informationGain = totalEntropy - newEntropy;
    const gainRatio = splitInfo === 0 ? 0 : informationGain / splitInfo;
    
    return { gainRatio, informationGain, splitInfo };
};

const calculateGainRatioForContinuous = (data, attribute, totalEntropy) => {
    const totalSize = data.length;
    const sortedUniqueValues = [...new Set(data.map(item => item[attribute]))].sort((a, b) => a - b);
    
    let bestGainRatio = -1;
    let bestThreshold = null;
    let potentialThresholds = [];

    for (let i = 0; i < sortedUniqueValues.length - 1; i++) {
        potentialThresholds.push((sortedUniqueValues[i] + sortedUniqueValues[i + 1]) / 2);
    }
    if (potentialThresholds.length === 0 && sortedUniqueValues.length > 0) {
        potentialThresholds.push(sortedUniqueValues[0]);
    }

    for (const threshold of potentialThresholds) {
        const lessThanOrEqualData = data.filter(item => item[attribute] <= threshold);
        const greaterThanData = data.filter(item => item[attribute] > threshold);

        if (lessThanOrEqualData.length === 0 || greaterThanData.length === 0) {
            continue;
        }

        const pLess = lessThanOrEqualData.length / totalSize;
        const pGreater = greaterThanData.length / totalSize;

        const newEntropy = (pLess * calculateEntropy(lessThanOrEqualData)) + (pGreater * calculateEntropy(greaterThanData));
        const informationGain = totalEntropy - newEntropy;
        const splitInfo = -(pLess * Math.log2(pLess)) - (pGreater * Math.log2(pGreater));
        const gainRatio = splitInfo === 0 ? 0 : informationGain / splitInfo;

        if (gainRatio > bestGainRatio) {
            bestGainRatio = gainRatio;
            bestThreshold = threshold;
        }
    }

    return { gainRatio: bestGainRatio, threshold: bestThreshold };
};

const findBestAttribute = (data, attributes) => {
    const totalEntropy = calculateEntropy(data);
    let bestAttribute = null;
    let bestGainRatio = -1;
    let bestThreshold = null;
    const calculations = {};

    for (const attribute of attributes) {
        let result;
        if (NUMERIC_ATTRIBUTES.includes(attribute)) {
            result = calculateGainRatioForContinuous(data, attribute, totalEntropy);
            calculations[attribute] = { gainRatio: result.gainRatio, threshold: result.threshold };
        } else {
            result = calculateGainRatioForCategorical(data, attribute, totalEntropy);
            calculations[attribute] = { gainRatio: result.gainRatio };
        }

        if (result.gainRatio > bestGainRatio) {
            bestGainRatio = result.gainRatio;
            bestAttribute = attribute;
            bestThreshold = result.threshold || null;
        }
    }

    return { bestAttribute, bestThreshold, calculations };
};

const buildTree = (data, attributes, defaultStatus = null, steps = []) => {
    const classCounts = data.reduce((counts, item) => {
        counts[item.statusKelulusan] = (counts[item.statusKelulusan] || 0) + 1;
        return counts;
    }, {});

    const majorityClass = Object.keys(classCounts).reduce((a, b) => classCounts[a] > classCounts[b] ? a : b, defaultStatus);

    if (data.length === 0 || attributes.length === 0) {
        return { isLeaf: true, decision: majorityClass, count: data.length, classCounts };
    }

    const uniqueClasses = new Set(data.map(item => item.statusKelulusan));
    if (uniqueClasses.size === 1) {
        return { isLeaf: true, decision: uniqueClasses.values().next().value, count: data.length, classCounts };
    }

    const { bestAttribute, bestThreshold, calculations } = findBestAttribute(data, attributes);
    
    steps.push({
        bestAttribute,
        dataSize: data.length,
        entropy: calculateEntropy(data),
        calculations
    });

    if (!bestAttribute || calculations[bestAttribute].gainRatio <= 0) {
        return { isLeaf: true, decision: majorityClass, count: data.length, classCounts };
    }

    const tree = {
        name: bestAttribute,
        threshold: bestThreshold,
        branches: {},
        count: data.length,
        classCounts
    };

    const remainingAttributes = attributes.filter(attr => attr !== bestAttribute);

    if (bestThreshold !== null) {
        const lessThanOrEqualData = data.filter(item => item[bestAttribute] <= bestThreshold);
        const greaterThanData = data.filter(item => item[bestAttribute] > bestThreshold);
        
        const branchLTE = `<= ${bestThreshold.toFixed(2)}`;
        const branchGT = `> ${bestThreshold.toFixed(2)}`;

        tree.branches[branchLTE] = buildTree(lessThanOrEqualData, remainingAttributes, majorityClass, steps);
        tree.branches[branchGT] = buildTree(greaterThanData, remainingAttributes, majorityClass, steps);
    } else {
        const uniqueValues = [...new Set(data.map(item => item[bestAttribute]))];
        for (const value of uniqueValues) {
            const subset = splitData(data, bestAttribute, value);
            tree.branches[value] = buildTree(subset, remainingAttributes, majorityClass, steps);
        }
    }

    return tree;
};

const predict = (tree, item) => {
    let currentNode = tree;
    const path = [];

    while (!currentNode.isLeaf) {
        const attribute = currentNode.name;
        const value = item[attribute];
        let branchName;

        if (currentNode.threshold !== null) {
            path.push({ attribute, value, threshold: currentNode.threshold });
            branchName = value <= currentNode.threshold ? `<= ${currentNode.threshold.toFixed(2)}` : `> ${currentNode.threshold.toFixed(2)}`;
        } else {
            path.push({ attribute, value });
            branchName = value;
        }
        
        if (currentNode.branches[branchName]) {
            currentNode = currentNode.branches[branchName];
        } else {
            const allDecisions = Object.values(currentNode.branches).map(b => b.decision).filter(Boolean);
            const decisionCounts = allDecisions.reduce((acc, d) => { acc[d] = (acc[d] || 0) + 1; return acc; }, {});
            const majorityDecision = Object.keys(decisionCounts).reduce((a, b) => decisionCounts[a] > decisionCounts[b] ? a : b, 'Tidak');
            return { decision: majorityDecision, path };
        }
    }

    path.push({ decision: currentNode.decision });
    return { decision: currentNode.decision, path };
};

const visualizeTree = (tree, prefix = '') => {
    if (tree.isLeaf) {
        return `--> ${tree.decision}\n`;
    }

    let output = '';
    const branches = Object.keys(tree.branches);

    branches.forEach((branch, index) => {
        const isLast = index === branches.length - 1;
        const connector = isLast ? '└──' : '├──';
        
        let condition = '';
        if (tree.threshold !== null) {
            condition = `${tree.name} ${branch}`;
        } else {
            condition = `${tree.name} = ${branch}`;
        }

        output += `${prefix}${connector} ${condition}\n`;
        
        const newPrefix = prefix + (isLast ? '    ' : '|   ');
        output += visualizeTree(tree.branches[branch], newPrefix);
    });

    return output;
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

// Dashboard Analytics - Real Data
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

    // Selection Results Statistics
    const totalResults = await SelectionResult.count();
    const acceptedResults = await SelectionResult.count({ where: { statusKelulusan: 'Terima' } });
    const rejectedResults = await SelectionResult.count({ where: { statusKelulusan: 'Tidak' } });
    const acceptanceRate = totalResults > 0 ? ((acceptedResults / totalResults) * 100).toFixed(1) : 0;

    // IPK Analysis
    const highIPKApplicants = await Applicant.count({ where: { ipk: { [Sequelize.Op.gte]: 3.5 } } });
    const highIPKAccepted = await SelectionResult.count({ 
      where: { 
        statusKelulusan: 'Terima',
        ipk: { [Sequelize.Op.gte]: 3.5 }
      } 
    });
    const highIPKRate = highIPKApplicants > 0 ? ((highIPKAccepted / highIPKApplicants) * 100).toFixed(1) : 0;

    // Penghasilan Analysis
    const lowIncomeApplicants = await Applicant.count({ 
      where: { 
        penghasilanOrtu: { [Sequelize.Op.in]: ['Rendah', 'rendah', 'Kurang dari 2 juta'] }
      } 
    });
    const lowIncomeAccepted = await SelectionResult.count({ 
      where: { 
        statusKelulusan: 'Terima',
        penghasilanOrtu: { [Sequelize.Op.in]: ['Rendah', 'rendah', 'Kurang dari 2 juta'] }
      } 
    });
    const lowIncomeRate = lowIncomeApplicants > 0 ? ((lowIncomeAccepted / lowIncomeApplicants) * 100).toFixed(1) : 0;

    // Organisasi Analysis
    const orgApplicants = await Applicant.count({ where: { ikutOrganisasi: 'Ya' } });
    const orgAccepted = await SelectionResult.count({ 
      where: { 
        statusKelulusan: 'Terima',
        ikutOrganisasi: 'Ya'
      } 
    });
    const orgRate = orgApplicants > 0 ? ((orgAccepted / orgApplicants) * 100).toFixed(1) : 0;

    // Monthly trend (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      const monthCount = await Applicant.count({
        where: {
          createdAt: {
            [Sequelize.Op.gte]: monthStart,
            [Sequelize.Op.lte]: monthEnd
          }
        }
      });
      monthlyData.push({
        month: monthStart.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        count: monthCount
      });
    }

    res.json({
      // Basic stats
      totalApplicants,
      applicantsToday,
      applicantsLast7Days,
      
      // Selection statistics
      selectionStats: {
        total: totalResults,
        accepted: acceptedResults,
        rejected: rejectedResults,
        acceptanceRate: parseFloat(acceptanceRate)
      },
      
      // Category analysis
      categoryAnalysis: {
        highIPK: {
          total: highIPKApplicants,
          accepted: highIPKAccepted,
          rate: parseFloat(highIPKRate),
          label: 'IPK ≥ 3.5'
        },
        lowIncome: {
          total: lowIncomeApplicants,
          accepted: lowIncomeAccepted,
          rate: parseFloat(lowIncomeRate),
          label: 'Penghasilan Rendah'
        },
        organization: {
          total: orgApplicants,
          accepted: orgAccepted,
          rate: parseFloat(orgRate),
          label: 'Aktif Organisasi'
        }
      },
      
      // Trend data
      trendData: monthlyData,
      
      // Best category
      bestCategory: {
        name: highIPKRate >= lowIncomeRate && highIPKRate >= orgRate ? 'IPK ≥ 3.5' : 
              lowIncomeRate >= orgRate ? 'Penghasilan Rendah' : 'Aktif Organisasi',
        rate: Math.max(parseFloat(highIPKRate), parseFloat(lowIncomeRate), parseFloat(orgRate))
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.json({
      totalApplicants: 0,
      applicantsToday: 0,
      applicantsLast7Days: 0,
      selectionStats: { total: 0, accepted: 0, rejected: 0, acceptanceRate: 0 },
      categoryAnalysis: {
        highIPK: { total: 0, accepted: 0, rate: 0, label: 'IPK ≥ 3.5' },
        lowIncome: { total: 0, accepted: 0, rate: 0, label: 'Penghasilan Rendah' },
        organization: { total: 0, accepted: 0, rate: 0, label: 'Aktif Organisasi' }
      },
      trendData: [],
      bestCategory: { name: 'Belum ada data', rate: 0 }
    });
  }
});

// Applicants
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
    
    // Delete related selection results first
    await SelectionResult.destroy({ where: { applicantId: req.params.id } });
    
    // Then delete the applicant
    await applicant.destroy();
    
    res.json({ message: 'Data pendaftar berhasil dihapus.' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: error.message });
  }
});

// Upload Excel
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

// Attributes
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

// Reports
app.get('/api/reports/results', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = 'semua',
      sortBy = 'tanggalSeleksi',
      sortOrder = 'DESC',
      fetchAll = 'false'
    } = req.query;

    let paginationOptions = {};
    if (String(fetchAll).toLowerCase() !== 'true') {
      const parsedLimit = parseInt(limit);
      const parsedPage = parseInt(page);
      const offset = (parsedPage - 1) * parsedLimit;
      paginationOptions.limit = parsedLimit;
      paginationOptions.offset = offset;
    }

    let whereClause = {};
    if (status && status !== 'semua') {
      whereClause.statusKelulusan = status;
    }

    if (search) {
      const searchNum = parseFloat(search);
      const searchClauses = [
        { namaPendaftar: { [Sequelize.Op.iLike]: `%${search}%` } },
        { penghasilanOrtu: { [Sequelize.Op.iLike]: `%${search}%` } }
      ];
      if (!isNaN(searchNum)) {
        searchClauses.push({ ipk: searchNum });
        const searchInt = parseInt(search);
        if(!isNaN(searchInt)) searchClauses.push({ jmlTanggungan: searchInt });
      }
      if (search.toLowerCase() === 'terima' || search.toLowerCase() === 'tidak') {
        searchClauses.push({ statusKelulusan: { [Sequelize.Op.iLike]: `%${search}%` } });
      }
      if (searchClauses.length > 0) {
        whereClause[Sequelize.Op.or] = searchClauses;
      }
    }
    
    const allowedSortByFields = ['id', 'namaPendaftar', 'ipk', 'penghasilanOrtu', 'jmlTanggungan', 'statusKelulusan', 'tanggalSeleksi', 'createdAt', 'updatedAt'];
    const validSortBy = allowedSortByFields.includes(sortBy) ? sortBy : 'tanggalSeleksi';
    const validSortOrder = ['ASC', 'DESC'].includes(String(sortOrder).toUpperCase()) ? String(sortOrder).toUpperCase() : 'DESC';

    const queryOptions = {
      where: whereClause,
      order: [[validSortBy, validSortOrder]],
      ...paginationOptions 
    };
    
    const rows = await SelectionResult.findAll(queryOptions);
    const count = await SelectionResult.count({ where: whereClause });

    const totalTerima = await SelectionResult.count({
      where: {
        ...whereClause, 
        statusKelulusan: 'Terima'
      }
    });

    const totalTidak = await SelectionResult.count({
      where: {
        ...whereClause, 
        statusKelulusan: 'Tidak'
      }
    });
    
    res.json({
      totalItems: count,
      results: rows,
      totalPages: String(fetchAll).toLowerCase() === 'true' ? 1 : Math.ceil(count / parseInt(limit)),
      currentPage: String(fetchAll).toLowerCase() === 'true' ? 1 : parseInt(page),
      summary: {
        total: count,
        Terima: totalTerima,
        Tidak: totalTidak
      }
    });
  } catch (error) {
    console.error('Error mengambil hasil seleksi:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengambil hasil seleksi.', error: error.message });
  }
});

// Legacy reports endpoint
app.get('/api/reports', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows } = await SelectionResult.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['tanggalSeleksi', 'DESC']]
    });
    
    res.json({
      results: rows,
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

// Selection Batch endpoints
app.get('/api/batches', async (req, res) => {
  try {
    const batches = await SelectionBatch.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'namaLengkap']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(batches);
  } catch (error) {
    console.error("Error mengambil data batch:", error);
    res.status(500).json({ message: 'Gagal memuat riwayat pengujian.', error: error.message });
  }
});

// Selection endpoints - EXACT SAME as local
app.get('/api/selection/model-status', async (req, res) => {
  try {
    res.json({
      trained: trainedModel !== null
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengecek status model: ' + error.message });
  }
});

app.post('/api/selection/train', async (req, res) => {
  try {
    const { trainingDataIds, selectedAttributeNames } = req.body;
    
    if (!trainingDataIds || trainingDataIds.length === 0) {
      return res.status(400).json({ message: "Data latih tidak ditemukan. Harap bagi data terlebih dahulu." });
    }

    const trainingApplicants = await Applicant.findAll({ 
      where: { id: trainingDataIds } 
    });

    if (trainingApplicants.length === 0) {
      return res.status(400).json({ message: "Data latih tidak ditemukan. Harap bagi data terlebih dahulu." });
    }

    const preparedTrainingData = trainingApplicants.map(app => {
      const plainApp = app.toJSON();
      return { ...plainApp, statusKelulusan: plainApp.statusBeasiswa }; 
    });
    
    calculationSteps = [];
    trainedModel = buildTree(preparedTrainingData, selectedAttributeNames, null, calculationSteps);
    
    res.json({ 
      message: `Model berhasil dilatih menggunakan ${preparedTrainingData.length} data historis.`
    });
  } catch (error) {
    trainedModel = null;
    calculationSteps = [];
    console.error("Error saat melatih model:", error);
    res.status(500).json({ message: "Gagal melatih model.", error: error.message });
  }
});

app.post('/api/selection/test', async (req, res) => {
  const { testingDataIds } = req.body;
  if (!trainedModel) {
    return res.status(400).json({ message: "Model belum dilatih." });
  }

  try {
    const batchName = `Pengujian Model (Data Uji) - ${new Date().toLocaleString('id-ID')}`;
    const newBatch = await SelectionBatch.create({
      namaBatch: batchName,
      userId: 1,
      catatan: `Model diuji dengan ${testingDataIds.length} data uji.`
    });

    await SelectionResult.destroy({ where: {}, truncate: true });
    const testingData = await Applicant.findAll({ where: { id: testingDataIds } });

    const matrix = { 'terima': { 'terima': 0, 'tidak': 0 }, 'tidak': { 'terima': 0, 'tidak': 0 } };
    const resultsToSave = [];

    for (const applicant of testingData) {
      const plainApplicant = applicant.toJSON();
      const actualStatus = plainApplicant.statusBeasiswa.toLowerCase();
      let { decision: predictedStatus, path } = predict(trainedModel, plainApplicant);
      predictedStatus = predictedStatus.toLowerCase();

      let reason = 'Keputusan berdasarkan aturan mayoritas pada node daun.';
      const lastRule = path.filter(p => p.attribute).pop();
      if (lastRule) {
        const humanAttribute = lastRule.attribute.replace('_kategori', '');
        let condition = lastRule.threshold != null ? `${humanAttribute} ${plainApplicant[lastRule.attribute] <= lastRule.threshold ? '<=' : '>'} ${lastRule.threshold.toFixed(2)}` : `${humanAttribute} = '${lastRule.value}'`;
        reason = `${predictedStatus} karena memenuhi kondisi: ${condition}`;
      }

      if (matrix[actualStatus] && matrix[actualStatus][predictedStatus] !== undefined) {
        matrix[actualStatus][predictedStatus]++;
      }

      resultsToSave.push({
        applicantId: plainApplicant.id,
        namaPendaftar: plainApplicant.nama,
        ipk: plainApplicant.ipk,
        penghasilanOrtu: plainApplicant.penghasilanOrtu,
        jmlTanggungan: plainApplicant.jmlTanggungan,
        ikutOrganisasi: plainApplicant.ikutOrganisasi,
        ikutUKM: plainApplicant.ikutUKM,
        statusKelulusan: predictedStatus === 'terima' ? 'Terima' : 'Tidak',
        alasanKeputusan: reason,
        batchId: newBatch.id,
        tanggalSeleksi: new Date(),
      });
    }
    
    await SelectionResult.bulkCreate(resultsToSave);
    
    const TP = matrix['terima']['terima'];
    const TN = matrix['tidak']['tidak'];
    const total = testingData.length;
    const accuracy = total > 0 ? ((TP + TN) / total) * 100 : 0;
    
    await newBatch.update({ akurasi: accuracy });

    const FP = matrix['tidak']['terima'];
    const FN = matrix['terima']['tidak'];
    const precision = (TP + FP) > 0 ? (TP / (TP + FP)) * 100 : 0;
    const recall = (TP + FN) > 0 ? (TP / (TP + FN)) * 100 : 0;
    const f1score = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

    res.json({
      message: "Pengujian model berhasil.",
      evaluation: {
        accuracy: parseFloat(accuracy.toFixed(2)), 
        precision: parseFloat(precision.toFixed(2)), 
        recall: parseFloat(recall.toFixed(2)),
        f1score: parseFloat(f1score.toFixed(2)), 
        confusionMatrix: matrix, 
        totalTestData: total
      }
    });
  } catch (error) {
    console.error("Error saat menguji model:", error);
    res.status(500).json({ message: "Gagal menguji model.", error: error.message });
  }
});

app.post('/api/selection/test-all', async (req, res) => {
  if (!trainedModel) { 
    return res.status(400).json({ message: "Model belum dilatih." }); 
  }

  try {
    const allApplicants = await Applicant.findAll();
    if (allApplicants.length === 0) {
      return res.status(404).json({ message: 'Tidak ada data pendaftar untuk diuji.' });
    }

    const batchName = `Aplikasi Global - ${new Date().toLocaleString('id-ID')}`;
    const newBatch = await SelectionBatch.create({
      namaBatch: batchName, 
      userId: 1,
      catatan: `Model diterapkan pada seluruh ${allApplicants.length} data.`
    });
    
    await SelectionResult.destroy({ where: {}, truncate: true });
    const resultsToSave = [];
    const matrix = { 'terima': { 'terima': 0, 'tidak': 0 }, 'tidak': { 'terima': 0, 'tidak': 0 } };

    for (const applicant of allApplicants) {
      const plainApplicant = applicant.toJSON();
      const actualStatus = plainApplicant.statusBeasiswa.toLowerCase();
      let { decision: predictedStatus, path } = predict(trainedModel, plainApplicant);
      predictedStatus = predictedStatus.toLowerCase();

      let reason = 'Keputusan berdasarkan aturan mayoritas.';
      const lastRule = path.filter(p => p.attribute).pop();
      if (lastRule) {
        const humanAttribute = lastRule.attribute.replace('_kategori', '');
        let condition = lastRule.threshold != null ? `${humanAttribute} ${plainApplicant[lastRule.attribute] <= lastRule.threshold ? '<=' : '>'} ${lastRule.threshold.toFixed(2)}` : `${humanAttribute} = '${lastRule.value}'`;
        reason = `${predictedStatus} karena memenuhi kondisi: ${condition}`;
      }

      if (matrix[actualStatus] && matrix[actualStatus][predictedStatus] !== undefined) {
        matrix[actualStatus][predictedStatus]++;
      }

      resultsToSave.push({
        applicantId: plainApplicant.id,
        namaPendaftar: plainApplicant.nama,
        ipk: plainApplicant.ipk,
        penghasilanOrtu: plainApplicant.penghasilanOrtu,
        jmlTanggungan: plainApplicant.jmlTanggungan,
        ikutOrganisasi: plainApplicant.ikutOrganisasi,
        ikutUKM: plainApplicant.ikutUKM,
        statusKelulusan: predictedStatus === 'terima' ? 'Terima' : 'Tidak',
        alasanKeputusan: reason,
        batchId: newBatch.id,
        tanggalSeleksi: new Date(),
      });
    }
    await SelectionResult.bulkCreate(resultsToSave);

    const TP = matrix['terima']['terima'];
    const TN = matrix['tidak']['tidak'];
    const total = allApplicants.length;
    const accuracy = total > 0 ? ((TP + TN) / total) * 100 : 0;

    await newBatch.update({ akurasi: accuracy });

    const FP = matrix['tidak']['terima'];
    const FN = matrix['terima']['tidak'];
    const precision = (TP + FP) > 0 ? (TP / (TP + FP)) * 100 : 0;
    const recall = (TP + FN) > 0 ? (TP / (TP + FN)) * 100 : 0;
    const f1score = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

    res.json({
      message: "Model berhasil diterapkan pada seluruh data.",
      evaluation: {
        accuracy: parseFloat(accuracy.toFixed(2)), 
        precision: parseFloat(precision.toFixed(2)), 
        recall: parseFloat(recall.toFixed(2)),
        f1score: parseFloat(f1score.toFixed(2)), 
        confusionMatrix: matrix, 
        totalTestData: total
      }
    });
  } catch (error) {
    console.error("Error saat menguji semua data:", error);
    res.status(500).json({ message: "Gagal menerapkan model ke seluruh data.", error: error.message });
  }
});

app.get('/api/selection/visualize', async (req, res) => {
  if (!trainedModel) {
    return res.status(400).json({ message: "Model belum dilatih." });
  }
  try {
    res.json({
      tree: trainedModel,
      visualization: visualizeTree(trainedModel),
      steps: calculationSteps
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal membuat visualisasi pohon.", error: error.message });
  }
});

app.post('/api/selection/predict-single', async (req, res) => {
  if (!trainedModel) {
    return res.status(400).json({ message: "Model belum dilatih." });
  }
  try {
    const categoricalAttributes = ['penghasilanOrtu', 'ikutOrganisasi', 'ikutUKM'];
    const transformedInput = {};
    for (const key in req.body) {
      if (categoricalAttributes.includes(key)) {
        transformedInput[`${key}_kategori`] = req.body[key];
      } else {
        transformedInput[key] = req.body[key];
      }
    }

    const { decision, path } = predict(trainedModel, transformedInput);
    res.json({ decision, path });
  } catch (error) {
    res.status(500).json({ message: "Gagal melakukan prediksi.", error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Railway Backend running on port ${PORT}`);
  
  sequelize.sync({ force: true }).then(async () => {
    console.log('📊 Database synced');
    
    try {
      await User.create({
        username: 'admin',
        password: 'admin123',
        namaLengkap: 'Administrator Sistem'
      });
      
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