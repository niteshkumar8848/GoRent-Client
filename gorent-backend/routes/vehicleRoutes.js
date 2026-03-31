const router = require("express").Router();
const Vehicle = require("../models/Vehicle");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const VALID_FUEL_TYPES = ["Petrol", "Diesel", "Electric", "CNG", "Hybrid"];
const VALID_CATEGORIES = ["Hatchback", "Sedan", "SUV", "Jeep", "Van", "Auto"];

const getRequestOrigin = (req) => {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = (typeof forwardedProto === "string" ? forwardedProto.split(",")[0] : req.protocol) || "http";
  const host = req.get("host");
  return `${protocol}://${host}`;
};

const getPublicImageUrl = (req, imagePath) => {
  if (!imagePath) return "";
  const normalized = String(imagePath).trim().replace(/\\/g, "/");
  if (!normalized) return "";
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  const origin = getRequestOrigin(req);

  if (normalized.startsWith("/api/uploads/")) {
    return `${origin}${normalized}`;
  }
  if (normalized.startsWith("/uploads/")) {
    return `${origin}/api${normalized}`;
  }
  if (normalized.startsWith("uploads/")) {
    return `${origin}/api/${normalized}`;
  }
  if (normalized.startsWith("/")) {
    return `${origin}${normalized}`;
  }

  return `${origin}/${normalized}`;
};

const normalizeVehicleForResponse = (req, vehicle) => {
  if (!vehicle) return vehicle;
  const normalizedPickupLocations = Array.isArray(vehicle.pickup_locations)
    ? vehicle.pickup_locations
        .filter((location) => Number.isFinite(Number(location?.lat)) && Number.isFinite(Number(location?.lng)))
        .map((location) => ({
          name: location?.name || "N/A",
          lat: Number(location.lat),
          lng: Number(location.lng)
        }))
    : [];

  return {
    ...vehicle,
    seats: Number.isFinite(vehicle.seats) ? vehicle.seats : null,
    fuelType: vehicle.fuelType || vehicle.fuel_type || "",
    fuel_type: vehicle.fuel_type || vehicle.fuelType || "",
    category: vehicle.category || "",
    ac: typeof vehicle.ac === "boolean" ? vehicle.ac : true,
    luggage_capacity: vehicle.luggage_capacity || "",
    pickup_locations: normalizedPickupLocations,
    image: getPublicImageUrl(req, vehicle.image)
  };
};

const parsePickupLocations = (value) => {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((location) => ({
        name: location?.name || "",
        lat: Number(location?.lat),
        lng: Number(location?.lng)
      }))
      .filter((location) => Number.isFinite(location.lat) && Number.isFinite(location.lng));
  } catch (error) {
    return null;
  }
};

const getLocalImagePathFromStoredValue = (storedImage) => {
  if (!storedImage) return null;
  let imagePath = String(storedImage).trim().replace(/\\/g, "/");
  if (!imagePath) return null;

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    try {
      imagePath = new URL(imagePath).pathname;
    } catch (err) {
      return null;
    }
  }

  if (imagePath.startsWith("/api/uploads/")) {
    imagePath = imagePath.replace(/^\/api/, "");
  }
  if (imagePath.startsWith("/uploads/")) {
    return path.join(process.cwd(), imagePath.replace(/^\//, ""));
  }
  if (imagePath.startsWith("uploads/")) {
    return path.join(process.cwd(), imagePath);
  }
  return null;
};

// Middleware to check if MongoDB is connected
const checkDB = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database is not available. Please try again later."
    });
  }
  next();
};

// Configure multer for local file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/vehicles";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, "vehicle_" + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB."
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// Get all vehicles
router.get("/", checkDB, async (req, res) => {
  try {
    const { search, maxPrice, brand, includeUnavailable } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } }
      ];
    }

    if (maxPrice) {
      const price = parseInt(maxPrice);
      if (!isNaN(price)) {
        query.pricePerDay = { $lte: price };
      }
    }

    if (brand) {
      query.brand = { $regex: brand, $options: "i" };
    }

    if (!(includeUnavailable === "true" || includeUnavailable === true)) {
      query.available = true;
    }

    const vehicles = await Vehicle.find(query).lean();
    const normalizedVehicles = vehicles.map((v) => normalizeVehicleForResponse(req, v));
    
    res.json({
      success: true,
      count: normalizedVehicles.length,
      data: normalizedVehicles
    });
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching vehicles" 
    });
  }
});

