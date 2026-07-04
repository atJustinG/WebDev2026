// ============================================================
// server.js — Einstiegspunkt des Backends
// Startet den Express-Server, verbindet sich mit MongoDB und
// legt beim ersten Start die beiden festen Nutzer an.
// ============================================================

// Lädt die Variablen aus der .env-Datei in process.env
// (Zugangsdaten gehören nicht in den Code / ins Git-Repo).
require('dotenv').config();
const express = require('express');
const path = require('path');
const {MongoClient} = require('mongodb');
const app = express();

// Middleware: wandelt den JSON-Body eingehender Requests
// automatisch in ein JavaScript-Objekt um (req.body).
app.use(express.json());

// Liefert alle Dateien aus public/ direkt aus (index.html, CSS, Frontend-JS).
// Dadurch "serviert das Backend das Frontend" — eine Anforderung der Aufgabe.
app.use(express.static(path.join(__dirname, 'public')));

// Uploaded images live outside public/ (only reachable through this route),
// so raw source files (server.js, routes.js, .env) are never served statically.
// => Bilder liegen in einem eigenen Ordner uploads/ und werden unter der
//    URL /uploads/<dateiname> erreichbar gemacht.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Konfiguration aus der .env-Datei lesen
const MONGO_URI = process.env.MONGO_URI;
const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const PORT = process.env.PORT || 3000; // Fallback auf 3000, falls nicht gesetzt

// Globale Referenz auf die Datenbank — wird nach dem Verbinden gesetzt
// und an die Routen (routes.js) weitergereicht.
let db;


// Baut die Verbindung zum MongoDB-Server der HTW auf.
// async/await, weil connect() ein Promise zurückgibt (Netzwerkoperation).
async function connectDB() {
    const client = new MongoClient(MONGO_URI, {
        auth: { username: MONGO_USER, password: MONGO_PASSWORD }
    });
    await client.connect();
    db = client.db('webdev2026'); // unsere Datenbank auf dem Server
    console.log('MongoDB verbunden');
    await seedUsers();
}

// Legt die beiden geforderten Nutzer (admin/guest) in der Collection "users" an.
// So stehen die Zugangsdaten in der Datenbank und NICHT hartkodiert im JavaScript
// (explizite Anforderung der Aufgabenstellung).
async function seedUsers() {
    try {
        const col = db.collection('users');
        // Guard so restarting the server doesn't re-insert the fixed accounts every time.
        // => Nur einfügen, wenn die Collection noch leer ist — sonst gäbe es
        //    nach jedem Server-Neustart Duplikate.
        if(await col.countDocuments() === 0){
            await col.insertMany([
                { username: 'admin', password: 'password', name: 'Mina', role: 'admin' },
                { username: 'guest', password: 'password', name: 'Norman', role: 'user' }
            ]);
            console.log('Nutzer angelegt');
        } else {
            console.log('Nutzer bereits vorhanden');
        }
    } catch (err) {
        console.error('seedUsers Fehler:', err.message);
    }
}

// Erst DB verbinden, DANN Routen registrieren und Server starten.
// Reihenfolge ist wichtig: die Routen brauchen die fertige db-Referenz.
connectDB().then(() => {
    // routes.js exportiert eine Funktion, die db entgegennimmt und den Router zurückgibt
    // (Dependency Injection — so muss routes.js keine eigene DB-Verbindung aufbauen).
    app.use('/', require('./routes')(db));
    app.listen(PORT, () => console.log(`Server läuft auf http://localhost:${PORT}`));
}).catch(err => {
    console.log('MongoDB Fehler:', err.message);
});
