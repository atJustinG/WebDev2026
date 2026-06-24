const mongoose = require("mongoose");
require("dotenv").config();

const Location = require("./models/Location");

async function seedLocations() {

    try {

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB verbunden");

        await Location.deleteMany({});

        await Location.create([
            {
                name: "Fehlender Fahrradweg",
                description:
                    "Der Fahrradweg endet plötzlich und zwingt Radfahrer auf die Straße.",
                street: "Karl-Marx-Allee 50",
                zip: "10243",
                city: "Berlin",
                category: "Bike Lane",
                lat: 52.5163,
                lng: 13.4547,
                imageUrl: ""
            },
            {
                name: "Zu wenig Grünfläche",
                description:
                    "In diesem Wohngebiet fehlen Parks und öffentliche Grünflächen.",
                street: "Warschauer Straße 25",
                zip: "10243",
                city: "Berlin",
                category: "Green Space",
                lat: 52.5052,
                lng: 13.4505,
                imageUrl: ""
            },
            {
                name: "Schlechte ÖPNV-Anbindung",
                description:
                    "Der nächste Bahnhof ist weit entfernt und nur schwer erreichbar.",
                street: "Sonnenallee 120",
                zip: "12045",
                city: "Berlin",
                category: "Public Transport",
                lat: 52.4760,
                lng: 13.4448,
                imageUrl: ""
            }
        ]);

        console.log("Locations erfolgreich angelegt");

        await mongoose.disconnect();

        console.log("Verbindung geschlossen");

    } catch (err) {
        console.error(err);
    }
}
seedLocations();