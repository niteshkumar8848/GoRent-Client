const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
app.set("trust proxy", 1);

/* ==============================
   ENVIRONMENT VARIABLE VALIDATION
================================= */
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not set. Please configure it in environment variables.");
}

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET is not set. Please configure it in environment variables.");
}

/* ==============================
   CORS CONFIGURATION
================================= */
const corsOptions = {
  origin: function (origin, callback) {
    if (NODE_ENV !== "production" || !origin) {
      return callback(null, true);
    }
    
    if (origin.includes(".onrender.com") || origin.includes("render.com")) {
      return callback(null, true);
    }
    
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim());
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

/* ==============================
   BODY PARSER & LIMITS
================================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ==============================
   STATIC FILES
================================= */
app.use("/uploads", express.static("uploads"));
app.use("/api/uploads", express.static("uploads"));

/* ==============================
   DATABASE CONNECTION
================================= */
let isConnected = false;

// Import User model from existing file
const User = require("./models/User");

const connectDB = async (retries = 5, delay = 5000) => {
  if (!MONGO_URI) {
    console.warn("⚠️ MONGO_URI not configured - running without database");
    return false;
  }
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Attempting MongoDB connection (attempt ${attempt}/${retries})...`);
      
      await mongoose.connect(MONGO_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      
      console.log("✅ MongoDB Connected Successfully");
      isConnected = true;
      
      // Try to create admin user
      await createDefaultAdmin();
      
      return true;
    } catch (error) {
      console.error(`❌ MongoDB Connection Failed (attempt ${attempt}): ${error.message}`);
      
      if (attempt < retries) {
        console.log(`⏳ Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error("⚠️ Could not connect to MongoDB after all retries");
  return false;
};

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    const adminEmail = "admin@gorent.com";
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const admin = new User({
        name: "Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin"
      });
      await admin.save();
      console.log("✅ Default admin user created!");
      console.log("   Email: admin@gorent.com");
      console.log("   Password: admin123");
    } else {
      console.log("✅ Admin user already exists");
    }
  } catch (error) {
    console.error("⚠️ Could not create admin user:", error.message);
  }
};

// Handle mongoose connection events
mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB connection established");
  isConnected = true;
});

mongoose.connection.on("error", (err) => {
  console.error(`MongoDB Error: ${err.message}`);
  isConnected = false;
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB Disconnected");
  isConnected = false;
});

/* ==============================
   HEALTH CHECK
================================= */
app.get("/api/health", (req, res) => {
  const healthStatus = {
    status: isConnected ? "ok" : "degraded",
    message: "GoRent API is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: isConnected ? "connected" : "disconnected",
    server: "running"
  };
  
  res.status(200).json(healthStatus);
});

/* ==============================
   ADMIN RESET ENDPOINT (For development only)
================================= */
app.post("/api/admin/reset", async (req, res) => {
  // Only allow in development or with a secret key
  const secretKey = req.body.secretKey;
  const adminSecret = process.env.ADMIN_SECRET || "gorent-admin-reset";
  
  if (NODE_ENV === "production" && secretKey !== adminSecret) {
    return res.status(403).json({ 
      success: false,
      message: "Invalid secret key" 
    });
  }
  
  try {
    const adminEmail = "admin@gorent.com";
    
    // Delete existing admin if any
    await User.deleteOne({ email: adminEmail });
    
    // Create new admin
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin = new User({
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin"
    });
    await admin.save();
    
    console.log("✅ Admin password reset!");
    
    res.json({
      success: true,
      message: "Admin account reset successfully",
      credentials: {
        email: "admin@gorent.com",
        password: "admin123"
      }
    });
  } catch (error) {
    console.error("Admin reset error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset admin"
    });
  }
});

/* ==============================
   ROUTES
================================= */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/vehicles", require("./routes/vehicleRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/feedback", require("./routes/feedbackRoutes"));
app.use("/api/location", require("./routes/locationRoutes"));

/* ==============================
   404 HANDLER
================================= */
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: "Route not found",
    path: req.originalUrl 
  });
});

/* ==============================
   GLOBAL ERROR HANDLER
================================= */
app.use((err, req, res, next) => {
  console.error(`❌ Error: ${err.message}`);
  
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format"
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired"
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

/* ==============================
   GRACEFUL SHUTDOWN
================================= */
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
    
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

/* ==============================
   START SERVER
================================= */
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║          GoRent Server Running Successfully                ║
╠═══════════════════════════════════════════════════════════╣
║  PORT: ${PORT}
║  NODE_ENV: ${NODE_ENV}
║  MongoDB: ${isConnected ? "Connected" : "Connecting..."}
║  API: http://localhost:${PORT}/api
╚═══════════════════════════════════════════════════════════╝
  `);
  
  // Start MongoDB connection in background
  connectDB();
});

module.exports = app;
