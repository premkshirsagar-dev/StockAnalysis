const express = require("express");
const sampleStocks = require("../data/stocks");
const Stock = require("../models/Stock");
const { getLiveStocks } = require("../services/upstoxService");

const router = express.Router();

function toNumber(value) {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function filterStocks(stocks, query) {
  const search = String(query.search || "").trim().toLowerCase();
  const sector = String(query.sector || "").trim().toLowerCase();
  const minPrice = toNumber(query.minPrice); const maxPrice = toNumber(query.maxPrice);
  const minMarketCap = toNumber(query.minMarketCap); const maxPeRatio = toNumber(query.maxPeRatio); const minChange = toNumber(query.minChange);
  return stocks.filter((stock) => {
    const matchesSearch = !search || `${stock.symbol} ${stock.company}`.toLowerCase().includes(search);
    const matchesSector = !sector || stock.sector.toLowerCase() === sector;
    return matchesSearch && matchesSector && (minPrice === undefined || stock.price >= minPrice) && (maxPrice === undefined || stock.price <= maxPrice) && (minMarketCap === undefined || stock.marketCap >= minMarketCap) && (maxPeRatio === undefined || stock.peRatio <= maxPeRatio) && (minChange === undefined || stock.changePercent >= minChange);
  });
}

async function getSourceStocks() {
  if (process.env.MARKET_DATA_MODE === "upstox") return getLiveStocks();
  const databaseStocks = await Stock.find().lean();
  return databaseStocks.length ? databaseStocks : sampleStocks;
}

router.get("/", async (req, res, next) => {
  try {
    const filtered = filterStocks(await getSourceStocks(), req.query);
    const sortBy = ["price", "changePercent", "marketCap", "peRatio", "volume"].includes(req.query.sortBy) ? req.query.sortBy : "marketCap";
    const order = req.query.order === "asc" ? 1 : -1;
    filtered.sort((a, b) => (Number(a[sortBy]) - Number(b[sortBy])) * order);
    res.json({ count: filtered.length, data: filtered });
  } catch (error) { next(error); }
});

router.get("/summary", async (req, res, next) => {
  try {
    const stocks = await getSourceStocks();
    const gainers = stocks.filter((stock) => stock.changePercent > 0).length;
    const losers = stocks.filter((stock) => stock.changePercent < 0).length;
    const averageChange = stocks.length ? stocks.reduce((total, stock) => total + stock.changePercent, 0) / stocks.length : 0;
    const largestCompany = stocks.reduce((largest, stock) => Number(stock.marketCap) > Number(largest?.marketCap || 0) ? stock : largest, stocks[0] || null);
    res.json({ total: stocks.length, gainers, losers, averageChange, largestCompany });
  } catch (error) { next(error); }
});

router.get("/sectors", async (req, res, next) => {
  try { res.json([...new Set((await getSourceStocks()).map((stock) => stock.sector))].sort()); }
  catch (error) { next(error); }
});

module.exports = router;
