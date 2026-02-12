<script>
// Flexibiliteit state
var flexVoor = 0;
var flexNa = 0;
var flexTerugVoor = 0;
var flexTerugNa = 0;

// Stel standaard datums in
(function() {
    var v = new Date();
    document.getElementById("vertrekdatum").value = v.toISOString().split("T")[0];
    var t = new Date();
    t.setDate(t.getDate() + 7);
    document.getElementById("terugdatum").value = t.toISOString().split("T")[0];
    document.getElementById("vertrekdatum").addEventListener("change", updateAlleRanges);
    document.getElementById("terugdatum").addEventListener("change", updateAlleRanges);
})();

function wijzigFlex(richting, delta) {
    var huidige = richting === "voor" ? flexVoor : richting === "na" ? flexNa : richting === "terugVoor" ? flexTerugVoor : flexTerugNa;
    var nieuw = Math.max(0, Math.min(7, huidige + delta));
    if (richting === "voor") flexVoor = nieuw;
    else if (richting === "na") flexNa = nieuw;
    else if (richting === "terugVoor") flexTerugVoor = nieuw;
    else flexTerugNa = nieuw;
    var elId = richting === "voor" ? "flexVoorValue" : richting === "na" ? "flexNaValue" : richting === "terugVoor" ? "flexTerugVoorValue" : "flexTerugNaValue";
    var el = document.getElementById(elId);
    el.textContent = nieuw;
    el.className = "flex-value" + (nieuw === 0 ? " is-zero" : "");
    updateAlleRanges();
}

function updateAlleRanges() {
    updateRange("vertrekdatum", flexVoor, flexNa, "datumRangeLabel");
    updateRange("terugdatum", flexTerugVoor, flexTerugNa, "terugRangeLabel");
}

function updateRange(inputId, voor, na, labelId) {
    var label = document.getElementById(labelId);
    var input = document.getElementById(inputId).value;
    if (!input) { label.textContent = ""; return; }
    if (voor === 0 && na === 0) { label.textContent = ""; return; }
    var basis = new Date(input + "T00:00:00");
    var vroegst = new Date(basis);
    vroegst.setDate(vroegst.getDate() - voor);
    var laatst = new Date(basis);
    laatst.setDate(laatst.getDate() + na);
    label.textContent = "Venster: " + formatDatum(vroegst) + " \u2013 " + formatDatum(laatst);
}

function swapVliegvelden() {
    var van = document.getElementById("vliegveldVan");
    var naar = document.getElementById("vliegveldNaar");
    var vanVal = van.value;
    var naarVal = naar.value;
    if (!naarVal) return;
    var naarOptie = van.querySelector('option[value="' + naarVal + '"]');
    var vanOptie = naar.querySelector('option[value="' + vanVal + '"]');
    if (naarOptie) van.value = naarVal;
    if (vanOptie) naar.value = vanVal;
}

var airlines = [
    { code: "KL", naam: "KLM", kleur: "#00A1DE" },
    { code: "HV", naam: "Transavia", kleur: "#00B140" },
    { code: "U2", naam: "easyJet", kleur: "#FF6600" },
    { code: "FR", naam: "Ryanair", kleur: "#073590" },
    { code: "VY", naam: "Vueling", kleur: "#FFCC00" },
    { code: "OR", naam: "TUI fly", kleur: "#CC0033" },
    { code: "LH", naam: "Lufthansa", kleur: "#05164D" },
    { code: "PC", naam: "Corendon", kleur: "#E31837" }
];

