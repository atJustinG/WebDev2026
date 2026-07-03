function logout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    showLogin();
}

// sessionStorage (not localStorage) so the login survives a page reload but clears once the tab is closed.
const saved = sessionStorage.getItem('currentUser');
if (saved) {
    currentUser = JSON.parse(saved);
    showMain();
} else {
    showLogin();
}
