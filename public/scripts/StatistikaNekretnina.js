let StatistikaNekretnina = function () {
    let spisakNekretnina;

    let init = function (listaNekretnina, listaKorisnika) {
        spisakNekretnina = SpisakNekretnina();
        spisakNekretnina.init(listaNekretnina, listaKorisnika);
    };

    let prosjecnaKvadratura = function (kriterij) {
        if (!spisakNekretnina) return null;


        if(!(kriterij.tip_nekretnine || 
            kriterij.min_kvadratura || 
            kriterij.max_kvadratura || 
            kriterij.min_cijena || 
            kriterij.max_cijena || 
            kriterij.id || 
            kriterij.naziv ||
            kriterij.tip_grijanja ||
            kriterij.lokacija ||
            kriterij.godina_izgradnje ||
            kriterij.datum_objave || 
            kriterij.opis ||
            kriterij.upiti)) {
            alert("Niste unijeli validan kriterij, validni kriteriji su: tip_nekretnine, min_kvadratura, max_kvadratura, min_cijena, max_cijena, id, naziv, tip_grijanja, lokacija, godina_izgradnje, datum_objave, opis, upiti");
            return null;
        }
        const filtriraneNekretnine = spisakNekretnina.filtrirajNekretnine(kriterij);
        if (filtriraneNekretnine.length === 0) return 0;

        const ukupnaKvadratura = filtriraneNekretnine.reduce((ukupno, nekretnina) => ukupno + nekretnina.kvadratura, 0);
        return ukupnaKvadratura / filtriraneNekretnine.length;
    };

    let outlier = function (kriterij, nazivSvojstva) {
        if (!spisakNekretnina) return null;

        const filtriraneNekretnine = spisakNekretnina.filtrirajNekretnine(kriterij);
        if (filtriraneNekretnine.length === 0) return null;

        if (
            !filtriraneNekretnine[0] || 
            !(nazivSvojstva in filtriraneNekretnine[0]) || 
            typeof filtriraneNekretnine[0][nazivSvojstva] !== 'number'
        ) {
            alert(`Svojstvo "${nazivSvojstva}" nije validno ili nije brojčanog tipa.`);
            return null;
        }

        const prosjecnaVrijednost = spisakNekretnina.listaNekretnina.reduce((ukupno, nekretnina) => ukupno + nekretnina[nazivSvojstva], 0) / spisakNekretnina.listaNekretnina.length;

        return filtriraneNekretnine.reduce((najveciOutlier, nekretnina) => {
            const odstupanje = Math.abs(nekretnina[nazivSvojstva] - prosjecnaVrijednost);
            return (!najveciOutlier || odstupanje > najveciOutlier.odstupanje) ? { nekretnina, odstupanje } : najveciOutlier;
        }, null).nekretnina;
    };

    let mojeNekretnine = function (korisnik) {
        if (!spisakNekretnina) return [];

        const nekretnineSaUpitima = spisakNekretnina.listaNekretnina.filter(nekretnina =>
            nekretnina.upiti.some(upit => upit.korisnik_id === korisnik.id)
        );

        return nekretnineSaUpitima.sort((a, b) => {
            const upitiKorisnikaA = a.upiti.filter(upit => upit.korisnik_id === korisnik.id).length;
            const upitiKorisnikaB = b.upiti.filter(upit => upit.korisnik_id === korisnik.id).length;
            return upitiKorisnikaB - upitiKorisnikaA;
        });
    };

    let histogramCijena = function (periodi, rasponiCijena) {
        if (!spisakNekretnina) return [];

        const rezultat = [];
        periodi.forEach((period, indeksPerioda) => {
            function parseDMYToDate(dmy) {
                const [day, month, year] = dmy.split('.').map(Number);
                return new Date(year, month - 1, day);
            }

            const nekretnineUPeriodu = spisakNekretnina.listaNekretnina.filter(nekretnina =>
                parseDMYToDate(nekretnina.datum_objave).getFullYear() >= period.od &&
                parseDMYToDate(nekretnina.datum_objave).getFullYear() <= period.do
            );

            rasponiCijena.forEach((raspon, indeksRasponaCijena) => {
                const nekretnineURasponu = nekretnineUPeriodu.filter(nekretnina =>
                    nekretnina.cijena >= raspon.od && nekretnina.cijena <= raspon.do
                );
                

                rezultat.push({
                    indeksPerioda,
                    indeksRasponaCijena,
                    brojNekretnina: nekretnineURasponu.length,
                    period,
                    raspon
                });
            });
        });

        return rezultat;
    };

    return {
        init: init,
        prosjecnaKvadratura: prosjecnaKvadratura,
        outlier: outlier,
        mojeNekretnine: mojeNekretnine,
        histogramCijena: histogramCijena
    };
};