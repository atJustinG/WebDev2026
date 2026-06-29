function logout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    showLogin();
}

const saved = sessionStorage.getItem('currentUser');
if (saved) {
    currentUser = JSON.parse(saved);
    showMain();
} else {
    showLogin();
}
