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
            const errorEl = document.getElementById('detail-error');
            errorEl.textContent = '';

            const imageFile = document.getElementById('loc-image').files[0];
            if (imageFile && !imageFile.type.startsWith('image/')) {
                errorEl.textContent = t('onlyImages');
                return;
            }

            // Re-geocode on every update (not just when the address changed) to keep this simple —
            // it's what makes "coordinates update automatically" work per the spec.
            const coords = await geocode(street, zip, city);

            if (!coords) {
                errorEl.textContent = t('addrNotFound');
                return;
            }
            // The entered ZIP must really contain the street, otherwise the pin
            // would jump to a wrong place on the map.
            if (coords.zip && coords.zip !== zip.trim()) {
                errorEl.textContent = t('zipMismatch');
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

            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                await fetch(`/loc/${loc._id}/image`, { method: 'POST', body: formData });
            }

            await reloadLocations();
        });
    }
}

function deleteLocation(id, trigger) {
    showInlineConfirm(trigger, t('confirmDeleteLocation'), async () => {
        await fetch(`/loc/${id}`, { method: 'DELETE' });
        await reloadLocations();
    });
}

function deleteImage(id, trigger) {
    showInlineConfirm(trigger, t('confirmDeleteImage'), async () => {
        await fetch(`/loc/${id}/image`, { method: 'DELETE' });
        await showDetailPanel(id);
    });
}
