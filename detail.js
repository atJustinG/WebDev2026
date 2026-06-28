async function showDetailPanel(id) {
    const res = await fetch(`/loc/${id}`);
    const loc = await res.json();
    const isAdmin = currentUser.role === 'admin';

    document.getElementById('left-panel').innerHTML = `
        <div class="panel-header">Standort Details</div>
        <div class="panel-form">
            ${loc.imageUrl ? `<img src="${loc.imageUrl}" style="width:100%; border-radius:4px; margin-bottom:0.5rem;" />` : ''}
            <form id="detail-form">
                <input type="text" id="loc-name" value="${loc.name}" ${!isAdmin ? 'disabled' : ''} />
                <textarea id="loc-desc" rows="2" ${!isAdmin ? 'disabled' : ''}>${loc.description || ''}</textarea>
                <input type="text" id="loc-street" value="${loc.street}" ${!isAdmin ? 'disabled' : ''} />
                <input type="text" id="loc-zip" value="${loc.zip}" ${!isAdmin ? 'disabled' : ''} />
                <input type="text" id="loc-city" value="${loc.city}" ${!isAdmin ? 'disabled' : ''} />
                <select id="loc-category" ${!isAdmin ? 'disabled' : ''}>
                    <option ${loc.category === 'Fehlender Radweg' ? 'selected' : ''}>Fehlender Radweg</option>
                    <option ${loc.category === 'Kein Grünbereich' ? 'selected' : ''}>Kein Grünbereich</option>
                    <option ${loc.category === 'Schlechte ÖPNV-Anbindung' ? 'selected' : ''}>Schlechte ÖPNV-Anbindung</option>
                    <option ${loc.category === 'Sonstiges' ? 'selected' : ''}>Sonstiges</option>
                </select>
                ${isAdmin ? '<input type="file" id="loc-image" accept="image/*" />' : ''}
                <p class="error" id="detail-error"></p>
                <div class="form-actions">
                    ${isAdmin ? `
                        <button type="submit" class="btn-primary">Aktualisieren</button>
                        <button type="button" class="btn-danger" onclick="deleteLocation('${loc._id}')">Löschen</button>
                    ` : ''}
                    <button type="button" class="btn-secondary" onclick="reloadLocations()">
                        ${isAdmin ? 'Abbrechen' : 'Schließen'}
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
                document.getElementById('detail-error').textContent = 'Adresse konnte nicht gefunden werden.';
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

async function deleteLocation(id) {
    if (!confirm('Standort wirklich löschen?')) return;
    await fetch(`/loc/${id}`, { method: 'DELETE' });
    await reloadLocations();
}
