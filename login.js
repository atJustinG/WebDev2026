function showLogin() {
    document.getElementById('app').innerHTML = `
        <header><h1>Berlin Infrastructure Reporter</h1></header>

        <main class="login-main">
            <div class="login-box">
                <h2>Anmelden</h2>
                <form id="login-form">
                    <input type="text" id="username" placeholder="Benutzername" required />
                    <input type="password" id="password" placeholder="Passwort" required />
                    <button type="submit" class="btn-primary">Login</button>
                    <p class="error" id="login-error"></p>
                </form>
            </div>
        </main>

        <footer>
            <a href="#">Impressum</a> | <a href="#">Datenschutzerklärung</a>
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
            showMain();
        } else {
            document.getElementById('login-error').textContent = 'Falscher Benutzername oder Passwort.';
        }
    });
}
