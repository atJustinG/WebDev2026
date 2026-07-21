// Renders the main screen (header, list, map, footer) and loads the locations.
async function showMain() {
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

    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(reloadLocations, 5000);
}

// Creates the Leaflet map centered on Berlin and opens the Add form on admin map clicks.
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

// Keeps the Leaflet map correctly sized when the window/viewport is resized.
window.addEventListener('resize', () => {
    if (map) map.invalidateSize();
});

// Fetches all locations and re-renders the map markers. The list is only re-rendered when
// an Add/Edit form is NOT open, unless force is set — used by explicit actions (Cancel,
// Save, Delete) that must close the form, while the periodic background sync leaves it alone.
async function reloadLocations(force = false) {
    const res = await fetch('/loc');
    const locations = await res.json();
    if (force || !document.querySelector('#add-form, #detail-form')) {
        renderListPanel(locations);
    }
    renderMarkers(locations);
}

// Renders the location list in the left panel, with edit/delete controls for admins.
function renderListPanel(locations) {
    const panel = document.getElementById('left-panel');
    if (!panel) return;

    if (locations.length === 0) {
        panel.innerHTML = `<p style="padding:1rem;">${t('noLocations')}</p>`;
        return;
    }

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

// Clears and redraws all map markers for the given locations.
function renderMarkers(locations) {
    markers.forEach(m => m.remove());
    markers = [];
    locations.forEach(loc => {
        if (loc.lat && loc.lng) {
            const marker = L.marker([loc.lat, loc.lng])
                .addTo(map)
                .bindPopup(`<strong>${loc.name}</strong><br>${loc.street}`);
            marker._locId = loc._id;
            marker.on('click', () => showDetailPanel(loc._id));
            markers.push(marker);
        }
    });
}

// Opens the popup of the marker matching the given location id.
function highlightMarker(id) {
    const m = markers.find(m => m._locId === id);
    if (m) m.openPopup();
}

// Closes any open marker popup.
function unhighlightMarker() {
    if (map) map.closePopup();
}
