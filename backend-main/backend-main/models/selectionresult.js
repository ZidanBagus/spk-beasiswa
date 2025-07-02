'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SelectionResult extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  SelectionResult.init({
    applicantId: DataTypes.INTEGER,
    namaPendaftar: DataTypes.STRING,
    ipk: DataTypes.FLOAT,
    penghasilanOrtu: DataTypes.STRING,
    jmlTanggungan: DataTypes.INTEGER,
    ikutOrganisasi: DataTypes.STRING,
    ikutUKM: DataTypes.STRING,
    statusKelulusan: DataTypes.STRING,
    alasanKeputusan: DataTypes.TEXT,
    tanggalSeleksi: DataTypes.DATE,
    batchId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'SelectionResult',
  });
  return SelectionResult;
};