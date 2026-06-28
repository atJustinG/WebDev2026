async function showDetail(id) {
    const res = await fetch(`/loc/${id}`);
    const loc = await res.json();

    document.getElementById('app').innerHTML = `
        <header>
            <h1>Berlin Infrastructure Reporter</h1>
        </header>

        <main>
            <h2>Standort Details</h2>
            ${loc.imageUrl ? `<img src="${loc.imageUrl}" style="max-width:300px; margin-bottom:1rem;" />` : ''}
            <form id="detail-form">
                <input type="text" id="loc-name" value="${loc.name}" ${currentUser.role !== 'admin' ? 'disabled' : ''} />
                <textarea id="loc-desc" rows="3" ${currentUser.role !== 'admin' ? 'disabled' : ''}>${loc.description || ''}</textarea>
                <input type="text" id="loc-street" value="${loc.street}" ${currentUser.role !== 'admin' ? 'disabled' : ''} />
                <input type="text" id="loc-zip" value="${loc.zip}" ${currentUser.role !== 'admin' ? 'disabled' : ''} />
                <input type="text" id="loc-city" value="${loc.city}" ${currentUser.role !== 'admin' ? 'disabled' : ''} />
                <select id="loc-category" ${currentUser.role !== 'admin' ? 'disabled' : ''}>
                    <option ${loc.category === 'Fehlender Radweg' ? 'selected' : ''}>Fehlender Radweg</option>
                    <option ${loc.category === 'Kein Grünbereich' ? 'selected' : ''}>Kein Grünbereich</option>
                    <option ${loc.category === 'Schlechte ÖPNV-Anbindung' ? 'selected' : ''}>Schlechte ÖPNV-Anbindung</option>
                    <option ${loc.category === 'Sonstiges' ? 'selected' : ''}>Sonstiges</option>
                </select>
                ${currentUser.role === 'admin' ? '<input type="file" id="loc-image" accept="image/*" />' : ''}
                <p class="error" id="detail-error"></p>
                <div style="display:flex; gap:0.5rem; margin-top:1rem;">
                    ${currentUser.role === 'admin' ? `
                        <button type="submit" class="btn-primary">Aktualisieren</button>
                        <button type="button" class="btn-danger" onclick="deleteLocation('${loc._id}')">Löschen</button>
                        <button type="button" class="btn-secondary" onclick="showMain()">Abbrechen</button>
                    ` : `
                        <button type="button" class="btn-secondary" onclick="showMain()">Schließen</button>
                    `}
                </div>
            </form>
        </main>

        <footer>
            <a href="#">Impressum</a> | <a href="#">Datenschutzerklärung</a>
        </footer>
    `;

    if (currentUser.role === 'admin') {
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

            const body = {
                name: document.getElementById('loc-name').value,
                description: document.getElementById('loc-desc').value,
                street, zip, city,
                category: document.getElementById('loc-category').value,
                lat: coords.lat,
                lng: coords.lng
            };

            await fetch(`/loc/${loc._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const imageFile = document.getElementById('loc-image').files[0];
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                await fetch(`/loc/${loc._id}/image`, { method: 'POST', body: formData });
            }

            showMain();
        });
    }
}

async function deleteLocation(id) {
    if (!confirm('Standort wirklich löschen?')) return;
    await fetch(`/loc/${id}`, { method: 'DELETE' });
    showMain();
}
