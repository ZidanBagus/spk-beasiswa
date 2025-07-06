'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SelectionResults', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      applicantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Applicants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      namaPendaftar: { type: Sequelize.STRING, allowNull: false },
      ipk: { type: Sequelize.FLOAT, allowNull: false },
      penghasilanOrtu: { type: Sequelize.STRING, allowNull: false },
      jmlTanggungan: { type: Sequelize.INTEGER, allowNull: false },
      ikutOrganisasi: { type: Sequelize.STRING, allowNull: false },
      ikutUKM: { type: Sequelize.STRING, allowNull: false },
      statusKelulusan: { type: Sequelize.STRING, allowNull: false },
      alasanKeputusan: { type: Sequelize.TEXT },
      tanggalSeleksi: { type: Sequelize.DATE, allowNull: false },
      batchId: {
        type: Sequelize.INTEGER,
        references: { model: 'SelectionBatches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  }
};