// ============================================================
// routes.js — REST-API des Backends
// Definiert alle in der Aufgabe geforderten Endpunkte
// (/login und die CRUD-Operationen auf /loc).
// ============================================================

const express = require('express');
const { ObjectId } = require('mongodb'); // wandelt den id-String aus der URL in eine Mongo-ObjectId um
const multer = require('multer');        // Middleware für Datei-Uploads (multipart/form-data)
const path = require('path');
const fs = require('fs');                // Dateisystem-Zugriff, um Bilddateien zu löschen

// Multer-Konfiguration: Bilder landen als Dateien im Ordner uploads/
// (Anforderung: Bilder im Backend speichern, NICHT in der Datenbank —
// in der DB steht nur der Pfad als imageUrl).
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    // Date.now() prefix avoids collisions if two uploads share the same original filename.
    // => Zeitstempel im Dateinamen verhindert, dass zwei gleichnamige Uploads sich überschreiben.
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Export als Funktion: server.js übergibt die fertige DB-Verbindung,
// wir geben den konfigurierten Router zurück.
module.exports = (db) => {
    const router = express.Router();

    // POST /login
    //200 or 401
    // Prüft die Zugangsdaten gegen die users-Collection in der DB.
    router.post('/login', async (req, res) => {
        const { username, password } = req.body;
        // findOne mit beiden Feldern: nur ein Treffer, wenn Nutzername UND Passwort stimmen
        const user = await db.collection('users').findOne({ username, password });
        if (!user) return res.sendStatus(401); // Unauthorized — Frontend zeigt Fehlermeldung
        // Wichtig: nur name und role zurückgeben, das Passwort verlässt nie den Server
        res.json({ name: user.name, role: user.role });
    });

    // GET /loc
    //return 200 + json array
    // Liefert ALLE Standorte — Grundlage für Liste und Karte im Frontend.
    router.get('/loc', async (req, res) => {
        const locations = await db.collection('locations').find().toArray();
        res.json(locations);
    });

    // GET /loc/:id
    //return 200+json obj
    // Liefert EINEN Standort — wird vom Detail-/Edit-Screen benutzt.
    router.get('/loc/:id', async (req, res) => {
        const loc = await db.collection('locations').findOne({ _id: new ObjectId(req.params.id) });
        if (!loc) return res.sendStatus(404);
        res.json(loc);
    });

    // POST /loc
    //201 + Location Header
    // Legt einen neuen Standort an. Antwortet mit 201 (Created) und der URL
    // des neuen Objekts im Location-Header — daraus liest das Frontend die neue id
    // (z. B. für den anschließenden Bild-Upload).
    router.post('/loc', async (req, res) => {
        const result = await db.collection('locations').insertOne(req.body);
        res.status(201).location(`/loc/${result.insertedId}`).send();
    });

    // PUT /loc/:id
    // Aktualisiert einen Standort. 204 = No Content (Erfolg, aber kein Body nötig).
    router.put('/loc/:id', async (req, res) => {
        // Strip _id so the frontend's full location object can't overwrite Mongo's own immutable id.
        // => Destructuring trennt _id vom Rest ab; MongoDB erlaubt kein Ändern der _id,
        //    ein $set mit _id würde einen Fehler werfen.
        const { _id, ...update } = req.body;
        await db.collection('locations').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: update }
        );
        res.sendStatus(204);
    });

    // DELETE /loc/:id
    // Löscht einen Standort UND sein Bild (Anforderung: beim Löschen eines
    // Standorts muss auch das Foto vom Server verschwinden).
    router.delete('/loc/:id', async (req, res) => {
        // Erst den Standort laden, um an den Bildpfad zu kommen
        const loc = await db.collection('locations').findOne({ _id: new ObjectId(req.params.id) });
        if (loc?.imageUrl) {
            const filePath = path.join(__dirname, loc.imageUrl);
            // existsSync-Check: falls die Datei fehlt, soll das Löschen nicht abstürzen
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await db.collection('locations').deleteOne({ _id: new ObjectId(req.params.id) });
        res.sendStatus(204);
    });

    // POST /loc/:id/image
    // Lädt ein Bild hoch oder ersetzt das vorhandene.
    // upload.single('image'): Multer nimmt das Feld "image" aus dem FormData,
    // speichert die Datei in uploads/ und stellt sie als req.file bereit.
    router.post('/loc/:id/image', upload.single('image'), async (req, res) => {
        const loc = await db.collection('locations').findOne({ _id: new ObjectId(req.params.id) });
        const existed = !!loc?.imageUrl; // merken, ob schon ein Bild da war (für den Statuscode)
        // Remove the previous file first so replacing an image never leaves an orphaned upload on disk.
        // => Altes Bild von der Platte löschen, sonst sammeln sich verwaiste Dateien an.
        if (loc?.imageUrl) {
            const oldPath = path.join(__dirname, loc.imageUrl);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        // In der DB wird nur die URL gespeichert, nicht das Bild selbst
        const imageUrl = `/uploads/${req.file.filename}`;
        await db.collection('locations').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { imageUrl } }
        );
        // Laut Aufgabe: 200 wenn ersetzt, 201 wenn neu angelegt
        res.sendStatus(existed ? 200 : 201);
    });

    // DELETE /loc/:id/image
    // Löscht nur das Bild eines Standorts (Datei + imageUrl-Feld), der Standort bleibt.
    router.delete('/loc/:id/image', async (req, res) => {
        const loc = await db.collection('locations').findOne({ _id: new ObjectId(req.params.id) });
        if (loc?.imageUrl) {
            const filePath = path.join(__dirname, loc.imageUrl);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            // $unset entfernt das Feld imageUrl komplett aus dem Dokument
            await db.collection('locations').updateOne(
                { _id: new ObjectId(req.params.id) },
                { $unset: { imageUrl: '' } }
            );
        }
        res.sendStatus(204);
    });

    return router;
};
