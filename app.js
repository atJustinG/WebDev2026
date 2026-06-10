document.getElementById("app").innerHTML = `
    <header>
        <h1> WEB </h1>
    </header>
    
    <main>
        <h2> Login </h2>
        <form id="login-form">
            <input type="text" id="username"  placeholder="Username" required />
            <input type="password" id="password"  placeholder="Password" required />
            <button type="submit">Login</button>
            <p id="error" style="color:red;"></p> 
        </form>
    </main>
    
    <footer>Impressum | Datneschutzerklärung </footer>
    `;
