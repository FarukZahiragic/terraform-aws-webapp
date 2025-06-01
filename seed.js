const { Korisnik, Nekretnina, Upit, sequelize } = require("./models.js");
const bcrypt = require("bcrypt");

async function seed() {
    try {
        await sequelize.sync({ force: true });

        
        const hashedPassword = await bcrypt.hash("user", 10);

        
        const korisnik = await Korisnik.create({
            ime: "User",
            prezime: "Useric",
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
                tip_nekretnine: "Kuca",
                naziv: "Porodicna kuca",
                kvadratura: 120,
                cijena: 250000,
                tip_grijanja: "Etazno",
                lokacija: "Ilidza",
                godina_izgradnje: 2010,
                datum_objave: "2024-05-20",
                opis: "Prostrana kuca sa dvoristem."
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
                tekst: `Zanima me da li je "${nekretnina.naziv}" jos dostupna?`,
                NekretninaId: nekretnina.id,
                KorisnikId: korisnik.id
            });

            await Upit.create({
                tekst: `Moze li se "${nekretnina.naziv}" pogledati uzivo?`,
                NekretninaId: nekretnina.id,
                KorisnikId: korisnik.id
            });
        }

        console.log("Baza uspjesno seedovana.");
    } catch (error) {
        console.error("Greska pri seedovanju baze:", error);
    } finally {
        
    }
}

seed();
