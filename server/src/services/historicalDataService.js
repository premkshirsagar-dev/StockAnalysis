const axios = require("axios");

const ALLOWED_INTERVALS = new Set(["1minute", "30minute", "day", "week", "month"]);

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function defaultFromDate(interval) {
  const date = new Date();
  if (interval === "1minute" || interval === "30minute") date.setMonth(date.getMonth() - 1);
  else if (interval === "week" || interval === "month") date.setFullYear(date.getFullYear() - 10);
  else date.setFullYear(date.getFullYear() - 1);
  return formatDate(date);
}

async function getHistoricalCandles({ instrumentKey, interval = "day", fromDate, toDate }) {
  if (!instrumentKey) throw new Error("instrumentKey is required.");
  if (!ALLOWED_INTERVALS.has(interval)) throw new Error("Unsupported candle interval.");
  if (!process.env.UPSTOX_ACCESS_TOKEN) throw new Error("UPSTOX_ACCESS_TOKEN is missing.");

  const endDate = toDate || formatDate(new Date());
  const startDate = fromDate || defaultFromDate(interval);
  const encodedKey = encodeURIComponent(instrumentKey);
  const response = await axios.get(`https://api.upstox.com/v2/historical-candle/${encodedKey}/${interval}/${endDate}/${startDate}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}` },
    timeout: 30000
  });

  const candles = response.data?.data?.candles || [];
  return candles.map(([time, open, high, low, close, volume, openInterest]) => ({
    time: Math.floor(new Date(time).getTime() / 1000),
    timestamp: time,
    open: Number(open),
    high: Number(high),
    low: Number(low),
    close: Number(close),
    volume: Number(volume || 0),
    openInterest: Number(openInterest || 0)
  })).sort((a, b) => a.time - b.time);
}

module.exports = { getHistoricalCandles };
