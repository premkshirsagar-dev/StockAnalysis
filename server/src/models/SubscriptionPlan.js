const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, default: 0, min: 0 },
    durationDays: { type: Number, default: 30, min: 0 },
    isActive: { type: Boolean, default: true },
    features: {
      maxScreenFilters: { type: Number, default: 3, min: 0 },
      maxWatchlistStocks: { type: Number, default: 10, min: 0 },
      technicalIndicators: { type: [String], default: ["SMA", "EMA"] },
      advancedCharts: { type: Boolean, default: false },
      realTimeData: { type: Boolean, default: false },
      advancedScreening: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
