function showAddPanel(lat = null, lng = null) {
    const panel = document.getElementById('left-panel');

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
    if (lat && lng) {
        reverseGeocode(lat, lng).then(addr => {
            const hint = document.getElementById('add-hint');
            if (addr) {
                document.getElementById('loc-street').value = addr.street;
                document.getElementById('loc-zip').value = addr.zip;
                document.getElementById('loc-city').value = addr.city;
                // Lock street/ZIP/city to the clicked position — a long street can legitimately
                // span several real ZIPs, so just re-validating "does this ZIP exist for this
                // street somewhere in Berlin" would still accept a swapped-in wrong one.
                document.getElementById('loc-street').disabled = true;
                document.getElementById('loc-zip').disabled = true;
                document.getElementById('loc-city').disabled = true;
                hint.textContent = t('hintAddrFound');
            } else {
                hint.textContent = t('hintAddrNotFound');
            }
        });
    }

    document.getElementById('add-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const street = document.getElementById('loc-street').value;
        const zip = document.getElementById('loc-zip').value;
        const city = document.getElementById('loc-city').value;
        const errorEl = document.getElementById('add-error');
        errorEl.textContent = '';

        const imageFile = document.getElementById('loc-image').files[0];
        if (imageFile && !imageFile.type.startsWith('image/')) {
            errorEl.textContent = t('onlyImages');
            return;
        }

        // Validate street/zip/city against the geocoder. For the map-click flow the fields are
        // locked (see above) so this just confirms the clicked address; for manual entry via the
        // "Add" button, this is the only check that street and ZIP actually belong together.
        const result = await geocode(street, zip, city);
        if (!result) {
            errorEl.textContent = t('addrNotFound');
            return;
        }
        // Nominatim may still answer with a nearby match in another postcode —
        // reject that so street and ZIP are guaranteed to belong together.
        if (result.zip && result.zip !== zip.trim()) {
            errorEl.textContent = t('zipMismatch');
            return;
        }
        const coords = result;

        const body = {
            name: document.getElementById('loc-name').value,
            description: document.getElementById('loc-desc').value,
            street, zip, city,
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
            const id = res.headers.get('Location').split('/').pop();
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                await fetch(`/loc/${id}/image`, { method: 'POST', body: formData });
            }
            await reloadLocations();
        }
    });
}

// Nominatim (OpenStreetMap) geocoding API — free, no API key required.
// Structured search (street/postalcode/city as separate params) instead of free-text q=,
// because free-text often matches the ZIP/city area instead of the street — the pin then
// lands on the wrong spot. addressdetails=1 returns the matched postcode so callers can
// verify the entered ZIP actually belongs to the street.
async function geocode(street, zip, city) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1`
        + `&street=${encodeURIComponent(street)}`
        + `&postalcode=${encodeURIComponent(zip)}`
        + `&city=${encodeURIComponent(city)}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'de' } });
    const data = await res.json();
    if (data.length === 0) return null;
    return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        zip: data[0].address?.postcode || ''
    };
}

async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'de' } });
    const data = await res.json();
    if (!data.address) return null;
    const a = data.address;
    return {
        street: a.house_number ? `${a.road} ${a.house_number}` : (a.road || ''),
        zip: a.postcode || '',
        city: a.city || a.town || a.village || a.suburb || ''
    };
}