// Get vehicle locations with availability
router.get("/locations", checkDB, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({}, "name category pricePerDay available pickup_locations").lean();

    const locationData = vehicles.map((vehicle) => ({
      _id: vehicle._id,
      name: vehicle.name || "N/A",
      category: vehicle.category || "N/A",
      pricePerDay: Number.isFinite(Number(vehicle.pricePerDay)) ? Number(vehicle.pricePerDay) : null,
      available: Boolean(vehicle.available),
      pickup_locations: Array.isArray(vehicle.pickup_locations)
        ? vehicle.pickup_locations
            .filter((location) => Number.isFinite(Number(location?.lat)) && Number.isFinite(Number(location?.lng)))
            .map((location) => ({
              name: location?.name || "N/A",
              lat: Number(location.lat),
              lng: Number(location.lng)
            }))
        : []
    }));

    res.json({
      success: true,
      count: locationData.length,
      data: locationData
    });
  } catch (err) {
    console.error("Error fetching vehicle locations:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching vehicle locations"
    });
  }
});

// Get single vehicle
router.get("/:id", checkDB, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID format"
      });
    }
    
    const vehicle = await Vehicle.findById(id).lean();
    
    if (!vehicle) {
      return res.status(404).json({ 
        success: false,
        message: "Vehicle not found" 
      });
    }
    
    res.json({ success: true, data: normalizeVehicleForResponse(req, vehicle) });
  } catch (err) {
    console.error("Error fetching vehicle:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching vehicle" 
    });
  }
});

// Add Vehicle (Admin Only)
router.post("/", checkDB, auth, admin, upload.single("image"), handleMulterError, async (req, res) => {
  try {
    const {
      name,
      brand,
      pricePerDay,
      seats,
      fuelType,
      fuel_type,
      category,
      ac,
      available,
      luggage_capacity,
      pickup_locations
    } = req.body;

    if (!name || !brand || !pricePerDay) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide all required fields (name, brand, pricePerDay)" 
      });
    }

    const price = parseInt(pricePerDay);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid price value"
      });
    }

    const parsedSeats = parseInt(seats, 10);
    if (isNaN(parsedSeats) || parsedSeats <= 0) {
      return res.status(400).json({
        success: false,
        message: "Seats is required and must be a positive number"
      });
    }

    let imageUrl = "";
    
    if (req.file) {
      imageUrl = `/uploads/vehicles/${req.file.filename}`;
    }

    const resolvedFuelType = fuelType || fuel_type || "";
    if (resolvedFuelType && !VALID_FUEL_TYPES.includes(resolvedFuelType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fuel type value"
      });
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category value"
      });
    }

    const resolvedPickupLocations = parsePickupLocations(pickup_locations);
    if (resolvedPickupLocations === null) {
      return res.status(400).json({
        success: false,
        message: "pickup_locations must be a valid JSON array"
      });
    }

    const vehicle = new Vehicle({
      name,
      brand,
      pricePerDay: price,
      seats: parsedSeats,
      fuelType: resolvedFuelType,
      fuel_type: resolvedFuelType,
      category: category || "",
      ac: ac === "" || ac === undefined ? true : (ac === true || ac === "true" || ac === "on"),
      luggage_capacity: luggage_capacity || "",
      pickup_locations: resolvedPickupLocations,
      image: imageUrl,
      available: available === undefined ? true : (available === true || available === "true" || available === "on")
    });

    const savedVehicle = await vehicle.save();
    
    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: normalizeVehicleForResponse(req, savedVehicle.toObject())
    });
  } catch (err) {
    console.error("Error creating vehicle:", err);
    
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(err.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Server error while creating vehicle" 
    });
  }
});

