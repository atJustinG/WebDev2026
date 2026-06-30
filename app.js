function logout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    showLogin();
}

document.addEventListener('click', (e) => {
    if (map && !e.target.closest('.leaflet-popup') && !e.target.closest('#map')) {
        map.closePopup();
    }
});

const saved = sessionStorage.getItem('currentUser');
if (saved) {
    currentUser = JSON.parse(saved);
    showMain();
} else {
    showLogin();
}
