const path = require("path");
const dns = require("node:dns");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const SubscriptionPlan = require("../models/SubscriptionPlan");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const plans = [
  { name: "Free", description: "Basic market overview and simple filters.", price: 0, durationDays: 0, features: { maxScreenFilters: 3, maxWatchlistStocks: 5, technicalIndicators: ["SMA", "EMA"], advancedCharts: false, realTimeData: false, advancedScreening: false } },
  { name: "Basic", description: "More indicators and saved screens.", price: 0, durationDays: 30, features: { maxScreenFilters: 10, maxWatchlistStocks: 25, technicalIndicators: ["SMA", "EMA", "RSI"], advancedCharts: false, realTimeData: false, advancedScreening: false } },
  { name: "Premium", description: "Advanced charts and screening.", price: 0, durationDays: 30, features: { maxScreenFilters: 50, maxWatchlistStocks: 100, technicalIndicators: ["SMA", "EMA", "RSI", "MACD"], advancedCharts: true, realTimeData: true, advancedScreening: true } },
  { name: "Professional", description: "Full research workspace.", price: 0, durationDays: 30, features: { maxScreenFilters: 200, maxWatchlistStocks: 500, technicalIndicators: ["SMA", "EMA", "RSI", "MACD"], advancedCharts: true, realTimeData: true, advancedScreening: true } }
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  for (const plan of plans) await SubscriptionPlan.findOneAndUpdate({ name: plan.name }, plan, { upsert: true, new: true, setDefaultsOnInsert: true });
  console.log("Subscription plans seeded.");
  await mongoose.disconnect();
})().catch(async (error) => { console.error(error.message); try { await mongoose.disconnect(); } catch {} process.exit(1); });
