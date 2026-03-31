const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "user" },
  isBlacklisted: { type: Boolean, default: false },
  blacklistReason: { type: String, default: "" },
  blacklistedAt: { type: Date, default: null },
  blacklistedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
});

module.exports = mongoose.model("User", userSchema);
