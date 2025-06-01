document.addEventListener("DOMContentLoaded", () => {
    const mojiUpitiLista = document.querySelector("#mojiUpitiLista");

    PoziviAjax.getMojiUpiti((error, data) => {
        if (error) {
            console.error(error);
            mojiUpitiLista.innerHTML = `<li>${error}</li>`;
        } else if (data.length === 0) {
            mojiUpitiLista.innerHTML = "<li>Nemate upita.</li>";
        } else {
            data.forEach((upit) => {
                const li = document.createElement("li");
                li.textContent = `ID nekretnine: ${upit.NekretninaId}, Tekst upita: ${upit.tekst}`;
                mojiUpitiLista.appendChild(li);
            });
        }
    });
});
