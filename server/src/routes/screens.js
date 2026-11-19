const express = require("express");
const SavedScreen = require("../models/SavedScreen");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try { res.json(await SavedScreen.find({ $or: [{ userId: req.user._id }, { isPublic: true }] }).sort({ updatedAt: -1 }).lean()); }
  catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name || !Array.isArray(req.body.conditions)) return res.status(400).json({ message: "Screen name and conditions are required." });
    res.status(201).json(await SavedScreen.create({ userId: req.user._id, name, conditions: req.body.conditions, isPublic: false }));
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await SavedScreen.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) return res.status(404).json({ message: "Saved screen not found." });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

module.exports = router;
