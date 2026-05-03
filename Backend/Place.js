const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema({
    name: String,
    desc: String,
    address: String,
    lat: Number,
    lon: Number,
    image: String // base64 allowed
});

module.exports = mongoose.model("Place", placeSchema);