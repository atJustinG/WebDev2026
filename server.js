require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const multer = require('multer');
const {MongoClient, ObjectId} = require('mongodb');
const fs = require('fs');

const MONGO_URI = process.env.MONGO_URI;
const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const PORT = process.env.PORT || 3000;
let db;



async function connectDB() {
    const client = new MongoClient(MONGO_URI, {
        auth: { username: MONGO_USER, password: MONGO_PASSWORD },
        authMechanism: 'SCRAM-SHA-1'
    });
    await client.connect();
    db = client.db('webdev2026');
    console.log('MongoDB verbunden');
    await seedUsers();
}

async function seedUsers() {
    const col = db.collection('users');
    if(await col.countDocuments() === 0){
        await col.insertMany([
            { username: 'admin', password: 'password', name: 'Mina', role: 'admin' },
            { username: 'guest', password: 'password', name: 'Norman', role: 'user' }
        ]);
        console.log('Nutzer angelegt');
    }
}

connectDB().then(()=> {
    app.listen(PORT, () => console.log(`Server läuft auf http://localhost:${PORT}`));
    }).catch(err =>{
        console.log('MongoDB Fehler:', err.message);
    });



