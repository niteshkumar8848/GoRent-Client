const router = require("express").Router();
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
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

// Create a new booking
router.post("/", checkDB, auth, async (req, res) => {
  try {
    const { vehicleId, startDate, endDate } = req.body;
    
    if (!vehicleId || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide all required fields (vehicleId, startDate, endDate)" 
      });
    }

    // Validate ObjectId format
    if (!vehicleId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID format"
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ 
        success: false,
        message: "Vehicle not found" 
      });
    }

    if (!vehicle.available) {
      return res.status(400).json({ 
        success: false,
        message: "Vehicle is not available" 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }
    
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (days <= 0) {
      return res.status(400).json({ 
        success: false,
        message: "End date must be after start date" 
      });
    }

    const totalPrice = days * vehicle.pricePerDay;

    const booking = new Booking({
      user: req.user.id,
      vehicle: vehicleId,
      startDate: start,
      endDate: end,
      totalPrice
    });

    const savedBooking = await booking.save();
    
    // Populate details
    await savedBooking.populate("vehicle");
    await savedBooking.populate("user", "name email");
    
    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: savedBooking
    });
  } catch (err) {
    console.error("Create booking error:", err);
    
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(err.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Server error while creating booking" 
    });
  }
});

// Get all bookings for current user
router.get("/", checkDB, auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate("vehicle")
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (err) {
    console.error("Get bookings error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching bookings" 
    });
  }
});

// Get all bookings (Admin only)
router.get("/all", checkDB, auth, admin, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("vehicle")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (err) {
    console.error("Get all bookings error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching bookings" 
    });
  }
});

// Update booking status (Admin only)
router.put("/:id/status", checkDB, auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID format"
      });
    }
    
    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid status" 
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: "Booking not found" 
      });
    }

    booking.status = status;
    await booking.save();
    
    await booking.populate("vehicle");
    await booking.populate("user", "name email");
    
    res.json({
      success: true,
      message: "Booking status updated",
      data: booking
    });
  } catch (err) {
    console.error("Update booking status error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error while updating booking" 
    });
  }
});

// Cancel booking (User can cancel their own booking)
router.put("/:id/cancel", checkDB, auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID format"
      });
    }
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: "Booking not found" 
      });
    }

    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to cancel this booking" 
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({ 
        success: false,
        message: "Cannot cancel completed booking" 
      });
    }

    booking.status = "cancelled";
    await booking.save();
    
    await booking.populate("vehicle");
    await booking.populate("user", "name email");
    
    res.json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking
    });
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error while cancelling booking" 
    });
  }
});

// Delete booking (Admin only)
router.delete("/:id", checkDB, auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID format"
      });
    }
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: "Booking not found" 
      });
    }

    await booking.deleteOne();
    res.json({ 
      success: true,
      message: "Booking deleted successfully" 
    });
  } catch (err) {
    console.error("Delete booking error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error while deleting booking" 
    });
  }
});

module.exports = router;

