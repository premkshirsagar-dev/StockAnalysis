import { useEffect, useRef, useState } from "react";
import { CandlestickSeries, ColorType, HistogramSeries, LineSeries, createChart } from "lightweight-charts";

function sma(candles, period) {
  return candles.map((candle, index) => index < period - 1 ? null : { time: candle.time, value: candles.slice(index - period + 1, index + 1).reduce((sum, item) => sum + item.close, 0) / period }).filter(Boolean);
}
function ema(candles, period) {
  let previous;
  const multiplier = 2 / (period + 1);
  return candles.map((candle, index) => { previous = index === 0 ? candle.close : (candle.close - previous) * multiplier + previous; return index < period - 1 ? null : { time: candle.time, value: previous }; }).filter(Boolean);
}
function bollinger(candles, period = 20, multiplier = 2) {
  const upper = []; const lower = [];
  candles.forEach((candle, index) => { if (index < period - 1) return; const values = candles.slice(index - period + 1, index + 1).map((item) => item.close); const mean = values.reduce((sum, value) => sum + value, 0) / period; const deviation = Math.sqrt(values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / period); upper.push({ time: candle.time, value: mean + deviation * multiplier }); lower.push({ time: candle.time, value: mean - deviation * multiplier }); });
  return { upper, lower };
}

function CandleChart({ candles }) {
  const chartContainer = useRef(null);
  const [indicators, setIndicators] = useState({ sma: true, ema: false, bollinger: false });

  useEffect(() => {
    if (!chartContainer.current || !candles.length) return undefined;
    const chart = createChart(chartContainer.current, {
      layout: { background: { type: ColorType.Solid, color: "#0c192a" }, textColor: "#8291a8", fontFamily: "DM Mono" },
      grid: { vertLines: { color: "#17263a" }, horzLines: { color: "#17263a" } },
      width: chartContainer.current.clientWidth, height: 420,
      rightPriceScale: { borderColor: "#263a58", scaleMargins: { top: 0.08, bottom: 0.2 } },
      timeScale: { borderColor: "#263a58", timeVisible: true, secondsVisible: false, rightOffset: 5 },
      crosshair: { vertLine: { color: "#7ea9dc", width: 1, style: 2 }, horzLine: { color: "#7ea9dc", width: 1, style: 2 } }
    });
    const candleSeries = chart.addSeries(CandlestickSeries, { upColor: "#58d6a0", downColor: "#f1848e", borderUpColor: "#58d6a0", borderDownColor: "#f1848e", wickUpColor: "#58d6a0", wickDownColor: "#f1848e" });
    candleSeries.setData(candles.map((candle) => ({ time: candle.time, open: candle.open, high: candle.high, low: candle.low, close: candle.close })));
    const volumeSeries = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "" });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    volumeSeries.setData(candles.map((candle) => ({ time: candle.time, value: candle.volume, color: candle.close >= candle.open ? "#58d6a066" : "#f1848e66" })));
    if (indicators.sma) { const series = chart.addSeries(LineSeries, { color: "#f7c66b", lineWidth: 2, title: "SMA 20" }); series.setData(sma(candles, 20)); }
    if (indicators.ema) { const series = chart.addSeries(LineSeries, { color: "#7ea9ff", lineWidth: 2, title: "EMA 20" }); series.setData(ema(candles, 20)); }
    if (indicators.bollinger) { const bands = bollinger(candles); const upper = chart.addSeries(LineSeries, { color: "#b48cff", lineWidth: 1, title: "BB upper" }); const lower = chart.addSeries(LineSeries, { color: "#b48cff", lineWidth: 1, title: "BB lower" }); upper.setData(bands.upper); lower.setData(bands.lower); }
    chart.timeScale().fitContent();
    const resize = () => chart.applyOptions({ width: chartContainer.current?.clientWidth || 600 });
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); chart.remove(); };
  }, [candles, indicators]);

  return <div className="chart-workspace"><div className="indicator-toolbar"><span>Indicators</span><button className={indicators.sma ? "active" : ""} onClick={() => setIndicators((current) => ({ ...current, sma: !current.sma }))}>SMA 20</button><button className={indicators.ema ? "active" : ""} onClick={() => setIndicators((current) => ({ ...current, ema: !current.ema }))}>EMA 20</button><button className={indicators.bollinger ? "active" : ""} onClick={() => setIndicators((current) => ({ ...current, bollinger: !current.bollinger }))}>Bollinger</button><span className="chart-hint">Scroll to zoom · drag to pan · crosshair enabled</span></div><div className="candle-chart" ref={chartContainer}>{!candles.length && <div className="chart-empty">No historical candles available for this interval.</div>}</div></div>;
}

export default CandleChart;
