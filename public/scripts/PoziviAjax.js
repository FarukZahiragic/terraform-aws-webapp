const PoziviAjax = (() => {

    function ajaxRequest(method, url, data, callback) {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    callback(null, xhr.responseText);
                } else {
                    callback({ status: xhr.status, statusText: xhr.statusText }, null);
                }
            }
        };
        xhr.send(data ? JSON.stringify(data) : null);
    }

    function getInteresovanja(nekretninaId, fnCallback) {
        ajaxRequest("GET", `/nekretnina/${nekretninaId}/interesovanja`, null, (err, data) => {
          if (err) {
            return fnCallback(err, null);
          }
          try {
            // Parse `data` if it's a string
            const parsedData = typeof data === "string" ? JSON.parse(data) : data;
            fnCallback(null, parsedData);
          } catch (parseError) {
            console.error("Error parsing response data:", parseError);
            fnCallback(parseError, null);
          }
        });
      }

    // Metoda za dodavanje nove ponude
    function postPonuda(nekretninaId, ponudaPodaci, fnCallback) {
        ajaxRequest("POST", `/nekretnina/${nekretninaId}/ponuda`, ponudaPodaci, fnCallback);
    }

    // Metoda za dodavanje novog zahtjeva
    function postZahtjev(nekretninaId, zahtjevPodaci, fnCallback) {
        ajaxRequest("POST", `/nekretnina/${nekretninaId}/zahtjev`, zahtjevPodaci, fnCallback);
    }

    // Metoda za ažuriranje postojećeg zahtjeva
    function putZahtjev(nekretninaId, zahtjevId, zahtjevPodaci, fnCallback) {
        ajaxRequest(
            "PUT",
            `/nekretnina/${nekretninaId}/zahtjev/${zahtjevId}`,
            zahtjevPodaci,
            fnCallback
        );
    }

    function getTop5Nekretnina(lokacija, fnCallback) {
        const ajax = new XMLHttpRequest();
        ajax.onreadystatechange = function () {
            if (ajax.readyState == 4) {
                if (ajax.status == 200) {
                    fnCallback(null, JSON.parse(ajax.responseText));
                } else {
                    fnCallback(`Error: ${ajax.status}`, null);
                }
            }
        };
        ajax.open("GET", `/nekretnine/top5?lokacija=${encodeURIComponent(lokacija)}`, true);
        ajax.send();
    }

    function getMojiUpiti(fnCallback) {
        const ajax = new XMLHttpRequest();
        ajax.onreadystatechange = function () {
            if (ajax.readyState == 4) {
                if (ajax.status == 200) {
                    fnCallback(null, JSON.parse(ajax.responseText));
                } else if (ajax.status == 401) {
                    fnCallback("Neautorizovan pristup", null);
                } else {
                    fnCallback(`Error: ${ajax.status}`, null);
                }
            }
        };
        ajax.open("GET", "/upiti/moji", true);
        ajax.send();
    }

    function getNekretnina(nekretnina_id, fnCallback) {
        const ajax = new XMLHttpRequest();
        ajax.onreadystatechange = function () {
            if (ajax.readyState == 4) {
                if (ajax.status == 200) {
                    fnCallback(null, JSON.parse(ajax.responseText));
                } else if (ajax.status == 404) {
                    fnCallback("Nekretnina nije pronađena", null);
                } else {
                    fnCallback(`Error: ${ajax.status}`, null);
                }
            }
        };
        ajax.open("GET", `/nekretnina/${nekretnina_id}`, true);
        ajax.send();
    }

    function getNextUpiti(nekretnina_id, page, fnCallback) {
        const ajax = new XMLHttpRequest();
        ajax.onreadystatechange = function () {
            if (ajax.readyState == 4) {
                if (ajax.status == 200) {
                    fnCallback(null, JSON.parse(ajax.responseText));
                } else if (ajax.status == 404) {
                    fnCallback("Nema više upita na traženoj stranici", []);
                } else {
                    fnCallback(`Error: ${ajax.status}`, null);
                }
            }
        };
        ajax.open("GET", `/next/upiti/nekretnina${nekretnina_id}?page=${page}`, true);
        ajax.send();
    }

    // fnCallback se u svim metodama poziva kada stigne
    // odgovor sa servera putem Ajax-a
    // svaki callback kao parametre ima error i data,
    // error je null ako je status 200 i data je tijelo odgovora
    // ako postoji greška, poruka se prosljeđuje u error parametru
    // callback-a, a data je tada null

    // vraća korisnika koji je trenutno prijavljen na sistem
    function impl_getKorisnik(fnCallback) {
        let ajax = new XMLHttpRequest();

        ajax.onreadystatechange = function () {
            if (ajax.readyState == 4) {
                if (ajax.status == 200) {
                    console.log('Uspješan zahtjev, status 200');
                    fnCallback(null, JSON.parse(ajax.responseText));
                } else if (ajax.status == 401) {
                    console.log('Neuspješan zahtjev, status 401');
                    fnCallback("error", null);
                } else {
                    console.log('Nepoznat status:', ajax.status);
                }
            }
        };

        ajax.open("GET", "/korisnik/", true);
        ajax.setRequestHeader("Content-Type", "application/json");
        ajax.send();
    }

    // ažurira podatke loginovanog korisnika
    function impl_putKorisnik(noviPodaci, fnCallback) {
        // Check if user is authenticated
        if (!req.session.username) {
            // User is not logged in
            return fnCallback({ status: 401, statusText: 'Neautorizovan pristup' }, null);
        }

        // Get data from request body
        const { ime, prezime, username, password } = noviPodaci;

        // Read user data from the JSON file
        const users = readJsonFile('korisnici');

        // Find the user by username
        const loggedInUser = users.find((user) => user.username === req.session.username);

        if (!loggedInUser) {
            // User not found (should not happen if users are correctly managed)
            return fnCallback({ status: 401, statusText: 'Neautorizovan pristup' }, null);
        }

        // Update user data with the provided values
        if (ime) loggedInUser.ime = ime;
        if (prezime) loggedInUser.prezime = prezime;
        if (username) loggedInUser.adresa = adresa;
        if (password) loggedInUser.brojTelefona = brojTelefona;

        // Save the updated user data back to the JSON file
        saveJsonFile('korisnici', users);

        fnCallback(null, { poruka: 'Podaci su uspješno ažurirani' });
    }


    // dodaje novi upit za trenutno loginovanog korisnika
    function impl_postUpit(nekretnina_id, tekst, fnCallback) {
        const data = { tekst, nekretnina_id };

        ajaxRequest("POST", `/upit`, data, fnCallback);
    }

    function impl_getNekretnine(fnCallback) {
        // Koristimo AJAX poziv da bismo dohvatili podatke s servera
        ajaxRequest('GET', '/nekretnine', null, (error, data) => {
            // Ako se dogodi greška pri dohvaćanju podataka, proslijedi grešku kroz callback
            if (error) {
                fnCallback(error, null);
            } else {
                // Ako su podaci uspješno dohvaćeni, parsiraj JSON i proslijedi ih kroz callback
                try {
                    const nekretnine = JSON.parse(data);
                    fnCallback(null, nekretnine);
                } catch (parseError) {
                    // Ako se dogodi greška pri parsiranju JSON-a, proslijedi grešku kroz callback
                    fnCallback(parseError, null);
                }
            }
        });
    }

    function impl_postLogin(username, password, fnCallback) {
        var ajax = new XMLHttpRequest()

        ajax.onreadystatechange = function () {
            if (ajax.readyState == 4 && ajax.status == 200) {
                fnCallback(null, ajax.response)
            }
            else if (ajax.readyState == 4) {
                //desio se neki error
                fnCallback(ajax.statusText, null)
            }
        }
        ajax.open("POST", "/login", true)
        ajax.setRequestHeader("Content-Type", "application/json")
        var objekat = {
            "username": username,
            "password": password
        }
        forSend = JSON.stringify(objekat)
        ajax.send(forSend)
    }

    function impl_postLogout(fnCallback) {
        let ajax = new XMLHttpRequest()

        ajax.onreadystatechange = function () {
            if (ajax.readyState == 4 && ajax.status == 200) {
                fnCallback(null, ajax.response)
            }
            else if (ajax.readyState == 4) {
                //desio se neki error
                fnCallback(ajax.statusText, null)
            }
        }
        ajax.open("POST", "/logout", true)
        ajax.send()
    }


    return {
        getInteresovanja,
        postPonuda,
        postZahtjev,
        putZahtjev,
        getTop5Nekretnina,
        getMojiUpiti,
        getNekretnina,
        getNextUpiti,
        postLogin: impl_postLogin,
        postLogout: impl_postLogout,
        getKorisnik: impl_getKorisnik,
        putKorisnik: impl_putKorisnik,
        postUpit: impl_postUpit,
        getNekretnine: impl_getNekretnine
    };
})();