const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("wt24", MYSQL_USER, MYSQL_PASSWORD, {
  host: MYSQL_DB_HOST,
  dialect: "mysql",
  logging: false,
});

module.exports = sequelize;
