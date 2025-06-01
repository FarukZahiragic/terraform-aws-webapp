const express = require('express');
const session = require("express-session");
const path = require('path');
const fs = require('fs').promises; // Using asynchronus API for file read and write
const bcrypt = require('bcrypt');
const { Korisnik, Nekretnina, Upit, Zahtjev, Ponuda, sequelize } = require("./models");



const app = express();
const PORT = 3000;

const loginAttempts = new Map();

app.use(session({
  secret: 'tajna sifra',
  resave: true,
  saveUninitialized: true
}));

app.use(express.static(__dirname + '/public'));
app.use(express.json());

sequelize.sync({ alter: true })
  .then(() => {
    console.log("Baza podataka je uspješno sinhronizovana.");
    require('./seed.js');
  })
  .catch(err => {
    console.error("Greška prilikom sinhronizacije baze podataka:", err);
  });


/* ---------------- SERVING HTML -------------------- */

// Async function for serving html files
async function serveHTMLFile(req, res, fileName) {
  const htmlPath = path.join(__dirname, 'public/html', fileName);
  try {
    const content = await fs.readFile(htmlPath, 'utf-8');
    res.send(content);
  } catch (error) {
    console.error('Error serving HTML file:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
}

// Array of HTML files and their routes
const routes = [
  { route: '/nekretnine.html', file: 'nekretnine.html' },
  { route: '/detalji.html', file: 'detalji.html' },
  { route: '/meni.html', file: 'meni.html' },
  { route: '/prijava.html', file: 'prijava.html' },
  { route: '/profil.html', file: 'profil.html' },
  { route: '/vijesti.html', file: 'vijesti.html' },
  { route: '/statistika.html', file: 'statistika.html' },
  { route: '/mojiUpiti.html', file: 'mojiUpiti.html' }
  // Practical for adding more .html files as the project grows
];

// Loop through the array so HTML can be served
routes.forEach(({ route, file }) => {
  app.get(route, async (req, res) => {
    await serveHTMLFile(req, res, file);
  });
});

/* ----------- SERVING OTHER ROUTES --------------- */

// Async function for reading json data from data folder - koristi se jedino za marketingRute
async function readJsonFile(filename) {
  const filePath = path.join(__dirname, 'data', `${filename}.json`);
  try {
    const rawdata = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(rawdata);
  } catch (error) {
    throw error;
  }
}

// Async function for reading json data from data folder - koristi se jedino za marketingRute
async function saveJsonFile(filename, data) {
  const filePath = path.join(__dirname, 'data', `${filename}.json`);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    throw error;
  }
}

async function logLoginAttempt(username, status) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] - username: "${username}" - status: "${status}"
`;
  try {
    await fs.appendFile(path.join(__dirname, 'data', 'prijave.txt'), logEntry);
  } catch (error) {
    console.error('Error logging login attempt:', error);
  }
}

app.get("/nekretnina/:id/interesovanja", async (req, res) => {
  const { id } = req.params;

  if (!req.session.username) {
    return res.status(401).json({ greska: "Neautorizovan pristup" });
  }

  try {
    const korisnik = await Korisnik.findOne({ where: { username: req.session.username } });
    const nekretnina = await Nekretnina.findByPk(id, {
      include: [
        { model: Upit, as: "upiti" },
        { model: Zahtjev, as: "zahtjevi" },
        { model: Ponuda, as: "ponude" },
      ],
    });

    if (!nekretnina) {
      return res.status(404).json({ greska: "Nekretnina nije pronađena." });
    }

    const interesovanja = {
      upiti: nekretnina.upiti,
      zahtjevi: nekretnina.zahtjevi,
      ponude: [],
    };

    nekretnina.ponude.forEach((ponuda) => {
      if (
        korisnik.admin ||
        ponuda.KorisnikId === korisnik.id ||
        ponuda.vezanaPonudaId === korisnik.id
      ) {
        interesovanja.ponude.push(ponuda);
      } else {
        const { cijenaPonude, ...anonimizovanaPonuda } = ponuda.dataValues;
        interesovanja.ponude.push(anonimizovanaPonuda);
      }
    });

    res.json(interesovanja);
  } catch (error) {
    console.error("Greška prilikom dohvatanja interesovanja:", error);
    res.status(500).json({ greska: "Internal Server Error" });
  }
});

app.post("/nekretnina/:id/ponuda", async (req, res) => {
  const { tekst, ponudaCijene, datumPonude, idVezanePonude, odbijenaPonuda } = req.body;

  try {
    const korisnik = await Korisnik.findOne({ where: { username: req.session.username } });
    const nekretnina = await Nekretnina.findByPk(req.params.id);

    if (!korisnik || !nekretnina) {
      return res.status(404).json({ greska: "Nekretnina ili korisnik nije pronađen." });
    }

    let korijenskaPonudaId = null;

    if (idVezanePonude) {
      const vezanaPonuda = await Ponuda.findByPk(idVezanePonude);

      if (!vezanaPonuda) {
        return res.status(400).json({ greska: "Vezana ponuda ne postoji." });
      }

      // Pronađi korijensku ponudu
      korijenskaPonudaId = vezanaPonuda.vezanaPonudaId || vezanaPonuda.id;

      // Dohvati korijensku ponudu
      const korijenskaPonuda = await Ponuda.findByPk(korijenskaPonudaId);

      // Provjeri da li je korijenska ponuda odbijena
      if (korijenskaPonuda.odbijenaPonuda) {
        return res.status(400).json({ greska: "Ne možete dodati novu ponudu jer je korijenska ponuda odbijena." });
      }

      // Dohvati sve vezane ponude
      const sveVezanePonude = await Ponuda.findAll({
        where: { vezanaPonudaId: korijenskaPonudaId },
      });

      // Provjeri da li je neka od vezanih ponuda odbijena
      const odbijenaPonudaPostoji = sveVezanePonude.some(ponuda => ponuda.odbijenaPonuda);
      if (odbijenaPonudaPostoji) {
        return res.status(400).json({ greska: "Ne možete dodati novu ponudu jer je jedna od ponuda odbijena." });
      }

      // Dodatna pravila za korisnika
      if (!korisnik.admin) {
        // Korisnik može odgovoriti samo na ponude vezane za njegove ponude
        const ponudeKorisnika = await Ponuda.findAll({
          where: { KorisnikId: korisnik.id },
        });
        const ponudaIdsKorisnika = ponudeKorisnika.map(p => p.id);

        if (!ponudaIdsKorisnika.includes(vezanaPonuda.id)) {
          return res.status(403).json({
            greska: "Nemate dozvolu za odgovor na ovu ponudu.",
          });
        }

        // Korisnik može slati ponude s `odbijenaPonuda: true` samo za vezane ponude
        if (odbijenaPonuda && !ponudaIdsKorisnika.includes(idVezanePonude)) {
          return res.status(403).json({
            greska: "Nemate dozvolu za odbijanje ove ponude.",
          });
        }
      }
    }

    // Kreiranje nove ponude
    const novaPonuda = await Ponuda.create({
      tekst,
      cijenaPonude: ponudaCijene,
      datumPonude,
      odbijenaPonuda,
      KorisnikId: korisnik.id,
      NekretninaId: nekretnina.id,
      vezanaPonudaId: korijenskaPonudaId, // Postavljamo korijensku ponudu
    });

    res.json(novaPonuda);
  } catch (error) {
    console.error("Greška prilikom kreiranja ponude:", error);
    res.status(500).json({ greska: "Internal Server Error" });
  }
});



app.post("/nekretnina/:id/zahtjev", async (req, res) => {
  const { tekst, trazeniDatum } = req.body;

  try {
    const korisnik = await Korisnik.findOne({ where: { username: req.session.username } });
    const nekretnina = await Nekretnina.findByPk(req.params.id);

    if (!korisnik || !nekretnina) {
      return res.status(404).json({ greska: "Nekretnina ili korisnik nije pronađen." });
    }

    if (new Date(trazeniDatum) < new Date()) {
      return res.status(404).json({ greska: "Traženi datum je u prošlosti." });
    }

    const noviZahtjev = await Zahtjev.create({
      tekst,
      trazeniDatum,
      KorisnikId: korisnik.id,
      NekretninaId: nekretnina.id,
    });

    res.json(noviZahtjev);
  } catch (error) {
    console.error("Greška prilikom kreiranja zahtjeva:", error);
    res.status(500).json({ greska: "Internal Server Error" });
  }
});

app.put("/nekretnina/:id/zahtjev/:zid", async (req, res) => {
  const { odobren, addToTekst } = req.body;

  if (!req.session.username) {
    return res.status(401).json({ greska: "Neautorizovan pristup" });
  }

  try {
    const korisnik = await Korisnik.findOne({ where: { username: req.session.username } });
    if (!korisnik.admin) {
      return res.status(403).json({ greska: "Samo admin može odobriti zahtjev." });
    }

    const zahtjev = await Zahtjev.findByPk(req.params.zid);
    if (!zahtjev) {
      return res.status(404).json({ greska: "Zahtjev nije pronađen." });
    }

    if (!odobren && !addToTekst) {
      return res.status(400).json({ greska: "Za odbijanje zahtjeva potrebno je dodati tekst odgovora." });
    }

    zahtjev.odobren = odobren;
    if (addToTekst) {
      zahtjev.tekst += ` ODGOVOR ADMINA: ${addToTekst}`;
    }

    await zahtjev.save();
    res.json(zahtjev);
  } catch (error) {
    console.error("Greška prilikom ažuriranja zahtjeva:", error);
    res.status(500).json({ greska: "Internal Server Error" });
  }
});




/*
Checks if the user exists and if the password is correct based on korisnici.json data. 
If the data is correct, the username is saved in the session and a success message is sent.
*/
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const userAttempts = loginAttempts.get(username) || { attempts: 0, blockedUntil: null };
  if (userAttempts.blockedUntil && new Date() < userAttempts.blockedUntil) {
    await logLoginAttempt(username, 'neuspješno');
    return res.status(429).json({ greska: "Previse neuspjesnih pokusaja. Pokusajte ponovo za 1 minutu." });
  }

  try {
    const korisnik = await Korisnik.findOne({ where: { username } });
    // moze se dekomentarisati radi lakseg testiranja
    if (korisnik && password == /*korisnik.password*/await bcrypt.compare(password, korisnik.password)) {
      req.session.username = korisnik.username;
      loginAttempts.delete(username); // Reset attempts on success
      await logLoginAttempt(username, 'uspješno');
      return res.json({ poruka: 'Uspješna prijava' });
    } else {
      userAttempts.attempts += 1;
      if (userAttempts.attempts >= 3) {
        userAttempts.blockedUntil = new Date(new Date().getTime() + 60000); // Block for 1 minute
        userAttempts.attempts = 0;
      }
      loginAttempts.set(username, userAttempts);
      await logLoginAttempt(username, 'neuspješno');
      return res.json({ poruka: 'Neuspješna prijava' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.get('/nekretnine/top5', async (req, res) => {
  const { lokacija } = req.query;
  try {
    const filtered = await Nekretnina.findAll({
      where: { lokacija },
      order: [["datum_objave", "DESC"]],
      limit: 5,
    });
    res.json(filtered);
  } catch (error) {
    console.error('Error fetching top 5 properties:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});


/*
Delete everything from the session.
*/
app.post('/logout', (req, res) => {
  // Check if the user is authenticated
  if (!req.session.username) {
    // User is not logged in
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  // Clear all information from the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      res.status(500).json({ greska: 'Internal Server Error' });
    } else {
      res.status(200).json({ poruka: 'Uspješno ste se odjavili' });
    }
  });
});

/*
Returns currently logged user data. First takes the username from the session and grabs other data
from the .json file.
*/
app.get('/korisnik', async (req, res) => {
  // Check if the username is present in the session
  if (!req.session.username) {
    // User is not logged in
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  // User is logged in, fetch additional user data
  const username = req.session.username;

  try {
    // Find the user by username
    const user = await Korisnik.findOne({ where: { username } });

    if (!user) {
      // User not found (should not happen if users are correctly managed)
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
    }

    // Send user data
    const userData = {
      id: user.id,
      ime: user.ime,
      prezime: user.prezime,
      username: user.username,
      password: user.password,
      admin: user.admin // Should exclude the password for security reasons
    };

    res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

/*
Allows logged user to make a request for a property
*/
app.post('/upit', async (req, res) => {
  // Check if the user is authenticated
  if (!req.session.username) {
    // User is not logged in
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  // Get data from the request body
  const { nekretnina_id, tekst } = req.body;

  try {
    // Find the user by username
    const korisnik = await Korisnik.findOne({ where: { username: req.session.username } });

    // Check if the property with nekretnina_id exists
    const nekretnina = await Nekretnina.findByPk(nekretnina_id);

    if (!nekretnina) {
      // Property not found
      return res.status(400).json({ greska: `Nekretnina sa id-em ${nekretnina_id} ne postoji` });
    }

    const brojUpita = await Upit.count({ where: { KorisnikId: korisnik.id, NekretninaId: nekretnina_id } });
    if (brojUpita >= 3) {
      return res.status(429).json({ greska: 'Previse upita za istu nekretninu.' });
    }

    await Upit.create({ tekst, KorisnikId: korisnik.id, NekretninaId: nekretnina.id });

    res.status(200).json({ poruka: 'Upit je uspješno dodan' });
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.get('/upiti/moji', async (req, res) => {
  if (!req.session.username) {
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  try {
    const korisnik = await Korisnik.findOne({ where: { username: req.session.username } });
    const queries = await Upit.findAll({ where: { KorisnikId: korisnik.id } });

    if (queries.length === 0) {
      return res.status(404).json([]);
    }

    res.json(queries);
  } catch (error) {
    console.error('Error fetching user queries:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.get('/nekretnina/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const nekretnina = await Nekretnina.findByPk(id, {
      include: [{ model: Upit, as: "upiti", limit: 3, order: [["id", "DESC"]] }],
    });

    if (!nekretnina) {
      return res.status(404).json({ greska: 'Nekretnina nije pronađena.' });
    }

    res.json(nekretnina);
  } catch (error) {
    console.error('Error fetching property details:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.get('/next/upiti/nekretnina:id', async (req, res) => {
  const { id } = req.params;
  const { page } = req.query;

  try {
    const nekretnina = await Nekretnina.findOne({ where: { id } });

    if (!nekretnina) {
      return res.status(404).json({ greska: 'Nekretnina nije pronađena.' });
    }

    const pageNumber = parseInt(page, 10);
    if (pageNumber < 0) {
      return res.status(400).json([]);
    }
    const upiti = await Upit.findAll({ where: { NekretninaId: id } });
    const totalUpiti = upiti.length;
    const start = totalUpiti - ((pageNumber + 1) * 3);
    const end = totalUpiti - (pageNumber * 3);
    const paginatedQueries = upiti.slice(Math.max(0, start), Math.max(0, end));

    if (paginatedQueries.length === 0) {
      return res.status(404).json(paginatedQueries);
    }

    res.json(paginatedQueries);
  } catch (error) {
    console.error('Error fetching next queries:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

/*
Updates any user field
*/
app.put('/korisnik', async (req, res) => {
  // Check if the user is authenticated
  if (!req.session.username) {
    // User is not logged in
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  // Get data from the request body
  const { ime, prezime, username, password, admin } = req.body;

  try {
    const loggedInUser = await Korisnik.findOne({ where: { username: req.session.username } });

    if (!loggedInUser) {
      // User not found (should not happen if users are correctly managed)
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
    }

    // Update user data with the provided values
    if (ime) loggedInUser.ime = ime;
    if (prezime) loggedInUser.prezime = prezime;
    if (username) loggedInUser.username = username;
    if (password) {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      loggedInUser.password = hashedPassword;
    }

    await Korisnik.create({ ime, prezime, username, password, admin });
    // Save the updated user data back to the JSON file
    res.status(200).json({ poruka: 'Podaci su uspješno ažurirani' });
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

/*
Returns all properties from the file.
*/
app.get('/nekretnine', async (req, res) => {
  try {
    const nekretnineData = await Nekretnina.findAll();
    res.json(nekretnineData);
  } catch (error) {
    console.error('Error fetching properties data:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

/* ----------------- MARKETING ROUTES ----------------- */

// Route that increments value of pretrage for one based on list of ids in nizNekretnina
app.post('/marketing/nekretnine', async (req, res) => {
  const { nizNekretnina } = req.body;

  try {
    // Load JSON data
    let preferencije = await readJsonFile('preferencije');

    // Check format
    if (!preferencije || !Array.isArray(preferencije)) {
      console.error('Neispravan format podataka u preferencije.json.');
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    // Init object for search
    preferencije = preferencije.map((nekretnina) => {
      nekretnina.pretrage = nekretnina.pretrage || 0;
      return nekretnina;
    });

    // Update atribute pretraga
    nizNekretnina.forEach((id) => {
      const nekretnina = preferencije.find((item) => item.id === id);
      if (nekretnina) {
        nekretnina.pretrage += 1;
      }
    });

    // Save JSON file
    await saveJsonFile('preferencije', preferencije);

    res.status(200).json({});
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/marketing/nekretnina/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Read JSON 
    const preferencije = await readJsonFile('preferencije');

    // Finding the needed objects based on id
    const nekretninaData = preferencije.find((item) => item.id === parseInt(id, 10));

    if (nekretninaData) {
      // Update clicks
      nekretninaData.klikovi = (nekretninaData.klikovi || 0) + 1;

      // Save JSON file
      await saveJsonFile('preferencije', preferencije);

      res.status(200).json({ success: true, message: 'Broj klikova ažuriran.' });
    } else {
      res.status(404).json({ error: 'Nekretnina nije pronađena.' });
    }
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/marketing/osvjezi/pretrage', async (req, res) => {
  const { nizNekretnina } = req.body || { nizNekretnina: [] };

  try {
    // Read JSON 
    const preferencije = await readJsonFile('preferencije');

    // Finding the needed objects based on id
    const promjene = nizNekretnina.map((id) => {
      const nekretninaData = preferencije.find((item) => item.id === id);
      return { id, pretrage: nekretninaData ? nekretninaData.pretrage : 0 };
    });

    res.status(200).json({ nizNekretnina: promjene });
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/marketing/osvjezi/klikovi', async (req, res) => {
  const { nizNekretnina } = req.body || { nizNekretnina: [] };

  try {
    // Read JSON 
    const preferencije = await readJsonFile('preferencije');

    // Finding the needed objects based on id
    const promjene = nizNekretnina.map((id) => {
      const nekretninaData = preferencije.find((item) => item.id === id);
      return { id, klikovi: nekretninaData ? nekretninaData.klikovi : 0 };
    });

    res.status(200).json({ nizNekretnina: promjene });
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
