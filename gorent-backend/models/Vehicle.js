const mongoose = require("mongoose");

const pickupLocationSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  { _id: false }
);

const vehicleSchema = new mongoose.Schema({
  name: String,
  brand: String,
  pricePerDay: Number,
  seats: { type: Number, required: true, default: 4 },
  fuelType: {
    type: String,
    enum: ["", "Petrol", "Diesel", "Electric", "CNG", "Hybrid"],
    default: ""
  },
  fuel_type: {
    type: String,
    enum: ["", "Petrol", "Diesel", "Electric", "CNG", "Hybrid"],
    default: ""
  },
  category: {
    type: String,
    enum: ["", "Hatchback", "Sedan", "SUV", "Jeep", "Van", "Auto"],
    default: ""
  },
  ac: { type: Boolean, default: true },
  luggage_capacity: { type: String, default: "" },
  pickup_locations: { type: [pickupLocationSchema], default: [] },
  image: String,
  imageData: { type: Buffer, default: null },
  imageMimeType: { type: String, default: "" },
  imageEncoding: { type: String, enum: ["", "gzip"], default: "" },
  imageUpdatedAt: { type: Date, default: null },
  available: { type: Boolean, default: true }
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
