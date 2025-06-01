const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("wt24", process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, {
  host: process.env.MYSQL_DB_HOST,
  dialect: "mysql",
  logging: false,
});

module.exports = sequelize;
