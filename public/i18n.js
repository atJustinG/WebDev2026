const translations = {
    en: {
        loginTitle: 'Sign In',
        username: 'Username',
        password: 'Password',
        loginBtn: 'Login',
        loginError: 'Incorrect username or password.',
        welcome: name => `Welcome, ${name}!`,
        addBtn: '+ Add',
        logout: 'Logout',
        loading: 'Loading locations...',
        noLocations: 'No locations yet.',
        locationCount: n => `${n} location${n !== 1 ? 's' : ''}`,
        imprint: 'Imprint',
        privacy: 'Privacy Policy',
        newLocation: 'New Location',
        hintPosLoading: '📍 Position selected — loading address...',
        hintAddrFound: '📍 Address found — please check and complete.',
        hintAddrNotFound: '📍 Position selected — address not found, please enter manually.',
        titlePlaceholder: 'Title',
        descPlaceholder: 'Description',
        streetPlaceholder: 'Street',
        zipPlaceholder: 'ZIP',
        cityPlaceholder: 'City',
        categoryPlaceholder: 'Select category',
        catBikeLane: 'Missing Bike Lane',
        catGreen: 'No Green Space',
        catTransport: 'Poor Public Transport',
        catOther: 'Other',
        addrNotFound: 'Address could not be found.',
        save: 'Save',
        cancel: 'Cancel',
        locationDetails: 'Location Details',
        update: 'Update',
        delete: 'Delete',
        close: 'Close',
        deleteImageBtn: '🗑️ Delete Image',
        confirmDeleteLocation: 'Really delete this location?',
        confirmDeleteImage: 'Really delete this image?',
        confirmYes: 'Yes, delete',
        confirmCancel: 'Cancel',
        editBtn: '✏️ Edit',
    },
    de: {
        loginTitle: 'Anmelden',
        username: 'Benutzername',
        password: 'Passwort',
        loginBtn: 'Login',
        loginError: 'Falscher Benutzername oder Passwort.',
        welcome: name => `Willkommen, ${name}!`,
        addBtn: '+ Hinzufügen',
        logout: 'Logout',
        loading: 'Lade Standorte...',
        noLocations: 'Noch keine Standorte vorhanden.',
        locationCount: n => `${n} Standort${n !== 1 ? 'e' : ''}`,
        imprint: 'Impressum',
        privacy: 'Datenschutzerklärung',
        newLocation: 'Neuer Standort',
        hintPosLoading: '📍 Position gewählt — Adresse wird geladen...',
        hintAddrFound: '📍 Adresse gefunden — bitte prüfen und ergänzen.',
        hintAddrNotFound: '📍 Position gewählt — Adresse nicht gefunden, bitte manuell eingeben.',
        titlePlaceholder: 'Titel',
        descPlaceholder: 'Beschreibung',
        streetPlaceholder: 'Straße',
        zipPlaceholder: 'PLZ',
        cityPlaceholder: 'Stadt',
        categoryPlaceholder: 'Kategorie wählen',
        catBikeLane: 'Fehlender Radweg',
        catGreen: 'Kein Grünbereich',
        catTransport: 'Schlechte ÖPNV-Anbindung',
        catOther: 'Sonstiges',
        addrNotFound: 'Adresse konnte nicht gefunden werden.',
        save: 'Speichern',
        cancel: 'Abbrechen',
        locationDetails: 'Standort Details',
        update: 'Aktualisieren',
        delete: 'Löschen',
        close: 'Schließen',
        deleteImageBtn: '🗑️ Bild löschen',
        confirmDeleteLocation: 'Standort wirklich löschen?',
        confirmDeleteImage: 'Bild wirklich löschen?',
        confirmYes: 'Ja, löschen',
        confirmCancel: 'Abbrechen',
        editBtn: '✏️ Edit',
    }
};

const LANGS = {
    en: { flag: '<img src="https://flagcdn.com/24x18/gb.png" alt="EN" class="lang-flag">', label: 'English' },
    de: { flag: '<img src="https://flagcdn.com/24x18/de.png" alt="DE" class="lang-flag">', label: 'Deutsch' }
};

// Categories are always stored in German in the DB (fixed values from the Add/Edit form),
// so this maps them to i18n keys for display in the currently selected language.
const CAT_KEYS = {
    'Fehlender Radweg': 'catBikeLane',
    'Kein Grünbereich': 'catGreen',
    'Schlechte ÖPNV-Anbindung': 'catTransport',
    'Sonstiges': 'catOther'
};

let currentLang = localStorage.getItem('lang') || 'en';

function t(key, ...args) {
    const val = translations[currentLang][key];
    return typeof val === 'function' ? val(...args) : (val ?? key);
}

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
}

function translateCategory(cat) {
    return CAT_KEYS[cat] ? t(CAT_KEYS[cat]) : cat;
}

function renderLangSwitcher() {
    const options = Object.entries(LANGS).map(([code, { flag, label }]) => {
        const active = code === currentLang;
        return `<button class="lang-option${active ? ' lang-active' : ''}"
                    ${active ? 'disabled' : `onclick="selectLang('${code}')"`}>
                    <span>${flag}</span><span>${label}</span>
                </button>`;
    }).join('');

    return `
        <div class="lang-switcher" id="lang-switcher">
            <button class="lang-btn" onclick="toggleLangDropdown(event)" title="${LANGS[currentLang].label}">
                ${LANGS[currentLang].flag}
            </button>
            <div class="lang-dropdown" id="lang-dropdown">
                ${options}
            </div>
        </div>`;
}

function toggleLangDropdown(e) {
    e.stopPropagation();
    document.getElementById('lang-dropdown').classList.toggle('open');
}

function selectLang(lang) {
    setLang(lang);
    if (currentUser) showMain();
    else showLogin();
}

document.addEventListener('click', () => {
    const dd = document.getElementById('lang-dropdown');
    if (dd) dd.classList.remove('open');
});
