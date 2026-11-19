const path = require("path");
const axios = require("axios");
const WebSocket = require("ws");
const protobuf = require("protobufjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { loadInstruments, requestedInstruments } = require("./upstoxService");

let upstream;
let feedResponseType;
let reconnectTimer;
let instrumentKeys = [];

function tokenFromSocket(socket) {
  const value = socket.handshake.auth?.token || "";
  return value.startsWith("Bearer ") ? value.slice(7) : value;
}

async function authorizeSocket(socket, next) {
  try {
    const token = tokenFromSocket(socket);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("_id isActive role").lean();
    if (!user || !user.isActive) return next(new Error("Authentication required."));
    socket.user = user;
    next();
  } catch (error) { next(new Error("Invalid live-market session.")); }
}

function findLtp(feed) {
  if (!feed) return null;
  if (feed.ltpc) return feed.ltpc;
  if (feed.fullFeed?.marketFF?.ltpc) return feed.fullFeed.marketFF.ltpc;
  if (feed.fullFeed?.indexFF?.ltpc) return feed.fullFeed.indexFF.ltpc;
  if (feed.firstLevelWithGreeks?.ltpc) return feed.firstLevelWithGreeks.ltpc;
  return null;
}

function emitTicks(io, message) {
  const decoded = feedResponseType.decode(message);
  const feeds = decoded.feeds || {};
  Object.entries(feeds).forEach(([instrumentKey, feed]) => {
    const ltpc = findLtp(feed);
    if (!ltpc || !Number(ltpc.ltp)) return;
    io.emit("market:tick", {
      instrumentKey,
      price: Number(ltpc.ltp),
      previousClose: Number(ltpc.cp || 0),
      lastTradeTime: Number(ltpc.ltt || Date.now()),
      receivedAt: Date.now()
    });
  });
}

async function connectUpstream(io) {
  if (!process.env.UPSTOX_ACCESS_TOKEN) { console.warn("Live feed disabled: UPSTOX_ACCESS_TOKEN is missing."); return; }
  try {
    const instruments = requestedInstruments(await loadInstruments());
    instrumentKeys = instruments.map((item) => item.instrument_key);
    if (!instrumentKeys.length) { console.warn("Live feed disabled: no instruments found."); return; }
    const authResponse = await axios.get("https://api.upstox.com/v3/feed/market-data-feed/authorize", { headers: { Accept: "application/json", Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}` }, timeout: 30000 });
    const websocketUrl = authResponse.data?.data?.authorizedRedirectUri || authResponse.data?.data?.authorized_redirect_uri;
    if (!websocketUrl) throw new Error("Upstox did not return an authorized WebSocket URL.");
    upstream = new WebSocket(websocketUrl, { followRedirects: true, headers: { Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`, Accept: "*/*" } });
    upstream.binaryType = "arraybuffer";
    upstream.on("open", () => {
      const subscription = { guid: `marketpulse-${Date.now()}`, method: "sub", data: { mode: "ltpc", instrumentKeys } };
      upstream.send(Buffer.from(JSON.stringify(subscription)));
      io.emit("market:status", { connected: true, instrumentCount: instrumentKeys.length });
      console.log(`Upstox live feed connected for ${instrumentKeys.length} instruments.`);
    });
    upstream.on("message", (message) => emitTicks(io, message));
    upstream.on("close", () => { io.emit("market:status", { connected: false }); scheduleReconnect(io); });
    upstream.on("error", (error) => console.error("Upstox live feed error:", error.message));
  } catch (error) { console.error("Upstox live feed connection failed:", error.message); scheduleReconnect(io); }
}

function scheduleReconnect(io) {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => { reconnectTimer = null; connectUpstream(io); }, 10000);
}

async function startLiveMarketGateway(httpServer) {
  const { Server } = require("socket.io");
  const origins = ["http://localhost:5173", "http://localhost:4173", process.env.CLIENT_URL].filter(Boolean).map((origin) => origin.trim().replace(/\/$/, ""));
  const io = new Server(httpServer, { cors: { origin: origins, methods: ["GET", "POST"] } });
  io.use(authorizeSocket);
  io.on("connection", (socket) => { socket.emit("market:status", { connected: Boolean(upstream && upstream.readyState === WebSocket.OPEN), instrumentCount: instrumentKeys.length }); });
  feedResponseType = (await protobuf.load(path.resolve(__dirname, "../data/MarketDataFeed.proto"))).lookupType("FeedResponse");
  connectUpstream(io);
}

module.exports = { startLiveMarketGateway };
