const mongoose = require("mongoose");

const rideFeedbackSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 300,
      default: ""
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    collection: "ride_feedback",
    timestamps: { createdAt: "created_at", updatedAt: false }
  }
);

module.exports = mongoose.model("RideFeedback", rideFeedbackSchema);
