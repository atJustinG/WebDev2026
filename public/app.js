// Clears the session and returns to the login screen.
function logout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    if (refreshInterval) { clearInterval(refreshInterval); refreshInterval = null; }
    showLogin();
}

const saved = sessionStorage.getItem('currentUser');
if (saved) {
    currentUser = JSON.parse(saved);
    showMain();
} else {
    showLogin();
}