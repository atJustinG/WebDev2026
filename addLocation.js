function showAddLocation() {
    document.getElementById('app').innerHTML = `
        <header>
            <h1>Berlin Infrastructure Reporter</h1>
        </header>

        <main>
            <h2>Neuen Standort hinzufügen</h2>
            <form id="add-form">
                <input type="text" id="loc-name" placeholder="Titel" required />
                <textarea id="loc-desc" placeholder="Beschreibung" rows="3"></textarea>
                <input type="text" id="loc-street" placeholder="Straße" required />
                <input type="text" id="loc-zip" placeholder="PLZ" required />
                <input type="text" id="loc-city" placeholder="Stadt" required />
                <select id="loc-category">
                    <option value="">Kategorie wählen</option>
                    <option>Fehlender Radweg</option>
                    <option>Kein Grünbereich</option>
                    <option>Schlechte ÖPNV-Anbindung</option>
                    <option>Sonstiges</option>
                </select>
                <input type="file" id="loc-image" accept="image/*" />
                <p class="error" id="add-error"></p>
                <div style="display:flex; gap:0.5rem; margin-top:1rem;">
                    <button type="submit" class="btn-primary">Speichern</button>
                    <button type="button" class="btn-secondary" onclick="showMain()">Abbrechen</button>
                </div>
            </form>
        </main>

        <footer>
            <a href="#">Impressum</a> | <a href="#">Datenschutzerklärung</a>
        </footer>
    `;

    document.getElementById('add-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const address = `${document.getElementById('loc-street').value}, ${document.getElementById('loc-zip').value} ${document.getElementById('loc-city').value}`;
        const coords = await geocode(address);

        if (!coords) {
            document.getElementById('add-error').textContent = 'Adresse konnte nicht gefunden werden.';
            return;
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
            const locationUrl = res.headers.get('Location');
            const id = locationUrl.split('/').pop();

            const imageFile = document.getElementById('loc-image').files[0];
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                await fetch(`/loc/${id}/image`, { method: 'POST', body: formData });
            }

            showMain();
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
