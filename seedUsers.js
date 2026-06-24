const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

async function seedUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB verbunden");

        await User.deleteMany({});

        await User.create([
            {
                username: "admin",
                password: "password",
                name: "Mina",
                role: "admin"
            },
            {
                username: "guest",
                password: "password",
                name: "Norman",
                role: "user"
            }
        ]);

        console.log("Users erfolgreich angelegt");

        await mongoose.disconnect();

        console.log("Verbindung geschlossen");

    } catch (err) {
        console.error(err);
    }
}

seedUsers();