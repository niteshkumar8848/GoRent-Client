const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/authMiddleware");
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

// Register a new user
router.post("/register", checkDB, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide all required fields (name, email, password)" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide a valid email" 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Password must be at least 6 characters" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "User already exists with this email" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({ 
      name, 
      email: email.toLowerCase(), 
      password: hashedPassword 
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Registration error:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }
    
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(err.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Server error during registration" 
    });
  }
});

// Login user
router.post("/login", checkDB, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide email and password" 
      });
    }

    console.log("Login attempt for:", email.toLowerCase());

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    console.log("User found:", user.email, "role:", user.role);

    // Check password
    const validPass = await bcrypt.compare(password, user.password);
    console.log("Password valid:", validPass);
    
    if (!validPass) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("Login successful for:", user.email);

    res.json({
      success: true,
      message: "Login successful",
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error during login" 
    });
  }
});

// Get current user profile
router.get("/me", checkDB, auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").lean();
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching profile" 
    });
  }
});

// Update user profile
router.put("/me", checkDB, auth, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // If changing email or password, current password is required
    if (email || newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ 
          success: false,
          message: "Current password is required to update email or password" 
        });
      }

      const validPass = await bcrypt.compare(currentPassword, user.password);
      if (!validPass) {
        return res.status(400).json({ 
          success: false,
          message: "Current password is incorrect" 
        });
      }
    }

    if (name) user.name = name;
    if (email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: user._id }
      });
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          message: "Email already in use" 
        });
      }
      user.email = email.toLowerCase();
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ 
          success: false,
          message: "New password must be at least 6 characters" 
        });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    
    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Update profile error:", err);
    
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(err.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Server error while updating profile" 
    });
  }
});

// Admin: Update own profile
router.put("/admin-profile", checkDB, auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin only." 
      });
    }

    const { name, email, currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "Admin user not found" 
      });
    }

    if (name && name.trim().length < 2) {
      return res.status(400).json({ 
        success: false,
        message: "Name must be at least 2 characters" 
      });
    }

    if (email || newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ 
          success: false,
          message: "Current password is required to update email or password" 
        });
      }

      const validPass = await bcrypt.compare(currentPassword, user.password);
      if (!validPass) {
        return res.status(400).json({ 
          success: false,
          message: "Current password is incorrect" 
        });
      }
    }

    if (name && name.trim() !== user.name) {
      user.name = name.trim();
    }

    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: user._id }
      });
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          message: "Email already in use" 
        });
      }
      user.email = email.toLowerCase();
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ 
          success: false,
          message: "New password must be at least 6 characters" 
        });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    
    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Admin profile update error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error while updating profile" 
    });
  }
});

module.exports = router;

