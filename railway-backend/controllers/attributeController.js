const db = require('../models');
const SelectionAttribute = db.SelectionAttribute;

/**
 * Mengambil semua atribut yang tersedia dari database.
 */
exports.getAllAttributes = async (req, res) => {
  try {
    const attributes = await SelectionAttribute.findAll({ order: [['id', 'ASC']] });
    res.status(200).json({ attributes });
  } catch (error) {
    console.error("Error di getAllAttributes:", error);
    res.status(500).json({ message: 'Gagal mengambil data atribut.', error: error.message });
  }
};

/**
 * Memperbarui status 'isSelected' untuk beberapa atribut sekaligus.
 */
exports.updateAttributes = async (req, res) => {
  const attributesToUpdate = req.body; 

  if (!Array.isArray(attributesToUpdate)) {
    return res.status(400).json({ message: 'Input harus berupa array atribut.' });
  }

  const transaction = await db.sequelize.transaction();
  try {
    for (const attr of attributesToUpdate) {
      await SelectionAttribute.update(
        { isSelected: attr.isSelected },
        { where: { id: attr.id }, transaction }
      );
    }
    await transaction.commit();
    
    const updatedAttributes = await SelectionAttribute.findAll({ order: [['id', 'ASC']] });
    res.status(200).json({ message: 'Preferensi atribut berhasil disimpan.', attributes: updatedAttributes });

  } catch (error) {
    await transaction.rollback();
    console.error("Error di updateAttributes:", error);
    res.status(500).json({ message: 'Gagal menyimpan perubahan atribut.', error: error.message });
  }
};

/**
 * FUNGSI UNTUK STATISTIK KARTU DASHBOARD
 * Menghitung jumlah total atribut dan yang dipilih.
 */
exports.getAttributeStats = async (req, res) => {
  try {
    const total = await db.SelectionAttribute.count();
    const selected = await db.SelectionAttribute.count({
      where: { isSelected: true },
    });
    res.status(200).json({ total, selected });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil statistik atribut.', error: error.message });
  }
};
