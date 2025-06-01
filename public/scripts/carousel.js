function postaviCarousel(glavniElement, sviElementi, indeks = 0) {
    if (!glavniElement || !Array.isArray(sviElementi) || sviElementi.length === 0 || indeks < 0 || indeks >= sviElementi.length) {
        return null;
    }

    sviElementi.forEach((el, i) => {
        el.style.display = i === indeks ? "block" : "none";
    });

    return {
        fnLijevo: () => {
            indeks = (indeks - 1 + sviElementi.length) % sviElementi.length;
            sviElementi.forEach((el, i) => {
                el.style.display = i === indeks ? "block" : "none";
            });
        },
        fnDesno: () => {
            indeks = (indeks + 1) % sviElementi.length;
            sviElementi.forEach((el, i) => {
                el.style.display = i === indeks ? "block" : "none";
            });
        }
    };
}
