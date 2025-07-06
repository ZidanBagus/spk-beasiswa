'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // User memiliki banyak SelectionBatch
      models.User.hasMany(models.SelectionBatch, { foreignKey: 'userId', as: 'batches' });
    }
  }
  User.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    namaLengkap: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      // Hook untuk hash password sebelum user baru dibuat
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  // --- INI BAGIAN PERBAIKAN UTAMA ---
  // Menambahkan instance method ke prototype User
  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };
  // ------------------------------------

  return User;
};