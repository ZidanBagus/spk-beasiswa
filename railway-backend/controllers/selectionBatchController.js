    'use strict';
    const db = require('../models');
    const SelectionBatch = db.SelectionBatch;
    const User = db.User;

    /**
     * Mengambil semua data batch pengujian yang pernah dilakukan.
     */
    exports.getAllBatches = async (req, res) => {
      try {
        const batches = await SelectionBatch.findAll({
          // Sertakan data User (Admin) yang menjalankan batch, tapi jangan sertakan passwordnya
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'namaLengkap']
          }],
          order: [['createdAt', 'DESC']] // Tampilkan yang terbaru di atas
        });
        res.status(200).json(batches);
      } catch (error) {
        console.error("Error mengambil data batch:", error);
        res.status(500).json({ message: 'Gagal memuat riwayat pengujian.', error: error.message });
      }
    };
    