// controllers/reportController.js
const db = require('../models');
const SelectionResult = db.SelectionResult;
const { Op } = require('sequelize'); // Pastikan Op diimpor dari sequelize

exports.getAllSelectionResults = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = 'semua',
      sortBy = 'tanggalSeleksi', // Default sort
      sortOrder = 'DESC', // Default order
      fetchAll = 'false' // Parameter baru, defaultnya string 'false' dari query
    } = req.query;

    let paginationOptions = {};
    // Hanya terapkan pagination jika fetchAll BUKAN 'true'
    if (String(fetchAll).toLowerCase() !== 'true') {
      const parsedLimit = parseInt(limit);
      const parsedPage = parseInt(page);
      const offset = (parsedPage - 1) * parsedLimit;
      paginationOptions.limit = parsedLimit;
      paginationOptions.offset = offset;
    }
    // Jika fetchAll === 'true', paginationOptions akan kosong, mengambil semua data yang cocok whereClause

    let whereClause = {};
    if (status && status !== 'semua') {
      whereClause.statusKelulusan = status;
    }

    if (search) {
      const searchNum = parseFloat(search);
      const searchClauses = [
        { namaPendaftar: { [Op.iLike]: `%${search}%` } },
        { penghasilanOrtu: { [Op.iLike]: `%${search}%` } }
      ];
      if (!isNaN(searchNum)) {
        searchClauses.push({ ipk: searchNum });
        const searchInt = parseInt(search); // Untuk jmlTanggungan
        if(!isNaN(searchInt)) searchClauses.push({ jmlTanggungan: searchInt });
        // Anda bisa tambahkan pencarian skorPrediksi jika relevan
        // searchClauses.push({ skorPrediksi: searchNum }); 
      }
      // Memungkinkan pencarian berdasarkan status juga
      if (search.toLowerCase() === 'direkomendasikan' || search.toLowerCase() === 'tidak direkomendasikan') {
        searchClauses.push({ statusKelulusan: { [Op.iLike]: `%${search}%` } });
      }
      if (searchClauses.length > 0) {
        whereClause[Op.or] = searchClauses;
      }
    }
    
    const allowedSortByFields = ['id', 'namaPendaftar', 'ipk', 'penghasilanOrtu', 'jmlTanggungan', 'statusKelulusan', 'skorPrediksi', 'tanggalSeleksi', 'createdAt', 'updatedAt'];
    const validSortBy = allowedSortByFields.includes(sortBy) ? sortBy : 'tanggalSeleksi';
    const validSortOrder = ['ASC', 'DESC'].includes(String(sortOrder).toUpperCase()) ? String(sortOrder).toUpperCase() : 'DESC';

    const queryOptions = {
      where: whereClause,
      order: [[validSortBy, validSortOrder]],
      ...paginationOptions 
    };
    
    // Ambil data (semua atau terpaginasi)
    const rows = await SelectionResult.findAll(queryOptions);
    // Hitung total item yang cocok dengan filter (untuk pagination dan summary)
    const count = await SelectionResult.count({ where: whereClause });

    // Hitung summary berdasarkan filter yang aktif
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
    
    console.log(`REPORT_CONTROLLER: Ditemukan ${count} total hasil (setelah filter). fetchAll: ${fetchAll}. Mengirim ${rows.length} baris.`);
    res.status(200).json({
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
    console.error('Error mengambil hasil seleksi (reportController):', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengambil hasil seleksi.', error: error.message });
  }
};