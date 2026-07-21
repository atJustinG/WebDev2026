require('dotenv').config();
const express = require('express');
const path = require('path');
const {MongoClient} = require('mongodb');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const MONGO_URI = process.env.MONGO_URI;
const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const PORT = process.env.PORT || 3000;
let db;


// Connects to MongoDB and seeds the fixed user accounts.
async function connectDB() {
    const client = new MongoClient(MONGO_URI, {
        auth: { username: MONGO_USER, password: MONGO_PASSWORD }
    });
    await client.connect();
    db = client.db('webdev2026');
    console.log('MongoDB verbunden');
    await seedUsers();
}

// Inserts the fixed admin/guest accounts if the users collection is still empty.
async function seedUsers() {
    try {
        const col = db.collection('users');
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

connectDB().then(() => {
    app.use('/', require('./routes')(db));
    app.listen(PORT, () => console.log(`Server läuft auf http://localhost:${PORT}`));
}).catch(err => {
    console.log('MongoDB Fehler:', err.message);
});