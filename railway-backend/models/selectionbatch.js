'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SelectionBatch extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // SelectionBatch milik User
      models.SelectionBatch.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }
  SelectionBatch.init({
    namaBatch: DataTypes.STRING,
    akurasi: DataTypes.FLOAT,
    catatan: DataTypes.TEXT,
    userId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'SelectionBatch',
  });
  return SelectionBatch;
};