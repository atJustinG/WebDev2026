// ============================================================
// state.js — globaler Zustand der Single Page Application
// Diese Variablen teilen sich alle Screens (login/main/detail),
// da alle Skripte im selben globalen Scope laufen
// (siehe Einbindungsreihenfolge in index.html).
// ============================================================

let currentUser = null; // eingeloggter Nutzer ({name, role}) oder null = ausgeloggt
let map = null;         // die Leaflet-Karteninstanz (existiert nur auf dem Main Screen)
let markers = [];       // alle aktuell gesetzten Karten-Marker, um sie später entfernen zu können

// Replaces the native confirm() dialog with an inline UI element next to the button that triggered it.
// => Statt des Browser-Popups confirm() erscheint eine Ja/Abbrechen-Leiste
//    direkt unter dem Button, der die Aktion ausgelöst hat.
//    onConfirm ist ein Callback und wird nur bei "Ja" ausgeführt.
function showInlineConfirm(trigger, message, onConfirm) {
    // Es soll immer nur eine offene Bestätigung geben — alte zuerst entfernen
    document.querySelectorAll('.inline-confirm').forEach(el => el.remove());

    // closest() sucht den nächsten passenden Eltern-Container des Buttons;
    // Fallback ist der Button selbst
    const anchor = trigger.closest('.item-actions, .form-actions') || trigger;
    const div = document.createElement('div');
    div.className = 'inline-confirm';
    div.innerHTML = `<span>${message}</span>
        <button class="btn-small btn-danger">${t('confirmYes')}</button>
        <button class="btn-small btn-secondary">${t('confirmCancel')}</button>`;

    // direkt hinter dem Container einfügen und ins Sichtfeld scrollen
    anchor.insertAdjacentElement('afterend', div);
    div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Button 0 = "Ja, löschen" → Aktion ausführen; Button 1 = "Abbrechen" → nur schließen
    div.querySelectorAll('button')[0].addEventListener('click', () => { div.remove(); onConfirm(); });
    div.querySelectorAll('button')[1].addEventListener('click', () => div.remove());
}
