const path = require("path");
const dns = require("node:dns");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("../models/User");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const email = String(process.argv[2] || "").trim().toLowerCase();
if (!email) { console.error("Usage: npm run create-admin -- user@example.com"); process.exit(1); }

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate({ email }, { role: "admin", isActive: true }, { new: true }).select("email role");
  if (!user) throw new Error("No user found with that email.");
  console.log(`Admin enabled for ${user.email}`);
  await mongoose.disconnect();
})().catch(async (error) => { console.error(error.message); try { await mongoose.disconnect(); } catch {} process.exit(1); });
