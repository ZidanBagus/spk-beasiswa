'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Applicant extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Applicant.init({
    nama: DataTypes.STRING,
    prodi: DataTypes.STRING,
    jenisKelamin: DataTypes.STRING,
    jarakKampus: DataTypes.STRING,
    asalSekolah: DataTypes.STRING,
    ipk: DataTypes.FLOAT,
    penghasilanOrtu: DataTypes.STRING,
    jmlTanggungan: DataTypes.INTEGER,
    pekerjaanOrtu: DataTypes.STRING,
    ikutOrganisasi: DataTypes.STRING,
    ikutUKM: DataTypes.STRING,
    tahunLulus: DataTypes.INTEGER,
    sks: DataTypes.INTEGER,
    statusBeasiswa: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Applicant',
  });
  return Applicant;
};