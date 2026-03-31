const mongoose = require("mongoose");

const bookingFeedbackSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
      unique: true
    },
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    customer_name: {
      type: String,
      default: ""
    },
    customer_email: {
      type: String,
      default: ""
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      maxlength: 300,
      default: ""
    },
    tags: {
      type: [String],
      default: []
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    collection: "bookingfeedback"
  }
);

module.exports = mongoose.model("BookingFeedback", bookingFeedbackSchema);
