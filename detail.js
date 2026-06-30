async function showDetailPanel(id) {
    const res = await fetch(`/loc/${id}`);
    const loc = await res.json();
    const isAdmin = currentUser.role === 'admin';

    document.getElementById('left-panel').innerHTML = `
        <div class="panel-header">${t('locationDetails')}</div>
        <div class="panel-form">
            ${loc.imageUrl ? `
                <img src="${loc.imageUrl}" style="width:100%; border-radius:4px; margin-bottom:0.4rem;" />
                ${isAdmin ? `<button type="button" class="btn-danger btn-small" style="margin-bottom:0.8rem;" onclick="deleteImage('${loc._id}', this)">${t('deleteImageBtn')}</button>` : ''}
            ` : ''}
            <form id="detail-form">
                <input type="text" id="loc-name" value="${loc.name}" ${!isAdmin ? 'disabled' : ''} />
                <textarea id="loc-desc" rows="2" ${!isAdmin ? 'disabled' : ''}>${loc.description || ''}</textarea>
                <input type="text" id="loc-street" value="${loc.street}" ${!isAdmin ? 'disabled' : ''} />
                <input type="text" id="loc-zip" value="${loc.zip}" ${!isAdmin ? 'disabled' : ''} />
                <input type="text" id="loc-city" value="${loc.city}" ${!isAdmin ? 'disabled' : ''} />
                <select id="loc-category" ${!isAdmin ? 'disabled' : ''}>
                    <option value="Fehlender Radweg" ${loc.category === 'Fehlender Radweg' ? 'selected' : ''}>${t('catBikeLane')}</option>
                    <option value="Kein Grünbereich" ${loc.category === 'Kein Grünbereich' ? 'selected' : ''}>${t('catGreen')}</option>
                    <option value="Schlechte ÖPNV-Anbindung" ${loc.category === 'Schlechte ÖPNV-Anbindung' ? 'selected' : ''}>${t('catTransport')}</option>
                    <option value="Sonstiges" ${loc.category === 'Sonstiges' ? 'selected' : ''}>${t('catOther')}</option>
                </select>
                ${isAdmin ? '<input type="file" id="loc-image" accept="image/*" />' : ''}
                <p class="error" id="detail-error"></p>
                <div class="form-actions">
                    ${isAdmin ? `
                        <button type="submit" class="btn-primary">${t('update')}</button>
                        <button type="button" class="btn-danger" onclick="deleteLocation('${loc._id}', this)">${t('delete')}</button>
                    ` : ''}
                    <button type="button" class="btn-secondary" onclick="reloadLocations()">
                        ${isAdmin ? t('cancel') : t('close')}
                    </button>
                </div>
            </form>
        </div>
    `;

    if (isAdmin) {
        document.getElementById('detail-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const street = document.getElementById('loc-street').value;
            const zip = document.getElementById('loc-zip').value;
            const city = document.getElementById('loc-city').value;
            const coords = await geocode(`${street}, ${zip} ${city}`);

            if (!coords) {
                document.getElementById('detail-error').textContent = t('addrNotFound');
                return;
            }

            await fetch(`/loc/${loc._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: document.getElementById('loc-name').value,
                    description: document.getElementById('loc-desc').value,
                    street, zip, city,
                    category: document.getElementById('loc-category').value,
                    lat: coords.lat,
                    lng: coords.lng
                })
            });

            const imageFile = document.getElementById('loc-image').files[0];
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                await fetch(`/loc/${loc._id}/image`, { method: 'POST', body: formData });
            }

            await reloadLocations();
        });
    }
}

async function showDetailPopup(id, lat, lng) {
    if (!lat || !lng) { showDetailPanel(id); return; }

    const res = await fetch(`/loc/${id}`);
    const loc = await res.json();
    const isAdmin = currentUser.role === 'admin';

    const formHtml = `
        <div class="panel-header">${t('locationDetails')}</div>
        <div class="panel-form">
            ${loc.imageUrl ? `
                <img src="${loc.imageUrl}" style="width:100%;max-height:150px;object-fit:cover;border-radius:4px;margin-bottom:0.4rem;" />
                ${isAdmin ? `<button type="button" class="btn-danger btn-small" style="margin-bottom:0.8rem;" onclick="deleteImage('${loc._id}', this, ${lat}, ${lng})">${t('deleteImageBtn')}</button>` : ''}
            ` : ''}
            <form id="popup-detail-form">
                <input type="text" id="popup-detail-name" value="${loc.name}" ${!isAdmin ? 'disabled' : ''} />
                <textarea id="popup-detail-desc" rows="2" ${!isAdmin ? 'disabled' : ''}>${loc.description || ''}</textarea>
                <input type="text" id="popup-detail-street" value="${loc.street}" ${!isAdmin ? 'disabled' : ''} />
                <input type="text" id="popup-detail-zip" value="${loc.zip}" ${!isAdmin ? 'disabled' : ''} />
                <input type="text" id="popup-detail-city" value="${loc.city}" ${!isAdmin ? 'disabled' : ''} />
                <select id="popup-detail-category" ${!isAdmin ? 'disabled' : ''}>
                    <option value="Fehlender Radweg" ${loc.category === 'Fehlender Radweg' ? 'selected' : ''}>${t('catBikeLane')}</option>
                    <option value="Kein Grünbereich" ${loc.category === 'Kein Grünbereich' ? 'selected' : ''}>${t('catGreen')}</option>
                    <option value="Schlechte ÖPNV-Anbindung" ${loc.category === 'Schlechte ÖPNV-Anbindung' ? 'selected' : ''}>${t('catTransport')}</option>
                    <option value="Sonstiges" ${loc.category === 'Sonstiges' ? 'selected' : ''}>${t('catOther')}</option>
                </select>
                ${isAdmin ? '<input type="file" id="popup-detail-image" accept="image/*" />' : ''}
                <p class="error" id="popup-detail-error"></p>
                <div class="form-actions">
                    ${isAdmin ? `
                        <button type="submit" class="btn-primary">${t('update')}</button>
                        <button type="button" class="btn-danger" onclick="deleteLocation('${loc._id}', this)">${t('delete')}</button>
                    ` : ''}
                    <button type="button" class="btn-secondary" onclick="map.closePopup()">
                        ${isAdmin ? t('cancel') : t('close')}
                    </button>
                </div>
            </form>
        </div>`;

    L.popup({ maxWidth: 310, className: 'map-form-popup' })
        .setLatLng([lat, lng])
        .setContent(formHtml)
        .openOn(map);

    if (isAdmin) {
        map.once('popupopen', () => {
            const form = document.getElementById('popup-detail-form');
            if (!form) return;
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const street = document.getElementById('popup-detail-street').value;
                const zip = document.getElementById('popup-detail-zip').value;
                const city = document.getElementById('popup-detail-city').value;
                const coords = await geocode(`${street}, ${zip} ${city}`);
                if (!coords) {
                    document.getElementById('popup-detail-error').textContent = t('addrNotFound');
                    return;
                }
                await fetch(`/loc/${loc._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: document.getElementById('popup-detail-name').value,
                        description: document.getElementById('popup-detail-desc').value,
                        street, zip, city,
                        category: document.getElementById('popup-detail-category').value,
                        lat: coords.lat,
                        lng: coords.lng
                    })
                });
                const imageFile = document.getElementById('popup-detail-image').files[0];
                if (imageFile) {
                    const formData = new FormData();
                    formData.append('image', imageFile);
                    await fetch(`/loc/${loc._id}/image`, { method: 'POST', body: formData });
                }
                await reloadLocations();
            });
        });
    }
}

function deleteLocation(id, trigger) {
    showInlineConfirm(trigger, t('confirmDeleteLocation'), async () => {
        await fetch(`/loc/${id}`, { method: 'DELETE' });
        await reloadLocations();
    });
}

function deleteImage(id, trigger, lat, lng) {
    showInlineConfirm(trigger, t('confirmDeleteImage'), async () => {
        await fetch(`/loc/${id}/image`, { method: 'DELETE' });
        if (lat && lng) {
            await showDetailPopup(id, lat, lng);
        } else {
            await showDetailPanel(id);
        }
    });
}
