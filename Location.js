const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    street: {
        type: String,
        required: true
    },

    zip: {
        type: String,
        required: true
    },

    city: {
        type: String,
        required: true
    },

    category: {
        type: String,
        required: true
    },

    lat: {
        type: Number,
        required: true
    },

    lng: {
        type: Number,
        required: true
    },

    imageUrl: {
        type: String,
        default: null
    }
});

module.exports = mongoose.model(
    "Location",
    locationSchema
);