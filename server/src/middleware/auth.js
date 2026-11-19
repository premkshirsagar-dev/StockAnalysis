const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ message: "Authentication required." });
    if (!process.env.JWT_SECRET) return res.status(500).json({ message: "JWT_SECRET is not configured on the server." });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("_id name email role isActive subscription createdAt").populate("subscription.planId").lean();
    if (!user) return res.status(401).json({ message: "User no longer exists." });
    if (!user.isActive) return res.status(403).json({ message: "This account is inactive." });

    if (user.role !== "admin" && user.subscription?.expiresAt && new Date(user.subscription.expiresAt) < new Date()) {
      user.subscription.status = "expired";
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
  }
}

module.exports = { requireAuth };
