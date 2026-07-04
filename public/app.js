// ============================================================
// app.js — Startpunkt des Frontends
// Wird als LETZTES Skript geladen (siehe index.html) und entscheidet,
// welcher Screen beim Seitenaufruf angezeigt wird.
// ============================================================

// Logout: Zustand zurücksetzen und zurück zum Login-Screen.
// Kein Server-Aufruf nötig, da der Login-Status nur im Browser lebt.
function logout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    showLogin();
}

// sessionStorage (not localStorage) so the login survives a page reload but clears once the tab is closed.
// => Beim Laden der Seite prüfen, ob in diesem Tab schon jemand eingeloggt ist:
//    ja  → direkt zum Main Screen (Login überspringen)
//    nein → Login-Screen anzeigen
const saved = sessionStorage.getItem('currentUser');
if (saved) {
    currentUser = JSON.parse(saved); // sessionStorage speichert nur Strings, daher parsen
    showMain();
} else {
    showLogin();
}
