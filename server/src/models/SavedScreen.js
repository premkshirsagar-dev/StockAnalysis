const mongoose = require("mongoose");

const conditionSchema = new mongoose.Schema({
  field: { type: String, required: true },
  operator: { type: String, required: true },
  comparisonType: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, default: null },
  indicator: { type: String, default: null },
  period: { type: Number, default: null },
  logicalOperator: { type: String, enum: ["AND", "OR"], default: "AND" }
}, { _id: false });

const savedScreenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    conditions: { type: [conditionSchema], default: [] },
    isPublic: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SavedScreen", savedScreenSchema);
