function showLogin() {
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

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            currentUser = await res.json();
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            showMain();
        } else {
            document.getElementById('login-error').textContent = t('loginError');
        }
    });
}
