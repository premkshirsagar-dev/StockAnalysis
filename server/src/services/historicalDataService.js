const axios = require("axios");

const ALLOWED_INTERVALS = new Set(["1minute", "5minute", "10minute", "30minute", "day", "week", "month"]);

function formatDate(date) { return date.toISOString().slice(0, 10); }
function defaultFromDate(interval) {
  const date = new Date();
  if (["1minute", "5minute", "10minute", "30minute"].includes(interval)) date.setMonth(date.getMonth() - 1);
  else if (interval === "week" || interval === "month") date.setFullYear(date.getFullYear() - 10);
  else date.setFullYear(date.getFullYear() - 1);
  return formatDate(date);
}

function normalize(candles) {
  return candles.map(([time, open, high, low, close, volume, openInterest]) => ({
    time: Math.floor(new Date(time).getTime() / 1000), timestamp: time,
    open: Number(open), high: Number(high), low: Number(low), close: Number(close),
    volume: Number(volume || 0), openInterest: Number(openInterest || 0)
  })).sort((a, b) => a.time - b.time);
}

function aggregate(candles, minutes) {
  const buckets = new Map();
  candles.forEach((candle) => {
    const bucketTime = Math.floor(candle.time / (minutes * 60)) * minutes * 60;
    const current = buckets.get(bucketTime);
    if (!current) buckets.set(bucketTime, { ...candle, time: bucketTime, timestamp: new Date(bucketTime * 1000).toISOString() });
    else { current.high = Math.max(current.high, candle.high); current.low = Math.min(current.low, candle.low); current.close = candle.close; current.volume += candle.volume; current.openInterest = candle.openInterest; }
  });
  return [...buckets.values()].sort((a, b) => a.time - b.time);
}

async function getHistoricalCandles({ instrumentKey, interval = "day", fromDate, toDate }) {
  if (!instrumentKey) throw new Error("instrumentKey is required.");
  if (!ALLOWED_INTERVALS.has(interval)) throw new Error("Unsupported candle interval.");
  if (!process.env.UPSTOX_ACCESS_TOKEN) throw new Error("UPSTOX_ACCESS_TOKEN is missing.");
  const endDate = toDate || formatDate(new Date());
  const startDate = fromDate || defaultFromDate(interval);
  const requestedMinutes = interval === "5minute" ? 5 : interval === "10minute" ? 10 : null;
  const providerInterval = requestedMinutes ? "1minute" : interval;
  const encodedKey = encodeURIComponent(instrumentKey);
  const response = await axios.get(`https://api.upstox.com/v2/historical-candle/${encodedKey}/${providerInterval}/${endDate}/${startDate}`, { headers: { Accept: "application/json", Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}` }, timeout: 30000 });
  const candles = normalize(response.data?.data?.candles || []);
  return requestedMinutes ? aggregate(candles, requestedMinutes) : candles;
}

module.exports = { getHistoricalCandles };
