'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SelectionAttribute extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  SelectionAttribute.init({
    attributeName: DataTypes.STRING,
    displayName: DataTypes.STRING,
    isSelected: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'SelectionAttribute',
  });
  return SelectionAttribute;
};