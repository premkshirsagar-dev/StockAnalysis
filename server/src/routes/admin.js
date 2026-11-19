const express = require("express");
const User = require("../models/User");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const { requireAdmin } = require("../middleware/authorization");

const router = express.Router();
router.use(requireAdmin);

router.get("/stats", async (req, res, next) => {
  try {
    const [users, activeUsers, admins] = await Promise.all([
      User.countDocuments(), User.countDocuments({ isActive: true }), User.countDocuments({ role: "admin" })
    ]);
    res.json({ users, activeUsers, admins });
  } catch (error) { next(error); }
});

router.get("/users", async (req, res, next) => {
  try { res.json(await User.find().select("-passwordHash").sort({ createdAt: -1 }).lean()); }
  catch (error) { next(error); }
});

router.patch("/users/:id", async (req, res, next) => {
  try {
    const updates = {};
    if (typeof req.body.isActive === "boolean") updates.isActive = req.body.isActive;
    if (["user", "admin"].includes(req.body.role) && req.params.id !== req.user._id.toString()) updates.role = req.body.role;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user });
  } catch (error) { next(error); }
});

router.patch("/users/:id/subscription", async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findById(req.body.planId).lean();
    if (!plan) return res.status(404).json({ message: "Subscription plan not found." });
    const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : new Date(Date.now() + plan.durationDays * 86400000);
    const user = await User.findByIdAndUpdate(req.params.id, { subscription: { planId: plan._id, planName: plan.name, status: "active", expiresAt } }, { new: true }).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user });
  } catch (error) { next(error); }
});

module.exports = router;
