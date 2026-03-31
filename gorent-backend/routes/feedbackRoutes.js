const router = require("express").Router();
const mongoose = require("mongoose");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const Booking = require("../models/Booking");
const BookingFeedback = require("../models/BookingFeedback");
const User = require("../models/User");

const checkDB = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database is not available. Please try again later."
    });
  }
  next();
};

const isValidObjectId = (value) => String(value || "").match(/^[0-9a-fA-F]{24}$/);

const hasFeedbackHandled = (booking) => Boolean(booking.feedback_submitted || booking.feedbackSubmitted);

const markFeedbackHandled = (booking) => {
  booking.feedback_submitted = true;
  booking.feedbackSubmitted = true;
};

router.post("/", checkDB, auth, async (req, res) => {
  try {
    const bookingId = req.body.booking_id || req.body.ride_id;
    const vehicleIdFromRequest = req.body.vehicle_id;
    const customerIdFromRequest = req.body.customer_id;
    const { rating, comment, tags } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: "booking_id and rating are required"
      });
    }

    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID format" });
    }

    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5"
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized for this booking" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ success: false, message: "Feedback is allowed only for completed bookings" });
    }

    if (hasFeedbackHandled(booking)) {
      return res.status(400).json({ success: false, message: "Feedback already submitted for this booking" });
    }

    if (vehicleIdFromRequest && booking.vehicle.toString() !== String(vehicleIdFromRequest)) {
      return res.status(400).json({ success: false, message: "vehicle_id does not match booking vehicle" });
    }

    if (customerIdFromRequest && booking.user.toString() !== String(customerIdFromRequest)) {
      return res.status(400).json({ success: false, message: "customer_id does not match booking customer" });
    }

    const customer = await User.findById(booking.user).select("name email").lean();

    const feedback = new BookingFeedback({
      booking_id: booking._id,
      vehicle_id: booking.vehicle,
      customer_id: booking.user,
      customer_name: customer?.name || "",
      customer_email: customer?.email || "",
      rating: parsedRating,
      comment: (comment || "").slice(0, 300),
      tags: Array.isArray(tags) ? tags.slice(0, 15) : []
    });

    await feedback.save();
    markFeedbackHandled(booking);
    await booking.save();

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: feedback
    });
  } catch (err) {
    console.error("Feedback submit error:", err);
    if (err?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Feedback already exists for this booking"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while submitting feedback"
    });
  }
});

router.put("/skip/:bookingId", checkDB, auth, async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID format"
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized for this booking" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ success: false, message: "Skip is allowed only for completed bookings" });
    }

    if (hasFeedbackHandled(booking)) {
      return res.json({ success: true, message: "Feedback already handled" });
    }

    markFeedbackHandled(booking);
    await booking.save();

    res.json({
      success: true,
      message: "Feedback skipped"
    });
  } catch (err) {
    console.error("Feedback skip error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while skipping feedback"
    });
  }
});

router.get("/summary", checkDB, auth, admin, async (req, res) => {
  try {
    const aggregateData = await BookingFeedback.aggregate([
      {
        $group: {
          _id: "$vehicle_id",
          average_rating: { $avg: "$rating" },
          review_count: { $sum: 1 }
        }
      }
    ]);

    const recentFeedback = await BookingFeedback.find()
      .sort({ created_at: -1 })
      .limit(100)
      .lean();

    const summaryMap = new Map();

    aggregateData.forEach((item) => {
      summaryMap.set(String(item._id), {
        vehicle_id: item._id,
        average_rating: Number(item.average_rating?.toFixed(2) || 0),
        review_count: item.review_count || 0,
        recent_comments: []
      });
    });

    recentFeedback.forEach((item) => {
      const key = String(item.vehicle_id);
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          vehicle_id: item.vehicle_id,
          average_rating: 0,
          review_count: 0,
          recent_comments: []
        });
      }

      const current = summaryMap.get(key);
      if (item.comment && current.recent_comments.length < 3) {
        current.recent_comments.push(item.comment);
      }
      summaryMap.set(key, current);
    });

    res.json({
      success: true,
      data: Array.from(summaryMap.values())
    });
  } catch (err) {
    console.error("Feedback summary error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching feedback summary"
    });
  }
});

module.exports = router;
