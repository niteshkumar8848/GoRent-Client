const router = require("express").Router();
const Vehicle = require("../models/Vehicle");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

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
    const { search, maxPrice, brand } = req.query;
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

    query.available = true;

    const vehicles = await Vehicle.find(query).lean();
    
    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching vehicles" 
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
    
    res.json({ success: true, data: vehicle });
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
    const { name, brand, pricePerDay } = req.body;

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

    let imageUrl = "";
    
    if (req.file) {
      imageUrl = `/uploads/vehicles/${req.file.filename}`;
    }

    const vehicle = new Vehicle({
      name,
      brand,
      pricePerDay: price,
      image: imageUrl,
      available: true
    });

    const savedVehicle = await vehicle.save();
    
    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: savedVehicle
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
    const { name, brand, pricePerDay, available } = req.body;
    
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
    
    if (available !== undefined) {
      vehicle.available = available === true || available === "true" || available === "on";
    }

    if (req.file) {
      if (vehicle.image) {
        const oldImagePath = path.join(process.cwd(), vehicle.image.replace(/^\//, ""));
        if (fs.existsSync(oldImagePath)) {
          try { fs.unlinkSync(oldImagePath); } catch (e) { console.error(e); }
        }
      }
      vehicle.image = `/uploads/vehicles/${req.file.filename}`;
    }

    const updatedVehicle = await vehicle.save();
    
    res.json({
      success: true,
      message: "Vehicle updated successfully",
      data: updatedVehicle
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
      const imagePath = path.join(process.cwd(), vehicle.image.replace(/^\//, ""));
      if (fs.existsSync(imagePath)) {
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

