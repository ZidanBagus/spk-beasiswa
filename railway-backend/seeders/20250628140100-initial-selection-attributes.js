'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const attributes = [
      { attributeName: 'ipk', displayName: 'IPK', isSelected: true, createdAt: new Date(), updatedAt: new Date() },
      { attributeName: 'penghasilanOrtu', displayName: 'Penghasilan Orang Tua', isSelected: true, createdAt: new Date(), updatedAt: new Date() },
      { attributeName: 'jmlTanggungan', displayName: 'Jumlah Tanggungan', isSelected: true, createdAt: new Date(), updatedAt: new Date() },
      { attributeName: 'ikutOrganisasi', displayName: 'Keikutsertaan Organisasi', isSelected: true, createdAt: new Date(), updatedAt: new Date() },
      { attributeName: 'ikutUKM', displayName: 'Keikutsertaan UKM', isSelected: true, createdAt: new Date(), updatedAt: new Date() },
      { attributeName: 'prodi', displayName: 'Program Studi', isSelected: false, createdAt: new Date(), updatedAt: new Date() },
      { attributeName: 'jenisKelamin', displayName: 'Jenis Kelamin', isSelected: false, createdAt: new Date(), updatedAt: new Date() },
      { attributeName: 'jarakKampus', displayName: 'Jarak Kampus', isSelected: false, createdAt: new Date(), updatedAt: new Date() },
      { attributeName: 'asalSekolah', displayName: 'Asal Sekolah', isSelected: false, createdAt: new Date(), updatedAt: new Date() },
      { attributeName: 'tahunLulus', displayName: 'Tahun Lulus', isSelected: false, createdAt: new Date(), updatedAt: new Date() },
      { attributeName: 'sks', displayName: 'Jumlah SKS', isSelected: false, createdAt: new Date(), updatedAt: new Date() },
      { attributeName: 'pekerjaanOrtu', displayName: 'Pekerjaan Orang Tua', isSelected: false, createdAt: new Date(), updatedAt: new Date() },
    ];
    
    await queryInterface.bulkInsert('SelectionAttributes', attributes, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SelectionAttributes', null, {});
  }
}