function seededRandom(seed) {
    var s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function() {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function hashString(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
        h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

function genereerVluchten(vanCode, naarCode, datum, reistijdUren) {
    var dateStr = datum.toISOString().split("T")[0];
    var rng = seededRandom(hashString(vanCode + naarCode + dateStr));
    var aantalVluchten = 3 + Math.floor(rng() * 4);
    var vluchten = [];
    var basisPrijs = Math.round(reistijdUren * 35 + 30);
    var beschikbareAirlines = airlines.slice().sort(function() { return rng() - 0.5; }).slice(0, Math.min(aantalVluchten, 5));
    var starturen = [6, 7, 8, 10, 12, 14, 16, 18, 20].sort(function() { return rng() - 0.5; }).slice(0, aantalVluchten).sort(function(a,b) { return a - b; });
    for (var i = 0; i < aantalVluchten; i++) {
        var airline = beschikbareAirlines[i % beschikbareAirlines.length];
        var vertrekUur = starturen[i];
        var vertrekMin = Math.floor(rng() * 4) * 15;
        var isDirect = rng() > 0.25;
        var extraTijd = isDirect ? 0 : (0.75 + rng() * 1.5);
        var totaalUren = reistijdUren + extraTijd;
        var aankomstMin = vertrekUur * 60 + vertrekMin + Math.round(totaalUren * 60);
        var prijsFactor = 1;
        if (["FR", "U2", "HV"].indexOf(airline.code) >= 0) prijsFactor = 0.6 + rng() * 0.3;
        else if (["KL", "LH"].indexOf(airline.code) >= 0) prijsFactor = 1.0 + rng() * 0.5;
        else prijsFactor = 0.7 + rng() * 0.4;
        if (vertrekUur < 8) prijsFactor *= 0.85;
        if (vertrekUur >= 18) prijsFactor *= 0.9;
        var prijs = Math.round(basisPrijs * prijsFactor + rng() * 30);
        vluchten.push({ airline: airline, vertrekUur: vertrekUur, vertrekMin: vertrekMin, aankomstUur: Math.floor(aankomstMin / 60) % 24, aankomstMin: aankomstMin % 60, duurMin: Math.round(totaalUren * 60), direct: isDirect, prijs: prijs, vanCode: vanCode, naarCode: naarCode });
    }
    return vluchten.sort(function(a, b) { return a.prijs - b.prijs; });
}

function formatTijd(uur, min) {
    return String(uur).padStart(2, "0") + ":" + String(min).padStart(2, "0");
}

function formatDuur(min) {
    var u = Math.floor(min / 60);
    var m = min % 60;
    return u + "u" + (m > 0 ? String(m).padStart(2, "0") : "");
}

var huidigeVertrekDatum = null;
var huidigeRetourDatum = null;
var geselecteerdeBestemming = null;

function selectBestemming(bestemming, rowEl) {
    geselecteerdeBestemming = bestemming;
    var rows = document.querySelectorAll(".result-row");
    for (var i = 0; i < rows.length; i++) rows[i].classList.remove("selected");
    rowEl.classList.add("selected");
    var nabij = [];
    for (var j = 0; j < luchthavens.length; j++) {
        var lh = luchthavens[j];
        var afst = haversineKm(bestemming.lat, bestemming.lng, lh.lat, lh.lng);
        if (afst <= 200) nabij.push({ code: lh.code, naam: lh.naam, lat: lh.lat, lng: lh.lng, afstand: afst });
    }
    nabij.sort(function(a, b) { return a.afstand - b.afstand; });
    var naar = document.getElementById("vliegveldNaar");
    naar.innerHTML = "";
    if (nabij.length === 0) {
        naar.innerHTML = '<option value="">Geen luchthavens binnen 200 km</option>';
        naar.disabled = true;
        document.getElementById("btnVluchten").disabled = true;
        document.getElementById("naarHint").textContent = "";
        return;
    }
    for (var k = 0; k < nabij.length; k++) {
        var opt = document.createElement("option");
        opt.value = nabij[k].code;
        opt.textContent = nabij[k].naam + " (" + nabij[k].code + ") \u2014 " + Math.round(nabij[k].afstand) + " km";
        naar.appendChild(opt);
    }
    naar.value = nabij[0].code;
    naar.disabled = false;
    document.getElementById("naarHint").textContent = "\u2014 " + bestemming.vlag + " " + bestemming.naam;
    document.getElementById("btnVluchten").disabled = false;
    document.getElementById("flightsPanel").classList.remove("active");
}

function zoekVluchten() {
    if (!geselecteerdeBestemming) return;
    var bestemming = geselecteerdeBestemming;
    var vanCode = document.getElementById("vliegveldVan").value;
    var naarCode = document.getElementById("vliegveldNaar").value;
    if (!naarCode) return;
    var panel = document.getElementById("flightsPanel");
    panel.classList.add("active");
    setTimeout(function() { panel.scrollIntoView({ behavior: "smooth", block: "start" }); }, 100);
    document.getElementById("flightsDestBar").innerHTML =
        '<div class="dest-title">' + bestemming.vlag + " " + bestemming.naam + '</div>' +
        '<div class="dest-sub">' + vanCode + " \u2192 " + naarCode + " &bull; " + bestemming.reistijd + "u vlucht</div>';
    var vertrekBasis = new Date(document.getElementById("vertrekdatum").value + "T00:00:00");
    var terugBasis = new Date(document.getElementById("terugdatum").value + "T00:00:00");
    var vertrekVroegst = new Date(vertrekBasis); vertrekVroegst.setDate(vertrekVroegst.getDate() - flexVoor);
    var vertrekLaatst = new Date(vertrekBasis); vertrekLaatst.setDate(vertrekLaatst.getDate() + flexNa);
    var terugVroegst = new Date(terugBasis); terugVroegst.setDate(terugVroegst.getDate() - flexTerugVoor);
    var terugLaatst = new Date(terugBasis); terugLaatst.setDate(terugLaatst.getDate() + flexTerugNa);
    huidigeVertrekDatum = bestemming.vertrekDatum || vertrekBasis;
    huidigeRetourDatum = bestemming.terugDatum || terugBasis;
    var strip = document.getElementById("flightsDateStrip");
    strip.innerHTML = "";
    var vertrekDatums = [];
    var cursor = new Date(vertrekVroegst);
    while (cursor <= vertrekLaatst) { vertrekDatums.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 1); }
    for (var di = 0; di < vertrekDatums.length; di++) {
        (function(d) {
            var vluchten = genereerVluchten(vanCode, naarCode, d, bestemming.reistijd);
            var goedkoopst = vluchten[0].prijs;
            var isActief = d.toDateString() === huidigeVertrekDatum.toDateString();
            var tab = document.createElement("div");
            tab.className = "date-tab" + (isActief ? " active" : "");
            tab.innerHTML = '<div class="date-tab-day">' + d.getDate() + " " + maandNamen[d.getMonth()].slice(0, 3) + '</div><div class="date-tab-price">\u20AC' + goedkoopst + '</div>';
            tab.onclick = function() {
                huidigeVertrekDatum = d;
                renderVluchten(bestemming, vanCode, naarCode);
                var tabs = strip.querySelectorAll(".date-tab");
                for (var ti = 0; ti < tabs.length; ti++) tabs[ti].classList.remove("active");
                tab.classList.add("active");
            };
            strip.appendChild(tab);
        })(vertrekDatums[di]);
    }
    renderVluchten(bestemming, vanCode, naarCode);
}

function renderVluchten(bestemming, vanCode, naarCode) {
    var scroll = document.getElementById("flightsScroll");
    scroll.innerHTML = "";
    var heenVluchten = genereerVluchten(vanCode, naarCode, huidigeVertrekDatum, bestemming.reistijd);
    scroll.innerHTML += '<div class="flight-direction">Heenvlucht \u2014 ' + formatDatumKort(huidigeVertrekDatum) + '</div>';
    for (var i = 0; i < heenVluchten.length; i++) scroll.innerHTML += renderFlightCard(heenVluchten[i]);
    var retourVluchten = genereerVluchten(naarCode, vanCode, huidigeRetourDatum, bestemming.reistijd);
    scroll.innerHTML += '<div class="flight-direction" style="margin-top:0.5rem">Retourvlucht \u2014 ' + formatDatumKort(huidigeRetourDatum) + '</div>';
    for (var j = 0; j < retourVluchten.length; j++) scroll.innerHTML += renderFlightCard(retourVluchten[j]);
    var vDatum = huidigeVertrekDatum.toISOString().split("T")[0].replace(/-/g, "").slice(2);
    var tDatum = huidigeRetourDatum.toISOString().split("T")[0].replace(/-/g, "").slice(2);
    var skyUrl = "https://www.skyscanner.nl/transport/vluchten/" + vanCode.toLowerCase() + "/" + naarCode.toLowerCase() + "/" + vDatum + "/" + tDatum + "/";
    document.getElementById("flightsFooter").innerHTML = '<a class="btn-boek" href="' + skyUrl + '" target="_blank" rel="noopener">Bekijk op Skyscanner &#8599;</a>';
}

function renderFlightCard(v) {
    return '<div class="flight-card">' +
        '<div class="flight-airline"><div class="flight-airline-name" style="color:' + v.airline.kleur + '">' + v.airline.naam + '</div><div class="flight-airline-code">' + v.airline.code + ' ' + (hashString(v.vanCode+v.naarCode+v.airline.code) % 9000 + 1000) + '</div></div>' +
        '<div class="flight-times"><div class="flight-time">' + formatTijd(v.vertrekUur, v.vertrekMin) + '</div>' +
        '<div class="flight-route-line"><div class="flight-duration">' + formatDuur(v.duurMin) + '</div><div class="flight-line"></div><div class="flight-stops ' + (v.direct ? '' : 'has-stop') + '">' + (v.direct ? 'Direct' : '1 stop') + '</div></div>' +
        '<div class="flight-time">' + formatTijd(v.aankomstUur, v.aankomstMin) + '</div></div>' +
        '<div class="flight-price"><div class="flight-price-val">\u20AC' + v.prijs + '</div><div class="flight-price-pp">p.p.</div></div></div>';
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("vliegveldNaar").addEventListener("change", function() {
        document.getElementById("flightsPanel").classList.remove("active");
    });
});

var bestemmingen = [
    { naam: "Barcelona", land: "Spanje", vlag: "\uD83C\uDDEA\uD83C\uDDF8", reistijd: 2.5, lat: 41.39, lng: 2.17, temp: [10,11,13,15,19,23,26,26,23,18,14,11] },
    { naam: "Mallorca", land: "Spanje", vlag: "\uD83C\uDDEA\uD83C\uDDF8", reistijd: 2.5, lat: 39.57, lng: 2.65, temp: [12,12,14,16,20,25,28,28,25,21,16,13] },
    { naam: "M\u00e1laga", land: "Spanje", vlag: "\uD83C\uDDEA\uD83C\uDDF8", reistijd: 3, lat: 36.72, lng: -4.42, temp: [12,13,15,17,20,24,27,28,25,20,16,13] },
    { naam: "Tenerife", land: "Canarische Eilanden", vlag: "\uD83C\uDDEA\uD83C\uDDF8", reistijd: 4.5, lat: 28.29, lng: -16.63, temp: [18,18,19,20,21,24,26,27,26,24,21,19] },
    { naam: "Lanzarote", land: "Canarische Eilanden", vlag: "\uD83C\uDDEA\uD83C\uDDF8", reistijd: 4.5, lat: 28.95, lng: -13.60, temp: [17,18,19,20,21,23,25,26,26,23,20,18] },
    { naam: "Ibiza", land: "Spanje", vlag: "\uD83C\uDDEA\uD83C\uDDF8", reistijd: 2.5, lat: 38.91, lng: 1.43, temp: [12,12,13,16,19,23,27,27,24,20,16,13] },
    { naam: "Rome", land: "Itali\u00eb", vlag: "\uD83C\uDDEE\uD83C\uDDF9", reistijd: 2.5, lat: 41.90, lng: 12.50, temp: [8,9,12,15,19,24,27,27,23,18,13,9] },
    { naam: "Sicili\u00eb", land: "Itali\u00eb", vlag: "\uD83C\uDDEE\uD83C\uDDF9", reistijd: 3, lat: 37.50, lng: 15.09, temp: [11,11,13,16,20,24,27,28,25,21,16,12] },
    { naam: "Sardini\u00eb", land: "Itali\u00eb", vlag: "\uD83C\uDDEE\uD83C\uDDF9", reistijd: 2.5, lat: 39.22, lng: 9.12, temp: [10,10,13,15,19,23,27,27,24,19,15,11] },
    { naam: "Napels", land: "Itali\u00eb", vlag: "\uD83C\uDDEE\uD83C\uDDF9", reistijd: 2.5, lat: 40.85, lng: 14.27, temp: [9,10,12,15,20,24,27,27,24,19,14,10] },
    { naam: "Milaan", land: "Itali\u00eb", vlag: "\uD83C\uDDEE\uD83C\uDDF9", reistijd: 1.5, lat: 45.46, lng: 9.19, temp: [3,6,11,15,20,24,26,26,21,15,9,4] },
    { naam: "Nice", land: "Frankrijk", vlag: "\uD83C\uDDEB\uD83C\uDDF7", reistijd: 2, lat: 43.71, lng: 7.26, temp: [9,10,12,14,18,22,25,25,22,17,13,10] },
    { naam: "Corsica", land: "Frankrijk", vlag: "\uD83C\uDDEB\uD83C\uDDF7", reistijd: 2.5, lat: 41.93, lng: 8.74, temp: [9,9,11,14,18,22,25,26,22,18,13,10] },
    { naam: "Athene", land: "Griekenland", vlag: "\uD83C\uDDEC\uD83C\uDDF7", reistijd: 3.5, lat: 37.98, lng: 23.73, temp: [10,10,13,17,22,27,30,30,26,20,15,11] },
    { naam: "Kreta", land: "Griekenland", vlag: "\uD83C\uDDEC\uD83C\uDDF7", reistijd: 4, lat: 35.34, lng: 25.13, temp: [12,12,14,17,21,25,28,28,24,20,17,13] },
    { naam: "Rhodos", land: "Griekenland", vlag: "\uD83C\uDDEC\uD83C\uDDF7", reistijd: 4, lat: 36.43, lng: 28.22, temp: [12,12,14,17,21,26,28,28,26,21,17,13] },
    { naam: "Corfu", land: "Griekenland", vlag: "\uD83C\uDDEC\uD83C\uDDF7", reistijd: 3, lat: 39.62, lng: 19.92, temp: [10,11,13,16,21,25,28,28,24,19,15,11] },
    { naam: "Santorini", land: "Griekenland", vlag: "\uD83C\uDDEC\uD83C\uDDF7", reistijd: 4, lat: 36.39, lng: 25.46, temp: [12,12,13,16,20,25,27,27,24,20,16,13] },
    { naam: "Lissabon", land: "Portugal", vlag: "\uD83C\uDDF5\uD83C\uDDF9", reistijd: 3, lat: 38.72, lng: -9.14, temp: [12,13,15,17,19,22,25,25,23,19,15,12] },
    { naam: "Algarve", land: "Portugal", vlag: "\uD83C\uDDF5\uD83C\uDDF9", reistijd: 3, lat: 37.02, lng: -7.93, temp: [12,13,15,17,20,23,26,26,24,20,16,13] },
    { naam: "Madeira", land: "Portugal", vlag: "\uD83C\uDDF5\uD83C\uDDF9", reistijd: 4, lat: 32.65, lng: -16.91, temp: [16,16,17,17,19,21,23,24,24,21,19,17] },
    { naam: "Dubrovnik", land: "Kroati\u00eb", vlag: "\uD83C\uDDED\uD83C\uDDF7", reistijd: 2.5, lat: 42.65, lng: 18.09, temp: [9,10,12,15,20,24,27,27,23,18,14,10] },
    { naam: "Split", land: "Kroati\u00eb", vlag: "\uD83C\uDDED\uD83C\uDDF7", reistijd: 2, lat: 43.51, lng: 16.44, temp: [8,9,12,15,20,24,27,27,23,18,13,9] },
    { naam: "Antalya", land: "Turkije", vlag: "\uD83C\uDDF9\uD83C\uDDF7", reistijd: 4, lat: 36.90, lng: 30.69, temp: [10,11,14,17,22,27,30,30,27,21,16,12] },
    { naam: "Bodrum", land: "Turkije", vlag: "\uD83C\uDDF9\uD83C\uDDF7", reistijd: 4, lat: 37.04, lng: 27.43, temp: [11,11,14,17,22,27,29,29,26,21,16,12] },
    { naam: "Istanbul", land: "Turkije", vlag: "\uD83C\uDDF9\uD83C\uDDF7", reistijd: 3.5, lat: 41.01, lng: 28.98, temp: [6,6,9,14,19,24,26,26,22,17,12,8] },
    { naam: "Marrakech", land: "Marokko", vlag: "\uD83C\uDDF2\uD83C\uDDE6", reistijd: 4, lat: 31.63, lng: -8.00, temp: [12,14,17,20,23,28,32,32,27,22,17,13] },
    { naam: "Tunis", land: "Tunesi\u00eb", vlag: "\uD83C\uDDF9\uD83C\uDDF3", reistijd: 3, lat: 36.81, lng: 10.18, temp: [11,12,14,17,21,25,28,29,26,21,16,12] },
    { naam: "Malta", land: "Malta", vlag: "\uD83C\uDDF2\uD83C\uDDF9", reistijd: 3, lat: 35.90, lng: 14.51, temp: [13,13,14,17,20,25,28,28,26,22,18,14] },
    { naam: "Cyprus", land: "Cyprus", vlag: "\uD83C\uDDE8\uD83C\uDDFE", reistijd: 4.5, lat: 34.92, lng: 33.62, temp: [12,12,14,18,22,27,30,30,27,23,17,13] },
    { naam: "Parijs", land: "Frankrijk", vlag: "\uD83C\uDDEB\uD83C\uDDF7", reistijd: 1.5, lat: 48.86, lng: 2.35, temp: [5,6,10,13,17,20,23,22,19,14,9,5] },
    { naam: "Berlijn", land: "Duitsland", vlag: "\uD83C\uDDE9\uD83C\uDDEA", reistijd: 1.5, lat: 52.52, lng: 13.40, temp: [1,2,6,10,16,19,22,21,17,11,6,2] },
    { naam: "Wenen", land: "Oostenrijk", vlag: "\uD83C\uDDE6\uD83C\uDDF9", reistijd: 2, lat: 48.21, lng: 16.37, temp: [1,3,8,13,18,21,24,23,18,12,6,2] },
    { naam: "Praag", land: "Tsjechi\u00eb", vlag: "\uD83C\uDDE8\uD83C\uDDFF", reistijd: 1.5, lat: 50.08, lng: 14.44, temp: [0,1,6,11,16,19,22,21,17,11,5,1] },
    { naam: "Budapest", land: "Hongarije", vlag: "\uD83C\uDDED\uD83C\uDDFA", reistijd: 2, lat: 47.50, lng: 19.04, temp: [1,3,8,14,19,22,25,24,19,13,7,2] },
    { naam: "Londen", land: "Verenigd Koninkrijk", vlag: "\uD83C\uDDEC\uD83C\uDDE7", reistijd: 1, lat: 51.51, lng: -0.13, temp: [5,5,8,11,14,18,20,20,17,13,8,5] },
    { naam: "Edinburgh", land: "Schotland", vlag: "\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74\uDB40\uDC7F", reistijd: 1.5, lat: 55.95, lng: -3.19, temp: [4,5,7,9,12,14,16,16,14,10,7,4] },
    { naam: "Kopenhagen", land: "Denemarken", vlag: "\uD83C\uDDE9\uD83C\uDDF0", reistijd: 1.5, lat: 55.68, lng: 12.57, temp: [1,1,4,9,13,17,19,19,15,10,6,2] },
    { naam: "Stockholm", land: "Zweden", vlag: "\uD83C\uDDF8\uD83C\uDDEA", reistijd: 2, lat: 59.33, lng: 18.07, temp: [-1,-1,2,7,13,17,20,19,14,8,4,0] },
    { naam: "Montenegro", land: "Montenegro", vlag: "\uD83C\uDDF2\uD83C\uDDEA", reistijd: 2.5, lat: 42.44, lng: 19.26, temp: [8,9,12,16,20,25,28,28,24,19,13,9] },
    { naam: "Tel Aviv", land: "Isra\u00ebl", vlag: "\uD83C\uDDEE\uD83C\uDDF1", reistijd: 4.5, lat: 32.08, lng: 34.78, temp: [14,14,16,20,23,26,28,29,27,24,19,15] },
    { naam: "Hurghada", land: "Egypte", vlag: "\uD83C\uDDEA\uD83C\uDDEC", reistijd: 5, lat: 27.26, lng: 33.81, temp: [16,17,20,24,28,31,33,33,30,27,22,18] },
    { naam: "Reykjavik", land: "IJsland", vlag: "\uD83C\uDDEE\uD83C\uDDF8", reistijd: 3.5, lat: 64.15, lng: -21.94, temp: [1,1,2,4,7,10,12,11,9,5,3,1] }
];

var luchthavens = [
    { code: "BCN", naam: "Barcelona El Prat", lat: 41.30, lng: 2.08 },
    { code: "PMI", naam: "Palma de Mallorca", lat: 39.55, lng: 2.74 },
    { code: "AGP", naam: "M\u00e1laga Costa del Sol", lat: 36.67, lng: -4.49 },
    { code: "TFS", naam: "Tenerife Sur", lat: 28.04, lng: -16.57 },
    { code: "TFN", naam: "Tenerife Norte", lat: 28.48, lng: -16.34 },
    { code: "ACE", naam: "Lanzarote", lat: 28.95, lng: -13.61 },
    { code: "FUE", naam: "Fuerteventura", lat: 28.45, lng: -13.86 },
    { code: "LPA", naam: "Gran Canaria", lat: 27.93, lng: -15.39 },
    { code: "IBZ", naam: "Ibiza", lat: 38.87, lng: 1.37 },
    { code: "ALC", naam: "Alicante", lat: 38.28, lng: -0.56 },
    { code: "VLC", naam: "Valencia", lat: 39.49, lng: -0.47 },
    { code: "MAD", naam: "Madrid Barajas", lat: 40.47, lng: -3.56 },
    { code: "SVQ", naam: "Sevilla", lat: 37.42, lng: -5.90 },
    { code: "GRX", naam: "Granada", lat: 37.19, lng: -3.78 },
    { code: "FCO", naam: "Rome Fiumicino", lat: 41.80, lng: 12.25 },
    { code: "CIA", naam: "Rome Ciampino", lat: 41.80, lng: 12.59 },
    { code: "CTA", naam: "Catania", lat: 37.47, lng: 15.07 },
    { code: "PMO", naam: "Palermo", lat: 38.18, lng: 13.09 },
    { code: "CAG", naam: "Cagliari", lat: 39.25, lng: 9.06 },
    { code: "OLB", naam: "Olbia", lat: 40.90, lng: 9.52 },
    { code: "NAP", naam: "Napels", lat: 40.88, lng: 14.29 },
    { code: "MXP", naam: "Milaan Malpensa", lat: 45.63, lng: 8.72 },
    { code: "BGY", naam: "Milaan Bergamo", lat: 45.67, lng: 9.70 },
    { code: "PSA", naam: "Pisa", lat: 43.68, lng: 10.39 },
    { code: "BRI", naam: "Bari", lat: 41.14, lng: 16.76 },
    { code: "NCE", naam: "Nice C\u00f4te d\u2019Azur", lat: 43.66, lng: 7.22 },
    { code: "AJA", naam: "Ajaccio", lat: 41.92, lng: 8.80 },
    { code: "BIA", naam: "Bastia", lat: 42.55, lng: 9.48 },
    { code: "CDG", naam: "Parijs Charles de Gaulle", lat: 49.01, lng: 2.55 },
    { code: "ORY", naam: "Parijs Orly", lat: 48.73, lng: 2.37 },
    { code: "MRS", naam: "Marseille", lat: 43.44, lng: 5.22 },
    { code: "TLS", naam: "Toulouse", lat: 43.63, lng: 1.37 },
    { code: "ATH", naam: "Athene", lat: 37.94, lng: 23.94 },
    { code: "HER", naam: "Heraklion", lat: 35.34, lng: 25.18 },
    { code: "CHQ", naam: "Chania", lat: 35.53, lng: 24.15 },
    { code: "RHO", naam: "Rhodos", lat: 36.41, lng: 28.09 },
    { code: "CFU", naam: "Corfu", lat: 39.60, lng: 19.91 },
    { code: "JTR", naam: "Santorini", lat: 36.40, lng: 25.48 },
    { code: "KGS", naam: "Kos", lat: 36.79, lng: 27.09 },
    { code: "ZTH", naam: "Zakynthos", lat: 37.75, lng: 20.88 },
    { code: "LIS", naam: "Lissabon", lat: 38.77, lng: -9.13 },
    { code: "FAO", naam: "Faro", lat: 37.01, lng: -7.97 },
    { code: "FNC", naam: "Madeira Funchal", lat: 32.69, lng: -16.77 },
    { code: "OPO", naam: "Porto", lat: 41.24, lng: -8.68 },
    { code: "DBV", naam: "Dubrovnik", lat: 42.56, lng: 18.27 },
    { code: "SPU", naam: "Split", lat: 43.54, lng: 16.30 },
    { code: "ZAG", naam: "Zagreb", lat: 45.74, lng: 16.07 },
    { code: "PUY", naam: "Pula", lat: 44.89, lng: 13.92 },
    { code: "AYT", naam: "Antalya", lat: 36.90, lng: 30.80 },
    { code: "BJV", naam: "Bodrum Milas", lat: 37.25, lng: 27.67 },
    { code: "DLM", naam: "Dalaman", lat: 36.71, lng: 28.79 },
    { code: "IST", naam: "Istanbul", lat: 41.26, lng: 28.74 },
    { code: "SAW", naam: "Istanbul Sabiha", lat: 40.90, lng: 29.31 },
    { code: "ADB", naam: "Izmir", lat: 38.29, lng: 27.16 },
    { code: "RAK", naam: "Marrakech", lat: 31.61, lng: -8.04 },
    { code: "TUN", naam: "Tunis Carthage", lat: 36.85, lng: 10.23 },
    { code: "MLA", naam: "Malta", lat: 35.86, lng: 14.48 },
    { code: "LCA", naam: "Larnaca", lat: 34.88, lng: 33.62 },
    { code: "PFO", naam: "Paphos", lat: 34.72, lng: 32.48 },
    { code: "TGD", naam: "Podgorica", lat: 42.36, lng: 19.25 },
    { code: "TIV", naam: "Tivat", lat: 42.40, lng: 18.72 },
    { code: "TLV", naam: "Tel Aviv Ben Gurion", lat: 32.01, lng: 34.89 },
    { code: "HRG", naam: "Hurghada", lat: 27.18, lng: 33.80 },
    { code: "KEF", naam: "Reykjavik Keflavik", lat: 63.99, lng: -22.62 },
    { code: "BER", naam: "Berlijn Brandenburg", lat: 52.37, lng: 13.52 },
    { code: "VIE", naam: "Wenen", lat: 48.11, lng: 16.57 },
    { code: "PRG", naam: "Praag", lat: 50.10, lng: 14.26 },
    { code: "BUD", naam: "Budapest", lat: 47.44, lng: 19.26 },
    { code: "LHR", naam: "Londen Heathrow", lat: 51.47, lng: -0.46 },
    { code: "LGW", naam: "Londen Gatwick", lat: 51.15, lng: -0.19 },
    { code: "STN", naam: "Londen Stansted", lat: 51.89, lng: 0.26 },
    { code: "EDI", naam: "Edinburgh", lat: 55.95, lng: -3.37 },
    { code: "CPH", naam: "Kopenhagen", lat: 55.62, lng: 12.66 },
    { code: "ARN", naam: "Stockholm Arlanda", lat: 59.65, lng: 17.94 }
];

function haversineKm(lat1, lng1, lat2, lng2) {
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLng = (lng2 - lng1) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

var maandNamen = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
var dagenInMaand = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function getTempClass(temp) {
    if (temp < 15) return "cold";
    if (temp < 20) return "mild";
    if (temp < 25) return "warm";
    return "hot";
}

function berekenReisdagen(vliegtijd) {
    if (vliegtijd <= 2) return 0;
    if (vliegtijd <= 4) return 1;
    return 2;
}

function berekenGemTemp(bestemming, startDatum, aantalDagen) {
    var eindDatum = new Date(startDatum);
    eindDatum.setDate(eindDatum.getDate() + aantalDagen - 1);
    var startMaand = startDatum.getMonth();
    var eindMaand = eindDatum.getMonth();
    if (startMaand === eindMaand) return bestemming.temp[startMaand];
    var dagenResterendInStartMaand = dagenInMaand[startMaand] - startDatum.getDate() + 1;
    var dagenInEindMaand = eindDatum.getDate();
    var totaalDagen = dagenResterendInStartMaand + dagenInEindMaand;
    var gewogenTemp = (bestemming.temp[startMaand] * dagenResterendInStartMaand + bestemming.temp[eindMaand] * dagenInEindMaand) / totaalDagen;
    return Math.round(gewogenTemp * 10) / 10;
}

function formatDatum(datum) {
    return datum.toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
}

function formatDatumKort(datum) {
    return datum.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

function dagenTussen(d1, d2) {
    return Math.round((d2 - d1) / 86400000) + 1;
}

function zoekBestemmingen() {
    var vertrekInput = document.getElementById("vertrekdatum").value;
    var terugInput = document.getElementById("terugdatum").value;
    var minTemp = parseFloat(document.getElementById("minTemp").value);
    if (!vertrekInput || !terugInput || isNaN(minTemp)) { alert("Vul alsjeblieft alle velden correct in."); return; }
    var basisVertrek = new Date(vertrekInput + "T00:00:00");
    var basisTerug = new Date(terugInput + "T00:00:00");
    if (basisTerug <= basisVertrek) { alert("De terugreisdatum moet na de vertrekdatum liggen."); return; }
    var basisDagen = dagenTussen(basisVertrek, basisTerug);
    var vertrekVroegst = new Date(basisVertrek); vertrekVroegst.setDate(vertrekVroegst.getDate() - flexVoor);
    var vertrekLaatst = new Date(basisVertrek); vertrekLaatst.setDate(vertrekLaatst.getDate() + flexNa);
    var terugVroegst = new Date(basisTerug); terugVroegst.setDate(terugVroegst.getDate() - flexTerugVoor);
    var terugLaatst = new Date(basisTerug); terugLaatst.setDate(terugLaatst.getDate() + flexTerugNa);
    var resultaten = [];
    for (var bi = 0; bi < bestemmingen.length; bi++) {
        var b = bestemmingen[bi];
        var reisdagen = berekenReisdagen(b.reistijd);
        var besteTemp = -Infinity;
        var besteStart = basisVertrek;
        var besteEind = basisTerug;
        var besteAantalDagen = basisDagen;
        var vCursor = new Date(vertrekVroegst);
        while (vCursor <= vertrekLaatst) {
            var tCursor = new Date(terugVroegst);
            while (tCursor <= terugLaatst) {
                if (tCursor > vCursor) {
                    var dagen = dagenTussen(vCursor, tCursor);
                    if (dagen - reisdagen >= 2) {
                        var temp = berekenGemTemp(b, vCursor, dagen);
                        if (temp > besteTemp) { besteTemp = temp; besteStart = new Date(vCursor); besteEind = new Date(tCursor); besteAantalDagen = dagen; }
                    }
                }
                tCursor.setDate(tCursor.getDate() + 1);
            }
            vCursor.setDate(vCursor.getDate() + 1);
        }
        if (besteTemp >= minTemp && besteAantalDagen - reisdagen >= 2) {
            resultaten.push({ naam: b.naam, land: b.land, vlag: b.vlag, reistijd: b.reistijd, lat: b.lat, lng: b.lng, temp: b.temp, gemTemp: besteTemp, reisdagen: reisdagen, nettoDagen: besteAantalDagen - reisdagen, aantalDagen: besteAantalDagen, vertrekDatum: besteStart, terugDatum: besteEind });
        }
    }
    resultaten.sort(function(a, b) { return b.gemTemp - a.gemTemp || b.nettoDagen - a.nettoDagen; });
    var list = document.getElementById("resultsList");
    var header = document.getElementById("resultsHeader");
    var noResults = document.getElementById("noResults");
    var welcomeMsg = document.getElementById("welcomeMsg");
    list.innerHTML = "";
    welcomeMsg.style.display = "none";
    if (resultaten.length === 0) { noResults.style.display = "block"; header.style.display = "none"; return; }
    noResults.style.display = "none";
    header.style.display = "block";
    header.innerHTML = "<span>" + resultaten.length + " bestemming" + (resultaten.length !== 1 ? "en" : "") + " &bull; " + basisDagen + " dagen</span>";
    var heeftFlex = flexVoor > 0 || flexNa > 0 || flexTerugVoor > 0 || flexTerugNa > 0;
    for (var ri = 0; ri < resultaten.length; ri++) {
        (function(b, i) {
            var cls = getTempClass(b.gemTemp);
            var tempDisplay = Number.isInteger(b.gemTemp) ? b.gemTemp : b.gemTemp.toFixed(1);
            var periodeKort = formatDatumKort(b.vertrekDatum) + " \u2013 " + formatDatumKort(b.terugDatum);
            var flexIndicator = "";
            if (heeftFlex) {
                var diffVertrek = Math.round((b.vertrekDatum - basisVertrek) / 86400000);
                var diffTerug = Math.round((b.terugDatum - basisTerug) / 86400000);
                var parts = [];
                if (diffVertrek < 0) parts.push(Math.abs(diffVertrek) + "d\u2190");
                else if (diffVertrek > 0) parts.push(diffVertrek + "d\u2192");
                if (diffTerug < 0) parts.push(Math.abs(diffTerug) + "d\u2190");
                else if (diffTerug > 0) parts.push(diffTerug + "d\u2192");
                if (parts.length) flexIndicator = '<span class="flex-indicator">' + parts.join(" ") + '</span>';
            }
            var row = document.createElement("div");
            row.className = "result-row";
            row.style.animationDelay = (i * 0.04) + "s";
            row.onclick = function() { selectBestemming(b, this); };
            row.innerHTML =
                '<div class="temp-bar bar-' + cls + '"></div>' +
                '<div class="result-info">' +
                    '<div class="result-name">' + b.vlag + ' ' + b.naam + ' <span style="font-weight:400;color:#999;font-size:0.8rem">' + b.land + '</span></div>' +
                    '<div class="result-sub">' + periodeKort + ' &nbsp;(' + b.aantalDagen + ' dgn) ' + flexIndicator + '</div>' +
                '</div>' +
                '<div class="result-stats">' +
                    '<div class="result-stat"><div class="result-stat-val temp-' + cls + '">' + tempDisplay + '\u00B0</div><div class="result-stat-label">temp</div></div>' +
                    '<div class="result-stat"><div class="result-stat-val">' + b.reistijd + 'u</div><div class="result-stat-label">vlucht</div></div>' +
                    '<div class="result-stat result-netto"><div class="result-stat-val">' + b.nettoDagen + 'd</div><div class="result-stat-label">ter plaatse</div></div>' +
                '</div>';
            list.appendChild(row);
        })(resultaten[ri], ri);
    }
}
</script>

</body>
</html>
