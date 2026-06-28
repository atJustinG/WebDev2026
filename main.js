async function showMain() {
    document.getElementById('app').innerHTML = `
        <header>
            <h1>Berlin Infrastructure Reporter</h1>
            <div class="header-actions">
                <span>Willkommen, ${currentUser.name}!</span>
                ${currentUser.role === 'admin' ? '<button class="btn-primary" onclick="showAddPanel()">+ Hinzufügen</button>' : ''}
                <button class="btn-secondary" onclick="logout()">Logout</button>
            </div>
        </header>

        <main>
            <div class="main-layout">
                <div id="left-panel" class="left-panel">
                    <p style="padding:1rem;">Lade Standorte...</p>
                </div>
                <div id="map"></div>
            </div>
        </main>

        <footer>
            <a href="#">Impressum</a> | <a href="#">Datenschutzerklärung</a>
        </footer>
    `;

    initMap();
    await reloadLocations();
}

function initMap() {
    map = L.map('map').setView([52.52, 13.405], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    map.on('click', (e) => {
        if (currentUser.role === 'admin') {
            showAddPanel(e.latlng.lat, e.latlng.lng);
        }
    });
}

async function reloadLocations() {
    const res = await fetch('/loc');
    const locations = await res.json();
    renderListPanel(locations);
    renderMarkers(locations);
}

function renderListPanel(locations) {
    const panel = document.getElementById('left-panel');
    if (!panel) return;

    if (locations.length === 0) {
        panel.innerHTML = '<p style="padding:1rem;">Noch keine Standorte vorhanden.</p>';
        return;
    }

    panel.innerHTML = `
        <div class="panel-header">${locations.length} Standort${locations.length !== 1 ? 'e' : ''}</div>
        ${locations.map(loc => `
            <div class="location-item"
                 onmouseenter="highlightMarker('${loc._id}')"
                 onmouseleave="unhighlightMarker()">
                <div onclick="showDetailPanel('${loc._id}')">
                    <strong>${loc.name}</strong>
                    <p>${loc.street}, ${loc.zip} ${loc.city}</p>
                    <p><em>${loc.category}</em></p>
                </div>
                ${currentUser.role === 'admin' ? `
                    <div class="item-actions">
                        <button class="btn-small btn-primary" onclick="showDetailPanel('${loc._id}')">✏️ Edit</button>
                        <button class="btn-small btn-danger" onclick="deleteLocation('${loc._id}')">🗑️</button>
                    </div>
                ` : ''}
            </div>
        `).join('')}
    `;
}

function renderMarkers(locations) {
    markers.forEach(m => m.remove());
    markers = [];
    locations.forEach(loc => {
        if (loc.lat && loc.lng) {
            const marker = L.marker([loc.lat, loc.lng])
                .addTo(map)
                .bindPopup(`<strong>${loc.name}</strong><br>${loc.street}`);
            marker._locId = loc._id;
            markers.push(marker);
        }
    });
}

function highlightMarker(id) {
    const m = markers.find(m => m._locId === id);
    if (m) m.openPopup();
}

function unhighlightMarker() {
    if (map) map.closePopup();
}
