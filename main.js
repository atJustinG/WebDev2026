async function showMain() {
    document.getElementById('app').innerHTML = `
        <header>
            <h1>Berlin Infrastructure Reporter</h1>
            <div class="header-actions">
                <span>Willkommen, ${currentUser.name}!</span>
                ${currentUser.role === 'admin' ? '<button class="btn-primary" onclick="showAddLocation()">+ Standort hinzufügen</button>' : ''}
                <button class="btn-secondary" onclick="logout()">Logout</button>
            </div>
        </header>

        <main>
            <div class="main-layout">
                <div class="location-list" id="location-list">
                    <p>Lade Standorte...</p>
                </div>
                <div id="map"></div>
            </div>
        </main>

        <footer>
            <a href="#">Impressum</a> | <a href="#">Datenschutzerklärung</a>
        </footer>
    `;

    initMap();
    await loadLocations();
}

function initMap() {
    map = L.map('map').setView([52.52, 13.405], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
}

async function loadLocations() {
    const res = await fetch('/loc');
    const locations = await res.json();
    renderList(locations);
    renderMarkers(locations);
}

function renderList(locations) {
    const list = document.getElementById('location-list');
    if (locations.length === 0) {
        list.innerHTML = '<p>Noch keine Standorte vorhanden.</p>';
        return;
    }
    list.innerHTML = locations.map(loc => `
        <div class="location-item" onclick="showDetail('${loc._id}')">
            <strong>${loc.name}</strong>
            <p>${loc.street}, ${loc.zip} ${loc.city}</p>
            <p><em>${loc.category}</em></p>
        </div>
    `).join('');
}

function renderMarkers(locations) {
    markers.forEach(m => m.remove());
    markers = [];
    locations.forEach(loc => {
        if (loc.lat && loc.lng) {
            const marker = L.marker([loc.lat, loc.lng])
                .addTo(map)
                .bindPopup(`<strong>${loc.name}</strong><br>${loc.street}`);
            markers.push(marker);
        }
    });
}
