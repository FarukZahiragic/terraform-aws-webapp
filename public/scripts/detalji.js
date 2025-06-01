function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

document.addEventListener("DOMContentLoaded", () => {
    const nekretninaId = getQueryParam('id');
    const tipInteresovanja = document.getElementById("tipInteresovanja");
    const upitPolja = document.getElementById("upitPolja");
    const zahtjevPolja = document.getElementById("zahtjevPolja");
    const ponudaPolja = document.getElementById("ponudaPolja");
    const vezanaPonudaDropdown = document.getElementById("vezanaPonuda");
    const formaInteresovanje = document.getElementById("dodajInteresovanje");
    let currentPage = 0; // Trenutna stranica za upite
    let allUpitiLoaded = false; // Da li su svi upiti učitani
    let loadedInteresovanja = []; // Svi učitani upiti
    const upitiContainer = document.getElementById('upiti');

    if (nekretninaId) {
        // Dohvaćanje podataka o nekretnini
        PoziviAjax.getNekretnina(nekretninaId, (error, nekretnina) => {
            if (error) {
                console.error('Greška prilikom dohvatanja nekretnine:', error);
                document.body.innerHTML = '<p>Došlo je do greške prilikom učitavanja podataka o nekretnini.</p>';
            } else {
                tipInteresovanja.addEventListener("change", () => {
                    upitPolja.style.display = tipInteresovanja.value === "upit" ? "block" : "none";
                    zahtjevPolja.style.display = tipInteresovanja.value === "zahtjev" ? "block" : "none";
                    ponudaPolja.style.display = tipInteresovanja.value === "ponuda" ? "block" : "none";

                    // Ako je odabran tip "ponuda", popuni dropdown za vezane ponude
                    if (tipInteresovanja.value === "ponuda") {
                        // First, fetch the current user's data to determine admin status
                        PoziviAjax.getKorisnik((err, korisnik) => {
                          if (err) {
                            console.error("Greška prilikom dohvatanja korisničkih podataka:", err);
                            return;
                          }
                    
                          const isAdmin = korisnik.admin;
                    
                          // Then, fetch interesovanja for the property
                          PoziviAjax.getInteresovanja(nekretninaId, (err, interesovanja) => {
                            if (err) {
                              console.error("Greška prilikom dohvatanja interesovanja:", err);
                              return;
                            }
                    
                            // Populate dropdown based on admin status and interesovanja
                            vezanaPonudaDropdown.innerHTML = "";
                            const ponude = interesovanja.ponude;
                    
                            if (ponude.length === 0) {
                              vezanaPonudaDropdown.disabled = true;
                              vezanaPonudaDropdown.innerHTML = "<option value=''>Nema vezanih ponuda</option>";
                            } else {
                              vezanaPonudaDropdown.disabled = false;
                    
                              ponude.forEach((ponuda) => {
                                // If admin, show all offers; otherwise, filter based on related offers
                                if (
                                  isAdmin ||
                                  ponuda.cijenaPonude !== undefined
                                ) {
                                  const option = document.createElement("option");
                                  option.value = ponuda.id;
                                  option.textContent = `ID: ${ponuda.id} - ${ponuda.tekst}`;
                                  vezanaPonudaDropdown.appendChild(option);
                                }
                              });
                    
                              // If no relevant offers are found, display a message
                              if (vezanaPonudaDropdown.innerHTML === "") {
                                vezanaPonudaDropdown.disabled = true;
                                vezanaPonudaDropdown.innerHTML =
                                  "<option value=''>Nema vezanih ponuda za vas</option>";
                              }
                            }
                          });
                        });
                      }
                });

                // Slanje interesovanja na server
                formaInteresovanje.addEventListener("submit", event => {
                    event.preventDefault();

                    const tip = tipInteresovanja.value;
                    if (tip === "upit") {
                        const tekst = document.getElementById("tekstUpita").value;
                        PoziviAjax.postUpit(nekretninaId, tekst, (err, data) => {
                            if (err) {
                                alert("Greška prilikom dodavanja upita.");
                            } else {
                                alert("Upit uspješno dodan!");
                                location.reload();
                            }
                        });
                    } else if (tip === "zahtjev") {
                        const tekst = document.getElementById("tekstZahtjeva").value;
                        const trazeniDatum = document.getElementById("datumZahtjeva").value;
                        PoziviAjax.postZahtjev(nekretninaId, { tekst, trazeniDatum }, (err, data) => {
                            if (err) {
                                alert("Greška prilikom dodavanja zahtjeva.");
                            } else {
                                alert("Zahtjev uspješno dodan!");
                                location.reload();
                            }
                        });
                    } else if (tip === "ponuda") {
                        const tekst = document.getElementById("tekstPonude").value;
                        const ponudaCijene = parseFloat(document.getElementById("cijenaPonude").value);
                        const datumPonude = new Date().toISOString().split("T")[0];
                        const idVezanePonude = vezanaPonudaDropdown.value || null;
                        const odbijenaPonuda = document.getElementById("odbijenaPonuda").checked;

                        PoziviAjax.postPonuda(
                            nekretninaId,
                            { tekst, ponudaCijene, datumPonude, idVezanePonude, odbijenaPonuda },
                            (err, data) => {
                                if (err) {
                                    alert("Greška prilikom dodavanja ponude.");
                                } else {
                                    alert("Ponuda uspješno dodana!");
                                    location.reload();
                                }
                            }
                        );
                    }
                });

                // Popunjavanje osnovnih podataka
                document.getElementById('slikaNekretnine').src = `../Resources/${nekretnina.id}.jpg`;
                document.getElementById('slikaNekretnine').alt = nekretnina.naziv;
                document.getElementById('nazivNekretnine').textContent = nekretnina.naziv;
                document.getElementById('kvadraturaNekretnine').textContent = `${nekretnina.kvadratura} m²`;
                document.getElementById('cijenaNekretnine').textContent = `${nekretnina.cijena} BAM`;

                // Popunjavanje detalja
                document.getElementById('tipGrijanja').textContent = nekretnina.tip_grijanja;
                document.getElementById('godinaIzgradnje').textContent = nekretnina.godina_izgradnje;
                document.getElementById('opisNekretnine').textContent = nekretnina.opis;

                const lokacijaElement = document.getElementById('lokacija');
                const lokacijaLink = document.createElement('a');
                lokacijaLink.href = '#';
                lokacijaLink.textContent = nekretnina.lokacija;
                lokacijaLink.addEventListener('click', () => {
                    // Pozivanje metode getTop5Nekretnina
                    PoziviAjax.getTop5Nekretnina(nekretnina.lokacija, (error, nekretnine) => {
                        if (error) {
                            console.error('Greška prilikom dohvatanja nekretnina za lokaciju:', error);
                            return;
                        }
                        // Preusmjeravanje na nekretnine.html s filtriranim podacima
                        const filteredNekretnineParam = encodeURIComponent(JSON.stringify(nekretnine));
                        window.location.href = `../html/nekretnine.html?filteredNekretnine=${filteredNekretnineParam}`;
                    });
                });
                lokacijaElement.appendChild(lokacijaLink);

                // Kreiranje wrappera za carousel
                const carouselWrapper = document.createElement('div');
                carouselWrapper.id = 'carouselWrapper';
                carouselWrapper.style.display = 'flex';
                carouselWrapper.style.alignItems = 'center';
                carouselWrapper.style.justifyContent = 'space-between';

                // Premještanje upitiContainer unutar wrappera
                upitiContainer.parentElement.insertBefore(carouselWrapper, upitiContainer);
                carouselWrapper.appendChild(upitiContainer);

                // Kreiranje i dodavanje dugmadi u wrapper
                const lijevoDugme = document.createElement('button');
                lijevoDugme.id = 'lijevoDugme';
                lijevoDugme.textContent = '<';

                const desnoDugme = document.createElement('button');
                desnoDugme.id = 'desnoDugme';
                desnoDugme.textContent = '>';

                // Dodavanje dugmadi u wrapper
                carouselWrapper.insertBefore(lijevoDugme, upitiContainer);
                carouselWrapper.appendChild(desnoDugme);

                function showInteresovanje(index) {
                    upitiContainer.innerHTML = "";

                    if (loadedInteresovanja[index]) {
                        const interesovanje = loadedInteresovanja[index];
                        const interesovanjeElement = document.createElement("div");
                        interesovanjeElement.classList.add("interesovanje");

                        // Prikaz zajedničkih polja
                        interesovanjeElement.innerHTML = `
                        <p><strong>ID:</strong> ${interesovanje.id}</p>
                        <p><strong>Tekst:</strong> ${interesovanje.tekst}</p>
                      `;

                        // Prikaz dodatnih informacija za ponude i zahtjeve
                        if (interesovanje.tip === "ponuda") {
                            interesovanjeElement.innerHTML += `
                          <p><strong>Status:</strong> ${interesovanje.odbijenaPonuda ? "Odbijena" : "Odobrena"
                                }</p>
                        `;
                        } else if (interesovanje.tip === "zahtjev") {
                            PoziviAjax.getKorisnik((err, korisnik) => {
                                if (err) {
                                  console.error("Greška prilikom dohvatanja korisničkih podataka:", err);
                                  return;
                                }
                          
                                const isAdmin = korisnik.admin;
                             if(isAdmin || interesovanje.korisnikId == korisnik.id){   
                            interesovanjeElement.innerHTML += `
                          <p><strong>Datum:</strong> ${interesovanje.trazeniDatum}</p>
                          <p><strong>Status:</strong> ${interesovanje.odobren ? "Odobren" : "Na čekanju"
                                }</p>
                        `;}
                            });
                        }

                        upitiContainer.appendChild(interesovanjeElement);
                    }
                }

                function loadInteresovanja() {
                    PoziviAjax.getInteresovanja(nekretninaId, (err, data) => {
                        if (err) {
                            console.error("Greška prilikom dohvatanja interesovanja:", err);
                        } else {
                            loadedInteresovanja = [
                                ...data.upiti.map((u) => ({ ...u, tip: "upit" })),
                                ...data.zahtjevi.map((z) => ({ ...z, tip: "zahtjev" })),
                                ...data.ponude.map((p) => ({ ...p, tip: "ponuda" })),
                            ];

                            // Inicijalni prikaz
                            currentIndex = 0;
                            showInteresovanje(currentIndex);
                        }
                    });
                }

                // Funkcija za prikazivanje jednog upita u carouselu
                /*function showUpit(index) {
                    upitiContainer.innerHTML = '';
                    if (loadedInteresovanja[index]) {
                        const upit = loadedInteresovanja[index];
                        const upitElement = document.createElement('div');
                        upitElement.classList.add('upit');
                        upitElement.innerHTML = `
                            <p><strong>Korisnik:</strong> ${upit.KorisnikId}</p>
                            <p>${upit.tekst}</p>
                        `;
                        upitiContainer.appendChild(upitElement);
                    }
                }*/

                // Funkcija za ucitavanje narednih upita
                /*function loadNextUpiti() {
                    if (allUpitiLoaded) return;

                    PoziviAjax.getNextUpiti(nekretninaId, currentPage, (error, upiti) => {
                        console.log(currentPage);
                        if (error) {
                            console.error('Greška prilikom dohvatanja narednih upita:', error);
                            allUpitiLoaded = true;
                            currentIndex = 0;
                            showUpit(currentIndex);
                            return;
                        }

                        if (upiti.length === 0) {
                            allUpitiLoaded = true;
                        } else {
                            loadedInteresovanja = loadedInteresovanja.concat(upiti);
                            currentPage++;
                            currentIndex++;
                            showUpit(currentIndex);
                        }
                    });
                }*/

                let currentIndex = 0;
                loadInteresovanja();
                currentIndex--;

                lijevoDugme.addEventListener('click', () => {
                    if (currentIndex > 0) {
                        currentIndex--;
                        showInteresovanje(currentIndex);
                    } else {
                        currentIndex = loadedInteresovanja.length - 1;
                        showInteresovanje(currentIndex);
                    }
                });

                desnoDugme.addEventListener('click', () => {
                    if (currentIndex < loadedInteresovanja.length - 1) {
                        currentIndex++;
                        showInteresovanje(currentIndex);
                    } else if (!allUpitiLoaded) {
                        loadInteresovanja();
                    } else {
                        currentIndex = 0;
                        showInteresovanje(currentIndex);
                    }
                });
            }
        });
    } else {
        document.body.innerHTML = '<p>Nekretnina nije specificirana u URL-u.</p>';
    }
});