// Update Vehicle (Admin Only)
router.put("/:id", checkDB, auth, admin, upload.single("image"), handleMulterError, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      brand,
      pricePerDay,
      available,
      seats,
      fuelType,
      fuel_type,
      category,
      ac,
      luggage_capacity,
      pickup_locations
    } = req.body;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID format"
      });
    }
    
    let vehicle = await Vehicle.findById(id);
    
    if (!vehicle) {
      return res.status(404).json({ 
        success: false,
        message: "Vehicle not found" 
      });
    }

    if (name) vehicle.name = name;
    if (brand) vehicle.brand = brand;
    
    if (pricePerDay) {
      const price = parseInt(pricePerDay);
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({ success: false, message: "Invalid price value" });
      }
      vehicle.pricePerDay = price;
    }

    if (!Number.isFinite(Number(vehicle.seats)) || Number(vehicle.seats) <= 0) {
      vehicle.seats = 4;
    }

    if (seats !== undefined) {
      const parsedSeats = parseInt(seats, 10);
      if (isNaN(parsedSeats) || parsedSeats <= 0) {
        return res.status(400).json({ success: false, message: "Invalid seats value" });
      }
      vehicle.seats = parsedSeats;
    }

    if (fuelType !== undefined || fuel_type !== undefined) {
      const resolvedFuelType = fuelType !== undefined ? fuelType : fuel_type;
      if (resolvedFuelType && !VALID_FUEL_TYPES.includes(resolvedFuelType)) {
        return res.status(400).json({ success: false, message: "Invalid fuel type value" });
      }
      vehicle.fuelType = resolvedFuelType;
      vehicle.fuel_type = resolvedFuelType;
    }

    if (category !== undefined) {
      if (category && !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ success: false, message: "Invalid category value" });
      }
      vehicle.category = category;
    }

    if (ac !== undefined) {
      vehicle.ac = ac === "" ? true : (ac === true || ac === "true" || ac === "on");
    }

    if (luggage_capacity !== undefined) {
      vehicle.luggage_capacity = luggage_capacity;
    }

    if (pickup_locations !== undefined) {
      const resolvedPickupLocations = parsePickupLocations(pickup_locations);
      if (resolvedPickupLocations === null) {
        return res.status(400).json({
          success: false,
          message: "pickup_locations must be a valid JSON array"
        });
      }
      vehicle.pickup_locations = resolvedPickupLocations;
    }
    
    if (available !== undefined) {
      vehicle.available = available === true || available === "true" || available === "on";
    }

    if (req.file) {
      if (vehicle.image) {
        const oldImagePath = getLocalImagePathFromStoredValue(vehicle.image);
        if (oldImagePath && fs.existsSync(oldImagePath)) {
          try { fs.unlinkSync(oldImagePath); } catch (e) { console.error(e); }
        }
      }
      vehicle.image = `/uploads/vehicles/${req.file.filename}`;
    }

    const updatedVehicle = await vehicle.save();
    
    res.json({
      success: true,
      message: "Vehicle updated successfully",
      data: normalizeVehicleForResponse(req, updatedVehicle.toObject())
    });
  } catch (err) {
    console.error("Error updating vehicle:", err);
    
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(err.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Server error while updating vehicle" 
    });
  }
});

// Delete Vehicle (Admin Only)
router.delete("/:id", checkDB, auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID format"
      });
    }
    
    const vehicle = await Vehicle.findById(id);
    
    if (!vehicle) {
      return res.status(404).json({ 
        success: false,
        message: "Vehicle not found" 
      });
    }

    if (vehicle.image) {
      const imagePath = getLocalImagePathFromStoredValue(vehicle.image);
      if (imagePath && fs.existsSync(imagePath)) {
        try { fs.unlinkSync(imagePath); } catch (e) { console.error(e); }
      }
    }

    await vehicle.deleteOne();
    
    res.json({ success: true, message: "Vehicle deleted successfully" });
  } catch (err) {
    console.error("Error deleting vehicle:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error while deleting vehicle" 
    });
  }
});

module.exports = router;
