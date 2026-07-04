// ============================================================
// login.js — Screen 1: Login
// Rendert das Login-Formular in das #app-Div und schickt die
// Zugangsdaten per POST /login ans Backend.
// ============================================================

function showLogin() {
    // SPA-Prinzip: kein Seitenwechsel, sondern das innerHTML des
    // einzigen Containers (#app) wird komplett ausgetauscht.
    // t(...) kommt aus i18n.js und liefert den Text in der gewählten Sprache.
    document.getElementById('app').innerHTML = `
        <header>
            <h1>Berlin Infrastructure Reporter</h1>
            <div class="header-actions">
                ${renderLangSwitcher()}
            </div>
        </header>

        <main class="login-main">
            <div class="login-box">
                <h2>${t('loginTitle')}</h2>
                <form id="login-form">
                    <input type="text" id="username" placeholder="${t('username')}" required />
                    <input type="password" id="password" placeholder="${t('password')}" required />
                    <button type="submit" class="btn-primary">${t('loginBtn')}</button>
                    <p class="error" id="login-error"></p>
                </form>
            </div>
        </main>

        <footer>
            <a href="#">${t('imprint')}</a> | <a href="#">${t('privacy')}</a>
        </footer>
    `;

    // Listener erst NACH dem Rendern registrieren — vorher existiert das Formular nicht im DOM
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        // verhindert den klassischen Formular-Submit mit Seiten-Reload (SPA-Anforderung!)
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Zugangsdaten ans Backend schicken — die Prüfung passiert dort
        // gegen die Datenbank, nicht hier im Frontend
        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            // 200: Backend liefert {name, role} (ohne Passwort) zurück
            currentUser = await res.json();
            // im sessionStorage sichern, damit ein Reload nicht ausloggt
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            showMain();
        } else {
            // 401: Fehlermeldung anzeigen, Login-Screen bleibt offen (Anforderung)
            document.getElementById('login-error').textContent = t('loginError');
        }
    });
}
