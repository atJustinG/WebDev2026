const express = require('express');
const { ObjectId } = require('mongodb');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

module.exports = (db) => {
    const router = express.Router();

    // POST /login
    router.post('/login', async (req, res) => {
        const { username, password } = req.body;
        const user = await db.collection('users').findOne({ username, password });
        if (!user) return res.sendStatus(401);
        res.json({ name: user.name, role: user.role });
    });

    // GET /loc
    router.get('/loc', async (req, res) => {
        const locations = await db.collection('locations').find().toArray();
        res.json(locations);
    });

    // GET /loc/:id
    router.get('/loc/:id', async (req, res) => {
        const loc = await db.collection('locations').findOne({ _id: new ObjectId(req.params.id) });
        if (!loc) return res.sendStatus(404);
        res.json(loc);
    });

    // POST /loc
    router.post('/loc', async (req, res) => {
        const result = await db.collection('locations').insertOne(req.body);
        res.status(201).location(`/loc/${result.insertedId}`).send();
    });

    // PUT /loc/:id
    router.put('/loc/:id', async (req, res) => {
        const { _id, ...update } = req.body;
        await db.collection('locations').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: update }
        );
        res.sendStatus(204);
    });

    // DELETE /loc/:id
    router.delete('/loc/:id', async (req, res) => {
        const loc = await db.collection('locations').findOne({ _id: new ObjectId(req.params.id) });
        if (loc?.imageUrl) {
            const filePath = path.join(__dirname, loc.imageUrl);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await db.collection('locations').deleteOne({ _id: new ObjectId(req.params.id) });
        res.sendStatus(204);
    });

    // POST /loc/:id/image
    router.post('/loc/:id/image', upload.single('image'), async (req, res) => {
        const loc = await db.collection('locations').findOne({ _id: new ObjectId(req.params.id) });
        const existed = !!loc?.imageUrl;
        const imageUrl = `/uploads/${req.file.filename}`;
        await db.collection('locations').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { imageUrl } }
        );
        res.sendStatus(existed ? 200 : 201);
    });

    // DELETE /loc/:id/image
    router.delete('/loc/:id/image', async (req, res) => {
        const loc = await db.collection('locations').findOne({ _id: new ObjectId(req.params.id) });
        if (loc?.imageUrl) {
            const filePath = path.join(__dirname, loc.imageUrl);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            await db.collection('locations').updateOne(
                { _id: new ObjectId(req.params.id) },
                { $unset: { imageUrl: '' } }
            );
        }
        res.sendStatus(204);
    });

    return router;
};
