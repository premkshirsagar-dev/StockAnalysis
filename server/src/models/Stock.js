const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, unique: true, uppercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    sector: { type: String, required: true },
    price: { type: Number, required: true },
    changePercent: { type: Number, required: true },
    marketCap: { type: Number, required: true },
    peRatio: { type: Number, required: true },
    volume: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stock", stockSchema);
