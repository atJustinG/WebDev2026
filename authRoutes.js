const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const User = require("../models/User");

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("ReadyState:", mongoose.connection.readyState);
        const user = await User.findOne({username});

        if(!user){
            return res.status(401).json({message: "User nicht gefunden"});
        }
        if(user.password !== password){
            return res.status(401).json({message: "Wrong password"});
        }
        const safeUser = {
            username: user.username,
            name: user.name,
            role: user.role
        };

        res.status(200).json(safeUser);

    } catch(err){
        console.error("Login Fehler", err);
        res.status(500).json({message: "Server Error", err});
    }
    });


module.exports = router;