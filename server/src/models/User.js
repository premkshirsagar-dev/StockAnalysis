const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan", default: null },
  planName: { type: String, default: "Free" },
  status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
  expiresAt: { type: Date, default: null }
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    isActive: { type: Boolean, default: true, index: true },
    subscription: { type: subscriptionSchema, default: () => ({}) }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
