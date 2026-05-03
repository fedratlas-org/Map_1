const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Place = require("./models/Place");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// MongoDB connect
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected 😏🔥"))
    .catch(err => console.log(err));


// Home
app.get("/", (req, res) => {
    res.send("Backend running");
});


// Get all places
app.get("/places", async (req, res) => {
    try {
        const places = await Place.find();
        res.json(places);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch places" });
    }
});

// Save place
app.post("/places", async (req, res) => {
    try {
        const place = new Place(req.body);
        await place.save();
        res.json({ message: "Saved 😎" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to save place" });
    }
});

// Delete place
app.delete("/places/:id", async (req, res) => {
    await Place.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});


app.listen(process.env.PORT, () => {
    console.log("Server running on port " + process.env.PORT);
});