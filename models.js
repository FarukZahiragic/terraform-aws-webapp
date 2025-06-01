const { DataTypes } = require("sequelize");
const sequelize = require("./database");

const Korisnik = sequelize.define("Korisnik", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    ime: { type: DataTypes.STRING, allowNull: false },
    prezime: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    admin: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
    freezeTableName: true
});

const Nekretnina = sequelize.define("Nekretnina", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tip_nekretnine: { type: DataTypes.STRING, allowNull: false },
    naziv: { type: DataTypes.STRING, allowNull: false },
    kvadratura: { type: DataTypes.INTEGER, allowNull: false },
    cijena: { type: DataTypes.FLOAT, allowNull: false },
    tip_grijanja: { type: DataTypes.STRING, allowNull: false },
    lokacija: { type: DataTypes.STRING, allowNull: false },
    godina_izgradnje: { type: DataTypes.INTEGER, allowNull: false },
    datum_objave: { type: DataTypes.DATEONLY, allowNull: false },
    opis: { type: DataTypes.TEXT, allowNull: false },
}, {
    freezeTableName: true
});

const Upit = sequelize.define("Upit", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tekst: { type: DataTypes.TEXT, allowNull: false },
}, {
    freezeTableName: true
});

const Zahtjev = sequelize.define("Zahtjev", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tekst: { type: DataTypes.TEXT, allowNull: false },
    trazeniDatum: { type: DataTypes.DATEONLY, allowNull: false },
    odobren: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
    freezeTableName: true
});

const Ponuda = sequelize.define("Ponuda", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tekst: { type: DataTypes.TEXT, allowNull: false },
    cijenaPonude: { type: DataTypes.FLOAT, allowNull: false },
    datumPonude: { type: DataTypes.DATEONLY, allowNull: false },
    odbijenaPonuda: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
    freezeTableName: true
}, {
    getterMethods: {
        async vezanePonude() {
            // Pronađi sve ponude koje imaju isto vezanaPonudaId
            const korijenskaPonudaId = this.vezanaPonudaId || this.id; // Ako vezanaPonudaId nije definirano, trenutna ponuda je korijenska
            const ponude = await Ponuda.findAll({
                where: {
                    vezanaPonudaId: korijenskaPonudaId,
                },
            });
            // Dodaj korijensku ponudu u listu rezultata
            const korijenskaPonuda = await Ponuda.findByPk(korijenskaPonudaId);
            if (korijenskaPonuda) {
                ponude.unshift(korijenskaPonuda);
            }
            return ponude;
        }}
    });

Nekretnina.hasMany(Upit, { as: "upiti" });
Upit.belongsTo(Nekretnina);
Upit.belongsTo(Korisnik);

Nekretnina.hasMany(Zahtjev, { as: "zahtjevi" });
Zahtjev.belongsTo(Nekretnina);
Zahtjev.belongsTo(Korisnik);

Nekretnina.hasMany(Ponuda, { as: "ponude" });
Ponuda.belongsTo(Nekretnina);
Ponuda.belongsTo(Korisnik);

Ponuda.hasMany(Ponuda, { as: "vezanePonude", foreignKey: "vezanaPonudaId" });
Ponuda.belongsTo(Ponuda, { as: "parentPonuda", foreignKey: "vezanaPonudaId" });

sequelize.sync({ alter: true });

module.exports = { Korisnik, Nekretnina, Upit, Zahtjev, Ponuda, sequelize };
