const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const stocksRouter = require("./routes/stocks");
const authRouter = require("./routes/auth");
const marketDataRouter = require("./routes/marketData");
const adminRouter = require("./routes/admin");
const plansRouter = require("./routes/plans");
const screensRouter = require("./routes/screens");
const { requireAuth } = require("./middleware/auth");
const { startLiveMarketGateway } = require("./services/liveMarketGateway");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

const allowedOrigins = ["http://localhost:5173", "http://localhost:4173", process.env.CLIENT_URL]
  .filter(Boolean)
  .map((origin) => origin.trim().replace(/\/$/, ""));
app.use(cors({ origin: (origin, callback) => { if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) return callback(null, true); return callback(new Error("CORS origin not allowed.")); }, credentials: false, optionsSuccessStatus: 204 }));
app.options("*", cors({ origin: allowedOrigins, optionsSuccessStatus: 204 }));
app.use(helmet()); app.use(morgan("dev")); app.use(express.json());
app.get("/", (req, res) => res.json({ name: "MarketPulse API", status: "running", database: mongoose.connection.readyState === 1 ? "connected" : "not-connected" }));
app.get("/api/health", (req, res) => res.json({ ok: true, database: mongoose.connection.readyState === 1 ? "connected" : "not-connected" }));
app.use("/api/auth", authRouter);
app.use("/api/stocks", requireAuth, stocksRouter);
app.use("/api/market-data", requireAuth, marketDataRouter);
app.use("/api/admin", requireAuth, adminRouter);
app.use("/api/plans", plansRouter);
app.use("/api/screens", screensRouter);
app.use((error, req, res, next) => { console.error(error); res.status(500).json({ message: error.message || "Something went wrong on the server." }); });

async function start() {
  if (!process.env.MONGO_URI) { console.error("MONGO_URI is missing."); process.exit(1); }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) { console.error("JWT_SECRET is missing or too short."); process.exit(1); }
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    console.log("MongoDB connected.");
    httpServer.listen(PORT, async () => {
      console.log(`MarketPulse API running at http://localhost:${PORT}`);
      if (process.env.MARKET_DATA_MODE === "upstox") await startLiveMarketGateway(httpServer);
    });
  } catch (error) { console.error("MongoDB connection failed:", error.message); process.exit(1); }
}
start();
