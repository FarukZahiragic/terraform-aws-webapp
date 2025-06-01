const { Korisnik, Nekretnina, Upit, sequelize } = require("./models.js");
const bcrypt = require("bcrypt");

async function seed() {
    try {
        await sequelize.sync({ force: true });

        
        const hashedPassword = await bcrypt.hash("user", 10);

        
        const korisnik = await Korisnik.create({
            ime: "User",
            prezime: "Userić",
            username: "user",
            password: hashedPassword,
            admin: false
        });

        
        const nekretnine = await Promise.all([
            Nekretnina.create({
                tip_nekretnine: "Stan",
                naziv: "Stan u centru",
                kvadratura: 70,
                cijena: 150000,
                tip_grijanja: "Centralno",
                lokacija: "Sarajevo",
                godina_izgradnje: 2005,
                datum_objave: "2024-05-15",
                opis: "Lijep stan u centru grada."
            }),
            Nekretnina.create({
                tip_nekretnine: "Kuća",
                naziv: "Porodična kuća",
                kvadratura: 120,
                cijena: 250000,
                tip_grijanja: "Etažno",
                lokacija: "Ilidža",
                godina_izgradnje: 2010,
                datum_objave: "2024-05-20",
                opis: "Prostrana kuća sa dvorištem."
            }),
            Nekretnina.create({
                tip_nekretnine: "Poslovni prostor",
                naziv: "Kancelarijski prostor",
                kvadratura: 90,
                cijena: 180000,
                tip_grijanja: "Plinsko",
                lokacija: "Grbavica",
                godina_izgradnje: 2012,
                datum_objave: "2024-06-01",
                opis: "Moderno opremljen poslovni prostor."
            })
        ]);

        
        for (const nekretnina of nekretnine) {
            await Upit.create({
                tekst: `Zanima me da li je "${nekretnina.naziv}" još dostupna?`,
                NekretninaId: nekretnina.id,
                KorisnikId: korisnik.id
            });

            await Upit.create({
                tekst: `Može li se "${nekretnina.naziv}" pogledati uživo?`,
                NekretninaId: nekretnina.id,
                KorisnikId: korisnik.id
            });
        }

        console.log("Baza uspješno seedovana.");
    } catch (error) {
        console.error("Greška pri seedovanju baze:", error);
    } finally {
        await sequelize.close();
    }
}

seed();
