const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("wt24", "root", "password", {
  host: "mysql-db",
  dialect: "mysql",
  logging: false,
});

module.exports = sequelize;
