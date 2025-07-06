'use strict';

const db = require('../models');
const Applicant = db.Applicant;
const { Op } = require('sequelize');
const XLSX = require('xlsx');

// 'Kamus' yang diperbarui untuk membaca semua kolom dari Excel Anda
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

// Fungsi utilitas untuk mem-parsing data Excel, tidak perlu diubah
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

// Mengunggah pendaftar dari file Excel
exports.uploadApplicants = async (req, res) => {
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
            fields: Object.keys(fieldConfig) // Otomatis mengambil semua field dari 'kamus'
        });

        res.status(201).json({
            message: `Berhasil mengimpor dan menyimpan ${createdApplicants.length} data pendaftar.`,
            importedCount: createdApplicants.length,
        });
    } catch (error) {
        console.error('Error di endpoint uploadApplicants:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: "Data tidak valid: " + error.errors.map(e => e.message).join(', '),
                details: error.errors
            });
        }
        res.status(500).json({
            message: 'Terjadi kesalahan pada server saat mengimpor data.',
            error: error.message || 'Error tidak diketahui'
        });
    }
};

// Membuat satu pendaftar baru
exports.createApplicant = async (req, res) => {
  try {
    // req.body akan berisi semua data dari form frontend
    const newApplicant = await Applicant.create(req.body);
    res.status(201).json({ message: 'Data pendaftar berhasil ditambahkan.', applicant: newApplicant });
  } catch (error) {
    console.error('Error menambah pendaftar:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: "Data tidak valid: " + error.errors.map(e => e.message).join(', '), details: error.errors });
    }
    res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: error.message });
  }
};

// Mengupdate satu pendaftar
exports.updateApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;
    const applicant = await Applicant.findByPk(applicantId);
    if (!applicant) {
      return res.status(404).json({ message: 'Data pendaftar tidak ditemukan.' });
    }
    await applicant.update(req.body);
    res.status(200).json({ message: 'Data pendaftar berhasil diperbarui.', applicant });
  } catch (error) {
    console.error('Error mengupdate pendaftar:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: "Data tidak valid: " + error.errors.map(e => e.message).join(', '), details: error.errors });
    }
    res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: error.message });
  }
};

// Mendapatkan semua pendaftar dengan paginasi dan pencarian
exports.getAllApplicants = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = {};
    if (search) {
      whereClause = {
        [Op.or]: [
          { nama: { [Op.iLike]: `%${search}%` } },
          { prodi: { [Op.iLike]: `%${search}%` } },
          { asalSekolah: { [Op.iLike]: `%${search}%` } },
          { statusBeasiswa: { [Op.iLike]: `%${search}%` } },
        ]
      };
    }

    const { count, rows } = await Applicant.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['id', 'ASC']]
    });

    res.status(200).json({
      totalItems: count,
      applicants: rows,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error mengambil data pendaftar:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: error.message });
  }
};

// Mendapatkan pendaftar tunggal berdasarkan ID
exports.getApplicantById = async (req, res) => {
  try {
    const applicant = await Applicant.findByPk(req.params.id);
    if (!applicant) {
      return res.status(404).json({ message: 'Data pendaftar tidak ditemukan.' });
    }
    res.status(200).json(applicant);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: error.message });
  }
};

// Menghapus pendaftar
exports.deleteApplicant = async (req, res) => {
  try {
    const applicant = await Applicant.findByPk(req.params.id);
    if (!applicant) {
      return res.status(404).json({ message: 'Data pendaftar tidak ditemukan.' });
    }
    await applicant.destroy();
    res.status(200).json({ message: 'Data pendaftar berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: error.message });
  }
};

// Mendapatkan statistik pendaftar untuk dashboard
exports.getApplicantStats = async (req, res) => {
  try {
    const SelectionResult = db.SelectionResult;
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const startOfSevenDaysAgo = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate());

    const applicantsToday = await Applicant.count({ where: { createdAt: { [Op.gte]: startOfToday } } });
    const applicantsLast7Days = await Applicant.count({ where: { createdAt: { [Op.gte]: startOfSevenDaysAgo } } });
    const totalApplicants = await Applicant.count();

    // Selection Results Statistics
    const totalResults = await SelectionResult.count();
    const acceptedResults = await SelectionResult.count({ where: { statusKelulusan: 'Terima' } });
    const rejectedResults = await SelectionResult.count({ where: { statusKelulusan: 'Tidak' } });
    const acceptanceRate = totalResults > 0 ? ((acceptedResults / totalResults) * 100).toFixed(1) : 0;

    // IPK Analysis
    const highIPKApplicants = await Applicant.count({ where: { ipk: { [Op.gte]: 3.5 } } });
    const highIPKAccepted = await SelectionResult.count({ 
      where: { 
        statusKelulusan: 'Terima',
        ipk: { [Op.gte]: 3.5 }
      } 
    });
    const highIPKRate = highIPKApplicants > 0 ? ((highIPKAccepted / highIPKApplicants) * 100).toFixed(1) : 0;

    // Penghasilan Analysis
    const lowIncomeApplicants = await Applicant.count({ 
      where: { 
        penghasilanOrtu: { [Op.in]: ['Rendah', 'rendah', 'Kurang dari 2 juta'] }
      } 
    });
    const lowIncomeAccepted = await SelectionResult.count({ 
      where: { 
        statusKelulusan: 'Terima',
        penghasilanOrtu: { [Op.in]: ['Rendah', 'rendah', 'Kurang dari 2 juta'] }
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
            [Op.gte]: monthStart,
            [Op.lte]: monthEnd
          }
        }
      });
      monthlyData.push({
        month: monthStart.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        count: monthCount
      });
    }

    res.status(200).json({
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
    res.status(500).json({
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
};