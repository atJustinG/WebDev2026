const express = require("express");
const router = express.Router();
const Location = require("../models/Location");
const upload = require("../middelware/upload");
const fs = require("fs");
const path = require("path");

router.get("/loc", async (req, res) => {

     console.log("GET /loc aufgerufen");

    try {
        const locations = await Location.find();

        res.status(200).json(locations);

    } catch(err) {
        console.error(err);
        res.status(500).json({message: "Server Error"});
    }
});

router.post("/loc", async (req, res) => {

    try {
        const newLocation = await Location.create(req.body);

        res
            .status(201)
            .location(`/loc/${newLocation._id}`)
            .json(newLocation);

    } catch(err) {
        console.error(err);
        res.status(500).json({message: "Server Error"});
    }
});

router.post("/loc/:id/image", upload.single("image"), async (req, res) => {

    try {
        const location = await Location.findById(req.params.id);

        if (!location) {
            return res.status(404).json({message: "Location nicht gefunden"});
        }
        if (location.imageUrl) {

            const oldImagePath = path.join(__dirname, "..", location.imageUrl.replace("/", ""));
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        location.imageUrl = `/uploads/${req.file.filename}`;

        await location.save();
        const updatedLocation = await Location.findById(location._id);

        res.status(200).json(updatedLocation);

    } catch(err) {
        console.error(err);
        res.status(500).json({message: "Server Error"});
    }
});

router.delete("/loc/:id/image", async (req, res) => {

    try {
        const location = await Location.findById(req.params.id);

        if (!location) {
            return res.status(404).json({message: "Location nicht gefunden"});
        }

        if (location.imageUrl) {
            const imagePath = path.join(__dirname, "..", location.imageUrl.replace("/", ""));

            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        location.imageUrl = "";
        await location.save();
        res.status(204).send();

    } catch(err) {
        console.error(err);
        res.status(500).json({message: "Server Error"});
    }
});

router.get("/loc/:id", async (req, res) => {

    try {
        const location = await Location.findById(req.params.id);

        if (!location) {
            return res.status(404).json({message: "Location nicht gefunden"});

        }
        res.status(200).json(location);

    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Server Error"});
    }
});

router.put("/loc/:id", async (req, res) => {

    try {
        const updatedLocation = await Location.findByIdAndUpdate(req.params.id, req.body,
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!updatedLocation) {

            return res.status(404).json({message: "Location nicht gefunden"});
        }
        res.status(204).send();

    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Server Error"});
    }
});

router.delete("/loc/:id", async (req, res) => {

    try {
        const deletedLocation = await Location.findByIdAndDelete(req.params.id);

        if (!deletedLocation) {
            return res.status(404).json({message:"Location nicht gefunden"});
        }
        res.status(204).send();

    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Server Error"});
    }
});

module.exports = router;