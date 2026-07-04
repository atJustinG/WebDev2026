// ============================================================
// addLocation.js — Screen 3: Standort hinzufügen (nur Admin)
// Formular im linken Panel + Geocoding-Funktionen (Adresse ↔ Koordinaten).
// ============================================================

// lat/lng sind optional: kommen sie mit (Klick auf die Karte), wird die
// Adresse per Reverse Geocoding vorausgefüllt; ohne (Add-Button) bleibt alles leer.
function showAddPanel(lat = null, lng = null) {
    const panel = document.getElementById('left-panel');

    // Das Formular ersetzt die Liste im linken Panel — die Karte bleibt sichtbar.
    // required-Attribute → der Browser prüft Pflichtfelder schon vor dem Submit.
    panel.innerHTML = `
        <div class="panel-header">${t('newLocation')}</div>
        <div class="panel-form">
            <p id="add-hint" class="hint">${lat && lng ? t('hintPosLoading') : ''}</p>
            <form id="add-form">
                <input type="text" id="loc-name" placeholder="${t('titlePlaceholder')}" required />
                <textarea id="loc-desc" placeholder="${t('descPlaceholder')}" rows="2"></textarea>
                <input type="text" id="loc-street" placeholder="${t('streetPlaceholder')}" required />
                <input type="text" id="loc-zip" placeholder="${t('zipPlaceholder')}" required />
                <input type="text" id="loc-city" placeholder="${t('cityPlaceholder')}" required />
                <select id="loc-category">
                    <option value="">${t('categoryPlaceholder')}</option>
                    <option value="Fehlender Radweg">${t('catBikeLane')}</option>
                    <option value="Kein Grünbereich">${t('catGreen')}</option>
                    <option value="Schlechte ÖPNV-Anbindung">${t('catTransport')}</option>
                    <option value="Sonstiges">${t('catOther')}</option>
                </select>
                <input type="file" id="loc-image" accept="image/*" />
                <p class="error" id="add-error"></p>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">${t('save')}</button>
                    <button type="button" class="btn-secondary" onclick="reloadLocations()">${t('cancel')}</button>
                </div>
            </form>
        </div>
    `;

    // Only pre-fill via reverse geocoding when opened from a map click (lat/lng given);
    // opening via the "Add" button leaves the address fields empty for manual entry.
    // => Nur beim Karten-Klick: Koordinaten → Adresse auflösen und Felder vorbefüllen.
    if (lat && lng) {
        reverseGeocode(lat, lng).then(addr => {
            const hint = document.getElementById('add-hint');
            if (addr) {
                document.getElementById('loc-street').value = addr.street;
                document.getElementById('loc-zip').value = addr.zip;
                document.getElementById('loc-city').value = addr.city;
                hint.textContent = t('hintAddrFound');
            } else {
                hint.textContent = t('hintAddrNotFound');
            }
        });
    }

    document.getElementById('add-form').addEventListener('submit', async (e) => {
        e.preventDefault(); // kein Seiten-Reload (SPA)

        // Vom Karten-Klick haben wir die Koordinaten schon — sonst müssen
        // sie per Geocoding aus der eingegebenen Adresse ermittelt werden.
        let coords = (lat && lng) ? { lat, lng } : null;

        if (!coords) {
            const address = `${document.getElementById('loc-street').value}, ${document.getElementById('loc-zip').value} ${document.getElementById('loc-city').value}`;
            coords = await geocode(address);
            // Anforderung: Adresse nicht gefunden → Fehlermeldung anzeigen,
            // Formular bleibt offen (return bricht nur den Submit ab)
            if (!coords) {
                document.getElementById('add-error').textContent = t('addrNotFound');
                return;
            }
        }

        // Objekt mit exakt den Feldern, die die locations-Collection laut Aufgabe braucht
        const body = {
            name: document.getElementById('loc-name').value,
            description: document.getElementById('loc-desc').value,
            street: document.getElementById('loc-street').value,
            zip: document.getElementById('loc-zip').value,
            city: document.getElementById('loc-city').value,
            category: document.getElementById('loc-category').value,
            lat: coords.lat,
            lng: coords.lng
        };

        const res = await fetch('/loc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            // The image upload needs the new location's id, which only exists after
            // the location itself was created, hence the separate follow-up request.
            // => Die id des neuen Standorts steckt im Location-Header ("/loc/<id>"),
            //    split('/').pop() nimmt das letzte Stück des Pfads.
            const id = res.headers.get('Location').split('/').pop();
            const imageFile = document.getElementById('loc-image').files[0];
            if (imageFile) {
                // Bilder gehen als FormData (multipart/form-data), nicht als JSON —
                // das Backend verarbeitet sie mit Multer
                const formData = new FormData();
                formData.append('image', imageFile);
                await fetch(`/loc/${id}/image`, { method: 'POST', body: formData });
            }
            // Anforderung: nach dem Speichern zurück zur Hauptansicht
            await reloadLocations();
        }
    });
}

// Nominatim (OpenStreetMap) geocoding API — free, no API key required.
// Geocoding: Adresse (Text) → Koordinaten {lat, lng}.
async function geocode(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'de' } });
    const data = await res.json();
    // Nominatim liefert ein Array möglicher Treffer; leer = Adresse unbekannt
    if (data.length === 0) return null;
    // Wir nehmen den besten (ersten) Treffer; die API liefert Strings, daher parseFloat
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

// Reverse Geocoding: Koordinaten → Adresse. Wird beim Karten-Klick benutzt,
// um das Add-Formular vorzubefüllen.
async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'de' } });
    const data = await res.json();
    if (!data.address) return null;
    const a = data.address;
    // Nominatim benennt Felder je nach Ort unterschiedlich (city/town/village/...),
    // daher die ||-Ketten als Fallbacks
    return {
        street: a.house_number ? `${a.road} ${a.house_number}` : (a.road || ''),
        zip: a.postcode || '',
        city: a.city || a.town || a.village || a.suburb || ''
    };
}
