import React, { useState, useRef } from 'react';

export default function CandlestickChart({ candles = [] }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const containerRef = useRef(null);

  if (!candles || candles.length === 0) {
    return (
      <div className="varsity-card p-8 text-center text-slate-500 text-sm">
        No candlestick data available to render chart.
      </div>
    );
  }

  // Chart dimensions & math
  const width = 800;
  const height = 360;
  const padding = { top: 30, right: 60, bottom: 50, left: 60 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate Price Range
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const maxPrice = Math.max(...highs);
  const minPrice = Math.min(...lows);
  const priceRange = (maxPrice - minPrice) || 1;

  // Calculate Volume Range
  const maxVol = Math.max(...candles.map(c => c.volume)) || 1;

  // Candle spacing
  const candleWidth = Math.max(2, (chartWidth / candles.length) * 0.7);
  const candleGap = chartWidth / candles.length;

  const getY = (price) => {
    return padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  const getVolY = (vol) => {
    const volHeight = (vol / maxVol) * (chartHeight * 0.25);
    return padding.top + chartHeight - volHeight;
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - padding.left;
    const index = Math.floor(mouseX / candleGap);
    if (index >= 0 && index < candles.length) {
      setHoverIndex(index);
    } else {
      setHoverIndex(null);
    }
  };

  const activeCandle = hoverIndex !== null ? candles[hoverIndex] : candles[candles.length - 1];

  return (
    <div className="varsity-card p-4 bg-white border border-slate-200 rounded-lg">
      
      {/* Top Header & Hover Tooltip summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3 pb-3 border-b border-slate-100 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-800">OHLCV Candlestick Chart</span>
          <span className="text-slate-400">({candles.length} Candles)</span>
        </div>

        {activeCandle && (
          <div className="flex flex-wrap items-center gap-3 font-mono text-slate-700 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
            <div><span className="text-slate-400 font-sans">Date:</span> <span className="font-semibold">{activeCandle.date}</span></div>
            <div><span className="text-slate-400 font-sans">O:</span> <span className="font-semibold">{activeCandle.open}</span></div>
            <div><span className="text-slate-400 font-sans">H:</span> <span className="text-emerald-600 font-semibold">{activeCandle.high}</span></div>
            <div><span className="text-slate-400 font-sans">L:</span> <span className="text-red-600 font-semibold">{activeCandle.low}</span></div>
            <div><span className="text-slate-400 font-sans">C:</span> <span className={`font-semibold ${activeCandle.close >= activeCandle.open ? 'text-emerald-600' : 'text-red-600'}`}>{activeCandle.close}</span></div>
            <div><span className="text-slate-400 font-sans">V:</span> <span className="font-semibold">{activeCandle.volume ? activeCandle.volume.toLocaleString() : 'N/A'}</span></div>
          </div>
        )}
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden" ref={containerRef} onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIndex(null)}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + chartHeight * ratio;
            const price = (maxPrice - ratio * priceRange).toFixed(2);
            return (
              <g key={i}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                <text x={width - padding.right + 8} y={y + 4} fill="#94a3b8" fontSize="10" fontFamily="monospace">
                  {price}
                </text>
              </g>
            );
          })}

          {/* Volume bars (bottom 25%) */}
          {candles.map((c, i) => {
            const x = padding.left + i * candleGap + candleGap / 2;
            const volY = getVolY(c.volume);
            const isBullish = c.close >= c.open;
            return (
              <rect
                key={`vol-${i}`}
                x={x - candleWidth / 2}
                y={volY}
                width={candleWidth}
                height={padding.top + chartHeight - volY}
                fill={isBullish ? "#bbf7d0" : "#fecaca"}
                opacity={0.7}
              />
            );
          })}

          {/* Candlesticks */}
          {candles.map((c, i) => {
            const x = padding.left + i * candleGap + candleGap / 2;
            const openY = getY(c.open);
            const closeY = getY(c.close);
            const highY = getY(c.high);
            const lowY = getY(c.low);
            const isBullish = c.close >= c.open;
            const color = isBullish ? "#16a34a" : "#dc2626";
            const candleTop = Math.min(openY, closeY);
            const candleBodyHeight = Math.max(2, Math.abs(closeY - openY));

            return (
              <g key={`candle-${i}`}>
                {/* Wick */}
                <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1.5" />
                {/* Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={candleTop}
                  width={candleWidth}
                  height={candleBodyHeight}
                  fill={isBullish ? "#22c55e" : "#ef4444"}
                  stroke={color}
                  strokeWidth="1"
                  rx="0.5"
                />
              </g>
            );
          })}

          {/* Hover Crosshair */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={padding.left + hoverIndex * candleGap + candleGap / 2}
                y1={padding.top}
                x2={padding.left + hoverIndex * candleGap + candleGap / 2}
                y2={height - padding.bottom}
                stroke="#3b82f6"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            </g>
          )}

          {/* X Axis dates */}
          {candles.map((c, i) => {
            if (i % Math.ceil(candles.length / 6) === 0) {
              const x = padding.left + i * candleGap;
              const dateText = c.date.split(' ')[0] || c.date;
              return (
                <text key={`date-${i}`} x={x} y={height - 15} fill="#64748b" fontSize="10" textAnchor="middle">
                  {dateText}
                </text>
              );
            }
            return null;
          })}

        </svg>
      </div>
      <div className="mt-2 text-[11px] text-slate-400 text-center">
        Hover over candles to inspect precise OHLCV values.
      </div>
    </div>
  );
}
