const axios = require("axios");
const zlib = require("zlib");
const { classifyStock } = require("./sectorClassifier");

const INSTRUMENT_URLS = [
  "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz",
  "https://assets.upstox.com/market-quote/instruments/exchange/BSE.json.gz"
];

let instrumentCache = { expiresAt: 0, instruments: [] };
let quoteCache = { expiresAt: 0, stocks: [] };

function requiredToken() {
  if (!process.env.UPSTOX_ACCESS_TOKEN) throw new Error("UPSTOX_ACCESS_TOKEN is missing.");
  return process.env.UPSTOX_ACCESS_TOKEN;
}

async function loadInstruments() {
  if (instrumentCache.expiresAt > Date.now()) return instrumentCache.instruments;
  const responses = await Promise.all(INSTRUMENT_URLS.map((url) => axios.get(url, { responseType: "arraybuffer", timeout: 30000 })));
  const all = responses.flatMap((response) => JSON.parse(zlib.gunzipSync(response.data).toString("utf8")));
  const equities = all.filter((item) => ["NSE_EQ", "BSE_EQ"].includes(item.segment) && item.instrument_type === "EQ");
  const unique = [...new Map(equities.map((item) => [item.instrument_key, item])).values()];
  instrumentCache = { expiresAt: Date.now() + 24 * 60 * 60 * 1000, instruments: unique };
  return unique;
}

function requestedInstruments(instruments) {
  const configured = String(process.env.UPSTOX_INSTRUMENT_KEYS || "").split(",").map((value) => value.trim()).filter(Boolean);
  if (configured.length) return instruments.filter((item) => configured.includes(item.instrument_key));
  return instruments;
}

function normalizeQuote(quote, instrument) {
  const previousClose = Number(quote.prev_close_price || quote.ohlc?.close || 0);
  const price = Number(quote.last_price || 0);
  const absoluteChange = Number(quote.net_change || 0);
  const changePercent = previousClose ? (absoluteChange / previousClose) * 100 : 0;
  const symbol = quote.symbol || instrument.trading_symbol;
  const company = instrument.name || quote.symbol || instrument.trading_symbol;
  const classification = classifyStock({ symbol, company });
  return {
    symbol,
    company,
    ...classification,
    exchange: instrument.exchange,
    instrumentKey: quote.instrument_token || instrument.instrument_key,
    price,
    changePercent,
    marketCap: 0,
    peRatio: 0,
    volume: Number(quote.volume || quote.ohlc?.volume || 0),
    open: Number(quote.ohlc?.open || 0),
    high: Number(quote.ohlc?.high || 0),
    low: Number(quote.ohlc?.low || 0),
    close: Number(quote.ohlc?.close || previousClose),
    averagePrice: Number(quote.average_price || 0),
    totalBuyQuantity: Number(quote.total_buy_quantity || 0),
    totalSellQuantity: Number(quote.total_sell_quantity || 0),
    yearHigh: Number(quote.year_high || 0),
    yearLow: Number(quote.year_low || 0),
    lastTradeTime: quote.last_trade_time || null,
    depth: quote.depth || { buy: [], sell: [] },
    previousClose,
    updatedAt: quote.timestamp || new Date().toISOString()
  };
}

async function fetchQuoteBatch(instrumentKeys) {
  const response = await axios.get("https://api.upstox.com/v3/market-quote/quotes", {
    headers: { Accept: "application/json", Authorization: `Bearer ${requiredToken()}` },
    params: { instrument_key: instrumentKeys.join(",") },
    timeout: 30000
  });
  return response.data?.data || {};
}

async function getLiveStocks() {
  if (quoteCache.expiresAt > Date.now()) return quoteCache.stocks;
  const instruments = requestedInstruments(await loadInstruments());
  if (!instruments.length) return [];
  const lookup = new Map(instruments.map((item) => [item.instrument_key, item]));
  const stocks = [];
  for (let index = 0; index < instruments.length; index += 500) {
    const batch = instruments.slice(index, index + 500);
    const quotes = await fetchQuoteBatch(batch.map((item) => item.instrument_key));
    Object.values(quotes).forEach((quote) => {
      const instrument = lookup.get(quote.instrument_token);
      if (instrument) stocks.push(normalizeQuote(quote, instrument));
    });
  }
  quoteCache = { expiresAt: Date.now() + Number(process.env.UPSTOX_CACHE_SECONDS || 15) * 1000, stocks };
  return stocks;
}

async function getMarketDataStatus() {
  const instruments = await loadInstruments();
  return { provider: "Upstox", mode: process.env.MARKET_DATA_MODE || "sample", instrumentCount: instruments.length, cachedQuotes: quoteCache.stocks.length, quoteCacheExpiresAt: quoteCache.expiresAt || null };
}

module.exports = { getLiveStocks, getMarketDataStatus, loadInstruments, requestedInstruments };
