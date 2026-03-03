const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  name: String,
  brand: String,
  pricePerDay: Number,
  image: String,
  available: { type: Boolean, default: true }
});

module.exports = mongoose.model("Vehicle", vehicleSchema);