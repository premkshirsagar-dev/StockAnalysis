import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowLeft, ArrowUpRight, BarChart3, Clock3, Layers3, TrendingUp } from "lucide-react";
import api from "./api";
import CandleChart from "./CandleChart";

const money = (value) => Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const number = (value) => Number(value || 0).toLocaleString("en-IN");
const time = (value) => value ? new Date(value).toLocaleString() : "Not available";

function Metric({ label, value, helper }) {
  return <div className="detail-metric"><span>{label}</span><strong>{value}</strong>{helper && <small>{helper}</small>}</div>;
}

function StockDetail({ stock, token, onBack }) {
  const [interval, setInterval] = useState("day");
  const [candles, setCandles] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState("");
  useEffect(() => {
    let active = true;
    setChartLoading(true); setChartError("");
    api.get(`/stocks/${encodeURIComponent(stock.instrumentKey)}/candles?interval=${interval}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => { if (active) setCandles(response.data.data || []); })
      .catch((error) => { if (active) { setCandles([]); setChartError(error.response?.data?.message || "Could not load historical candles."); } })
      .finally(() => { if (active) setChartLoading(false); });
    return () => { active = false; };
  }, [stock.instrumentKey, interval, token]);
  const positive = Number(stock.changePercent) >= 0;
  const buyDepth = stock.depth?.buy || [];
  const sellDepth = stock.depth?.sell || [];
  return <div className="stock-detail-page">
    <header className="detail-header"><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back to screener</button><div className="detail-updated"><Clock3 size={14} /> Updated {time(stock.updatedAt)}</div></header>
    <section className="detail-hero"><div><p className="eyebrow">{stock.exchange} EQUITY · {stock.instrumentKey}</p><h1>{stock.symbol}</h1><p className="detail-company">{stock.company}</p><div className="detail-tags"><span>{stock.sector}</span><span>{stock.category}</span><span>{stock.industry}</span></div></div><div className="detail-price"><strong>{money(stock.price)}</strong><span className={`detail-change ${positive ? "positive" : "negative"}`}>{positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}{positive ? "+" : "-"}{Math.abs(Number(stock.changePercent || 0)).toFixed(2)}%</span><small>Current market price</small></div></section>
    <section className="detail-metric-grid"><Metric label="Today open" value={money(stock.open)} /><Metric label="Today high" value={money(stock.high)} /><Metric label="Today low" value={money(stock.low)} /><Metric label="Previous close" value={money(stock.previousClose)} /><Metric label="Volume" value={number(stock.volume)} /><Metric label="Average price" value={money(stock.averagePrice)} /><Metric label="52-week high" value={money(stock.yearHigh)} /><Metric label="52-week low" value={money(stock.yearLow)} /></section>
    <section className="detail-card chart-card"><div className="detail-card-title"><BarChart3 size={17} /><div><p className="eyebrow">PRICE HISTORY</p><h2>Candlestick chart</h2></div><div className="timeframe-tabs">{[["1minute", "1m"], ["5minute", "5m"], ["10minute", "10m"], ["30minute", "30m"], ["day", "1D"], ["week", "1W"], ["month", "1M"]].map(([value, label]) => <button className={interval === value ? "selected" : ""} key={value} onClick={() => setInterval(value)}>{label}</button>)}</div></div>{chartLoading ? <div className="chart-empty">Loading historical candles…</div> : chartError ? <div className="chart-empty">{chartError}</div> : <CandleChart candles={candles} />}</section>
    <div className="detail-columns"><section className="detail-card"><div className="detail-card-title"><BarChart3 size={17} /><div><p className="eyebrow">PRICE SNAPSHOT</p><h2>Today’s market information</h2></div></div><div className="snapshot-row"><span>Net change</span><strong className={positive ? "text-positive" : "text-negative"}>{money(Number(stock.price || 0) - Number(stock.previousClose || 0))}</strong></div><div className="snapshot-row"><span>Trading range</span><strong>{money(stock.low)} – {money(stock.high)}</strong></div><div className="snapshot-row"><span>Last trade time</span><strong>{stock.lastTradeTime ? new Date(Number(stock.lastTradeTime)).toLocaleString() : "Not available"}</strong></div><div className="snapshot-row"><span>Total buy quantity</span><strong>{number(stock.totalBuyQuantity)}</strong></div><div className="snapshot-row"><span>Total sell quantity</span><strong>{number(stock.totalSellQuantity)}</strong></div></section><section className="detail-card"><div className="detail-card-title"><Layers3 size={17} /><div><p className="eyebrow">MARKET DEPTH</p><h2>Top available orders</h2></div></div><div className="depth-head"><span>Buy quantity / price</span><span>Sell quantity / price</span></div>{Array.from({ length: Math.max(buyDepth.length, sellDepth.length, 3) }).slice(0, 5).map((_, index) => <div className="depth-row" key={index}><span>{number(buyDepth[index]?.quantity)} <b>{money(buyDepth[index]?.price)}</b></span><span>{number(sellDepth[index]?.quantity)} <b>{money(sellDepth[index]?.price)}</b></span></div>)}</section></div>
    <div className="detail-disclaimer"><TrendingUp size={15} /> This page displays read-only market information for research and screening. It is not a trading recommendation.</div>
  </div>;
}

export default StockDetail;
