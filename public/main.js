// ============================================================
// main.js — Screen 2: Hauptansicht
// Liste der Standorte (links) + Leaflet-Karte (rechts).
// Enthält auch alle Funktionen rund um die Karten-Marker.
// ============================================================

async function showMain() {
    // Falls von einem früheren Aufruf noch eine Karte existiert, sauber entfernen —
    // Leaflet wirft sonst einen Fehler ("Map container is already initialized").
    if (map) { map.remove(); map = null; markers = []; }

    document.getElementById('app').innerHTML = `
        <header>
            <h1>Berlin Infrastructure Reporter</h1>
            <div class="header-actions">
                <span>${t('welcome', currentUser.name)}</span>
                ${renderLangSwitcher()}
                <button class="btn-secondary" onclick="logout()">${t('logout')}</button>
            </div>
        </header>

        <main>
            <div class="main-layout">
                <div class="left-column">
                    ${/* Rollenprüfung: nur der Admin bekommt den Hinzufügen-Button gerendert */''}
                    ${currentUser.role === 'admin' ? `<button class="btn-primary" onclick="showAddPanel()">${t('addBtn')}</button>` : ''}
                    <div id="left-panel" class="left-panel">
                        <p style="padding:1rem;">${t('loading')}</p>
                    </div>
                </div>
                <div id="map"></div>
            </div>
        </main>

        <footer>
            <a href="#">${t('imprint')}</a> | <a href="#">${t('privacy')}</a>
        </footer>
    `;

    initMap();
    await reloadLocations();
}

// Initialisiert die Leaflet-Karte im #map-Div.
// Kartendaten: OpenStreetMap-Tiles (kostenlos, kein API-Key nötig).
function initMap() {
    // setView([Breitengrad, Längengrad], Zoomstufe) — Startansicht: Berlin-Zentrum
    map = L.map('map').setView([52.52, 13.405], 12);
    // Tile-Layer = die eigentlichen Kartenbilder; {s}{z}{x}{y} füllt Leaflet selbst aus
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap' // Namensnennung ist Pflicht bei OSM
    }).addTo(map);

    // Admin shortcut: clicking the map opens the Add form pre-filled via reverse geocoding,
    // instead of typing the address manually.
    // => Extra-Feature: Admin klickt auf die Karte → Add-Formular öffnet sich,
    //    die Adresse wird aus den Koordinaten ermittelt (Reverse Geocoding).
    map.on('click', (e) => {
        if (currentUser.role === 'admin') {
            showAddPanel(e.latlng.lat, e.latlng.lng);
        }
    });
}

// Zentrale "Refresh"-Funktion: holt alle Standorte vom Backend und
// zeichnet Liste UND Karte neu. Wird nach jedem Add/Update/Delete aufgerufen —
// so bleibt die Karte in Echtzeit synchron (Anforderung der Aufgabe).
async function reloadLocations() {
    const res = await fetch('/loc');
    const locations = await res.json();
    renderListPanel(locations);
    renderMarkers(locations);
}

// Baut die Standort-Liste im linken Panel auf.
function renderListPanel(locations) {
    const panel = document.getElementById('left-panel');
    if (!panel) return; // Panel existiert nicht (z. B. anderer Screen aktiv) → nichts tun

    if (locations.length === 0) {
        panel.innerHTML = `<p style="padding:1rem;">${t('noLocations')}</p>`;
        return;
    }

    // .map() erzeugt pro Standort einen HTML-Block, .join('') fügt alles zusammen.
    // Anforderung Main Screen: Titel, Straße, PLZ, Kategorie + Foto falls vorhanden.
    panel.innerHTML = `
        <div class="panel-header">${t('locationCount', locations.length)}</div>
        ${locations.map(loc => `
            <div class="location-item"
                 onmouseenter="highlightMarker('${loc._id}')"
                 onmouseleave="unhighlightMarker()">
                <div class="location-item-body">
                    <div class="location-item-text">
                        <div onclick="showDetailPanel('${loc._id}')">
                            <strong>${loc.name}</strong>
                            <p>${loc.street}, ${loc.zip} ${loc.city}</p>
                            <p><em>${translateCategory(loc.category)}</em></p>
                        </div>
                        ${currentUser.role === 'admin' ? `
                            <div class="item-actions">
                                <button class="btn-small btn-primary" onclick="showDetailPanel('${loc._id}')">${t('editBtn')}</button>
                                <button class="btn-small btn-danger" onclick="deleteLocation('${loc._id}', this)">🗑️</button>
                            </div>
                        ` : ''}
                    </div>
                    ${loc.imageUrl ? `<img class="location-thumb" src="${loc.imageUrl}" alt="" />` : ''}
                </div>
            </div>
        `).join('')}
    `;
}

// Setzt für jeden Standort einen Marker auf die Karte.
function renderMarkers(locations) {
    // Alte Marker zuerst entfernen, sonst stapeln sie sich bei jedem Reload
    markers.forEach(m => m.remove());
    markers = [];
    locations.forEach(loc => {
        // Nur Standorte mit gültigen Koordinaten können auf die Karte
        if (loc.lat && loc.lng) {
            const marker = L.marker([loc.lat, loc.lng])
                .addTo(map)
                .bindPopup(`<strong>${loc.name}</strong><br>${loc.street}`);
            // Eigene Eigenschaft am Marker: merkt sich, zu welchem Standort er gehört
            // (nötig für das Hover-Highlighting aus der Liste)
            marker._locId = loc._id;
            marker.on('click', () => showDetailPanel(loc._id));
            markers.push(marker);
        }
    });
}

// Wird bei onmouseenter eines Listeneintrags aufgerufen (Anforderung:
// Hover in der Liste hebt den zugehörigen Marker hervor).
function highlightMarker(id) {
    // Leaflet markers have no built-in "highlight" state, so we reuse the popup to draw attention.
    // => Als "Hervorhebung" öffnen wir das Popup des passenden Markers.
    const m = markers.find(m => m._locId === id);
    if (m) m.openPopup();
}

// Gegenstück bei onmouseleave: Popup wieder schließen.
function unhighlightMarker() {
    if (map) map.closePopup();
}
