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
        e.preventDefault();

        let coords = (lat && lng) ? { lat, lng } : null;

        if (!coords) {
            const address = `${document.getElementById('loc-street').value}, ${document.getElementById('loc-zip').value} ${document.getElementById('loc-city').value}`;
            coords = await geocode(address);
            if (!coords) {
                document.getElementById('add-error').textContent = t('addrNotFound');
                return;
            }
        }

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
            const id = res.headers.get('Location').split('/').pop();
            const imageFile = document.getElementById('loc-image').files[0];
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                await fetch(`/loc/${id}/image`, { method: 'POST', body: formData });
            }
            await reloadLocations();
        }
    });
}

async function geocode(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'de' } });
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
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
