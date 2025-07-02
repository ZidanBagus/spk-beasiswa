'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Applicants', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      nama: { type: Sequelize.STRING, allowNull: false },
      prodi: { type: Sequelize.STRING },
      jenisKelamin: { type: Sequelize.STRING },
      jarakKampus: { type: Sequelize.STRING },
      asalSekolah: { type: Sequelize.STRING },
      ipk: { type: Sequelize.FLOAT, allowNull: false },
      penghasilanOrtu: { type: Sequelize.STRING, allowNull: false },
      jmlTanggungan: { type: Sequelize.INTEGER, allowNull: false },
      pekerjaanOrtu: { type: Sequelize.STRING },
      ikutOrganisasi: { type: Sequelize.STRING, allowNull: false },
      ikutUKM: { type: Sequelize.STRING, allowNull: false },
      tahunLulus: { type: Sequelize.INTEGER },
      sks: { type: Sequelize.INTEGER },
      statusBeasiswa: { type: Sequelize.STRING, allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  }
};