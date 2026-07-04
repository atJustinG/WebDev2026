// ============================================================
// detail.js — Screen 4: Detail / Edit
// Ein Screen für beide Rollen: der Admin bekommt editierbare Felder
// mit Update/Löschen/Abbrechen, der Gast dieselbe Ansicht schreibgeschützt
// (disabled) mit nur einem Schließen-Button.
// ============================================================

async function showDetailPanel(id) {
    // Aktuelle Daten des Standorts frisch vom Backend holen (GET /loc/:id)
    const res = await fetch(`/loc/${id}`);
    const loc = await res.json();
    const isAdmin = currentUser.role === 'admin';

    // Trick: statt zwei getrennter Ansichten wird EIN Formular gerendert und
    // über ${!isAdmin ? 'disabled' : ''} pro Feld entschieden, ob es editierbar ist.
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

    // Submit-Handler nur für den Admin — der Gast hat gar keinen Update-Button
    if (isAdmin) {
        document.getElementById('detail-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const street = document.getElementById('loc-street').value;
            const zip = document.getElementById('loc-zip').value;
            const city = document.getElementById('loc-city').value;
            // Re-geocode on every update (not just when the address changed) to keep this simple —
            // it's what makes "coordinates update automatically" work per the spec.
            // => Anforderung: ändert der Admin die Adresse, aktualisieren sich die
            //    Koordinaten automatisch. Wir geocoden einfach bei jedem Update.
            const coords = await geocode(`${street}, ${zip} ${city}`);

            if (!coords) {
                document.getElementById('detail-error').textContent = t('addrNotFound');
                return;
            }

            // PUT /loc/:id mit dem kompletten aktualisierten Standort
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

            // Wurde eine neue Bilddatei gewählt, ersetzt POST /loc/:id/image das alte Bild
            const imageFile = document.getElementById('loc-image').files[0];
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                await fetch(`/loc/${loc._id}/image`, { method: 'POST', body: formData });
            }

            // Zurück zur Hauptansicht — Liste und Karte zeigen sofort den neuen Stand
            await reloadLocations();
        });
    }
}

// Standort löschen — mit Inline-Bestätigung statt confirm()-Popup (siehe state.js).
// Wird aus der Liste UND aus dem Detail-Screen aufgerufen.
function deleteLocation(id, trigger) {
    showInlineConfirm(trigger, t('confirmDeleteLocation'), async () => {
        // Das Backend löscht dabei auch die Bilddatei vom Server (Anforderung)
        await fetch(`/loc/${id}`, { method: 'DELETE' });
        await reloadLocations(); // Standort verschwindet aus Liste UND Karte
    });
}

// Nur das Bild eines Standorts löschen, der Standort selbst bleibt bestehen.
function deleteImage(id, trigger) {
    showInlineConfirm(trigger, t('confirmDeleteImage'), async () => {
        await fetch(`/loc/${id}/image`, { method: 'DELETE' });
        // Detail-Ansicht neu laden, damit das Bild sofort verschwindet
        await showDetailPanel(id);
    });
}
