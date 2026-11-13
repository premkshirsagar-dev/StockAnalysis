const express = require("express");
const { getMarketDataStatus } = require("../services/upstoxService");

const router = express.Router();

router.get("/status", async (req, res, next) => {
  try {
    res.json(await getMarketDataStatus());
  } catch (error) {
    next(error);
  }
});

module.exports = router;
