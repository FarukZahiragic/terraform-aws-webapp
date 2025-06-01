const nekretnine = StatistikaNekretnina();
nekretnine.init(listaNekretnina, listaKorisnika);

function prikaziProsjecnuKvadraturu() {
    let kriterij;
    try {
        kriterij = JSON.parse(document.getElementById("kvadratura-kriterij").value);
    } catch (e) {
        alert("Greška: Unesite kriterij u ispravnom formatu! Format: {\"tip_nekretnine\":\"Stan\"}");
        return;
    }
    const rezultat = nekretnine.prosjecnaKvadratura(kriterij);
    document.getElementById("rezultat-kvadratura").innerText = 
        rezultat ? `Prosječna kvadratura: ${rezultat.toFixed(2)} m²` : "Nema podataka za navedeni kriterij.";
}

function prikaziOutlier() {
    let kriterij;
    try {
        kriterij = JSON.parse(document.getElementById("outlier-kriterij").value);
    } catch (e) {
        alert("Greška: Unesite kriterij u ispravnom formatu! Format: {\"tip_nekretnine\":\"Stan\"}");
        return;
    }
    const nazivSvojstva = document.getElementById("naziv-svojstva").value;
    const rezultat = nekretnine.outlier(kriterij, nazivSvojstva);
    document.getElementById("rezultat-outlier").innerText =
        rezultat ? `Outlier nekretnina: ${rezultat.naziv}, Vrijednost: ${rezultat[nazivSvojstva]}` : "Nema outlier-a za zadani kriterij.";
}

function prikaziMojeNekretnine() {
    const korisnikId = parseInt(document.getElementById("korisnik-id").value);
    const korisnik = listaKorisnika.find(k => k.id === korisnikId);
    if (!korisnik) {
        alert("Korisnik s tim ID-om ne postoji.");
        document.getElementById("rezultat-nekretnine").innerHTML = "";
        return;
    }
    const mojeNekretnine = nekretnine.mojeNekretnine(korisnik);
    document.getElementById("rezultat-nekretnine").innerHTML =
        mojeNekretnine.length > 0 
            ? mojeNekretnine.map(nekretnina => `<p>${nekretnina.naziv} (${nekretnina.cijena} KM)</p>`).join("")
            : "Nema nekretnina za ovog korisnika.";
}

function iscrtajHistogram() {
    const divHistogrami = document.getElementById("histogrami");

    // Dohvatanje i parsiranje unosa perioda i raspona cijena
    const periodiInput = document.getElementById("periodi").value.trim();
    const rasponiCijenaInput = document.getElementById("rasponi-cijena").value.trim();

    let periodi, rasponiCijena;
    try {
        periodi = JSON.parse(periodiInput);
        rasponiCijena = JSON.parse(rasponiCijenaInput);
    } catch (error) {
        alert("Unesite validan format za periode i raspone cijena.");
        return;
    }

    // Dobijanje podataka za histogram
    const histogramPodaci = nekretnine.histogramCijena(periodi, rasponiCijena);

    // Ciscenje prethodne histograme
    divHistogrami.innerHTML = "";

    // Generisanje grafova za svaki period
    periodi.forEach((period, indeksPerioda) => {
        // Filtriranje podataka za ovaj period
        const podaciZaPeriod = histogramPodaci.filter(
            pod => pod.indeksPerioda === indeksPerioda
        );

        // Konvertovanje podataka u Chart.js format
        const labels = rasponiCijena.map(
            raspon => `${raspon.od}-${raspon.do}`
        );
        const data = rasponiCijena.map(
            (_, indeksRaspona) => {
                const pod = podaciZaPeriod.find(p => p.indeksRasponaCijena === indeksRaspona);
                return pod ? pod.brojNekretnina : 0;
            }
        );

        // Dodavanje canvasa za Chart.js
        const canvas = document.createElement("canvas");
        canvas.id = `chart-${indeksPerioda}`;
        divHistogrami.appendChild(canvas);

        // Kreiranje bar charta
        new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: `Period ${period.od} - ${period.do}`,
                    data: data,
                    backgroundColor: "rgba(75, 192, 192, 0.5)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: "top" },
                    title: { display: true, text: `Histogram za period ${period.od} - ${period.do}` },
                },
                scales: {
                    x: { beginAtZero: true },
                    y: { beginAtZero: true }
                }
            }
        });
    });
}
