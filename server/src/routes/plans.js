const express = require("express");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/authorization");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try { res.json(await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 }).lean()); }
  catch (error) { next(error); }
});

router.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try { res.status(201).json(await SubscriptionPlan.create(req.body)); }
  catch (error) { next(error); }
});

router.patch("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ message: "Plan not found." });
    res.json(plan);
  } catch (error) { next(error); }
});

module.exports = router;
