import { useEffect, useRef } from "react";
import { CandlestickSeries, ColorType, HistogramSeries, createChart } from "lightweight-charts";

function CandleChart({ candles }) {
  const chartContainer = useRef(null);

  useEffect(() => {
    if (!chartContainer.current || !candles.length) return undefined;
    const chart = createChart(chartContainer.current, {
      layout: { background: { type: ColorType.Solid, color: "#0c192a" }, textColor: "#8291a8" },
      grid: { vertLines: { color: "#17263a" }, horzLines: { color: "#17263a" } },
      width: chartContainer.current.clientWidth,
      height: 420,
      rightPriceScale: { borderColor: "#263a58" },
      timeScale: { borderColor: "#263a58", timeVisible: true }
    });
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#58d6a0", downColor: "#f1848e", borderUpColor: "#58d6a0", borderDownColor: "#f1848e", wickUpColor: "#58d6a0", wickDownColor: "#f1848e"
    });
    candleSeries.setData(candles.map((candle) => ({ time: candle.time, open: candle.open, high: candle.high, low: candle.low, close: candle.close })));
    const volumeSeries = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "" });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    volumeSeries.setData(candles.map((candle) => ({ time: candle.time, value: candle.volume, color: candle.close >= candle.open ? "#58d6a066" : "#f1848e66" })));
    chart.timeScale().fitContent();
    const resize = () => chart.applyOptions({ width: chartContainer.current?.clientWidth || 600 });
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); chart.remove(); };
  }, [candles]);

  return <div className="candle-chart" ref={chartContainer}>{!candles.length && <div className="chart-empty">No historical candles available for this interval.</div>}</div>;
}

export default CandleChart;
