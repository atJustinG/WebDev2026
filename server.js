const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose.connect(process.env.MONGO_URI)
    .then(async() => {
        console.log("MongoDB verbunden");

    })
    .catch((error) => {
        console.error("MongoDB Fehler", error);
    });

const authRoutes = require("./routes/authRoutes");

const Location = require("./models/Location");
console.log("Location Model geladen");

app.use("/", authRoutes);

const locationRoutes = require("./routes/locationRoutes");
app.use("/", locationRoutes);

app.listen(process.env.PORT, () => {
    console.log(`Server läuft auf Port ${process.env.PORT}`);
});