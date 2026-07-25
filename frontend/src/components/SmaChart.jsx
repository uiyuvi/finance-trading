import React, { useState, useRef } from 'react';

export default function SmaChart({ candles = [], buyMarkers = [], sellMarkers = [], shortSmaPeriod = 10, longSmaPeriod = 40 }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const containerRef = useRef(null);

  if (!candles || candles.length === 0) {
    return (
      <div className="varsity-card p-8 text-center text-slate-500 text-sm">
        No backtest candle data available to render chart.
      </div>
    );
  }

  // Dimensions
  const width = 900;
  const height = 400;
  const padding = { top: 30, right: 60, bottom: 50, left: 60 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate Price Range
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const maxPrice = Math.max(...highs);
  const minPrice = Math.min(...lows);
  const priceRange = (maxPrice - minPrice) || 1;

  // Candle Math
  const candleWidth = Math.max(2, (chartWidth / candles.length) * 0.7);
  const candleGap = chartWidth / candles.length;

  const getY = (price) => {
    if (price === null || price === undefined) return null;
    return padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
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

  // Helper arrays for SVG polyline paths
  const shortSmaPoints = candles
    .map((c, i) => {
      const y = getY(c.short_sma);
      if (y === null) return null;
      const x = padding.left + i * candleGap + candleGap / 2;
      return `${x},${y}`;
    })
    .filter(Boolean)
    .join(' ');

  const longSmaPoints = candles
    .map((c, i) => {
      const y = getY(c.long_sma);
      if (y === null) return null;
      const x = padding.left + i * candleGap + candleGap / 2;
      return `${x},${y}`;
    })
    .filter(Boolean)
    .join(' ');

  // Quick lookup for buy/sell execution markers by date
  const buyMap = {};
  buyMarkers.forEach(b => { buyMap[b.date] = b; });

  const sellMap = {};
  sellMarkers.forEach(s => { sellMap[s.date] = s; });

  return (
    <div className="varsity-card p-4 bg-white border border-slate-200 rounded-lg">
      
      {/* Legend & Active Hover Tooltip */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3 pb-3 border-b border-slate-100 text-xs">
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-slate-800">SMA Crossover Chart</span>
          
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="flex items-center gap-1 font-semibold text-blue-600">
              <span className="w-3 h-0.5 bg-blue-600 inline-block"></span> Short SMA ({shortSmaPeriod})
            </span>
            <span className="flex items-center gap-1 font-semibold text-amber-600">
              <span className="w-3 h-0.5 bg-amber-500 inline-block"></span> Long SMA ({longSmaPeriod})
            </span>
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full inline-block"></span> Buy Execution
            </span>
            <span className="flex items-center gap-1 text-red-700 font-semibold">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-full inline-block"></span> Sell Execution
            </span>
          </div>
        </div>

        {activeCandle && (
          <div className="flex flex-wrap items-center gap-3 font-mono text-slate-700 bg-slate-50 px-3 py-1.5 rounded border border-slate-200 text-[11px]">
            <div><span className="text-slate-400 font-sans">Date:</span> <span className="font-semibold">{activeCandle.date}</span></div>
            <div><span className="text-slate-400 font-sans">Close:</span> <span className="font-semibold">₹{activeCandle.close}</span></div>
            <div><span className="text-slate-400 font-sans">SMA({shortSmaPeriod}):</span> <span className="text-blue-600 font-semibold">{activeCandle.short_sma || 'N/A'}</span></div>
            <div><span className="text-slate-400 font-sans">SMA({longSmaPeriod}):</span> <span className="text-amber-600 font-semibold">{activeCandle.long_sma || 'N/A'}</span></div>
            <div><span className="text-slate-400 font-sans">Portfolio:</span> <span className="text-slate-900 font-semibold">₹{activeCandle.portfolio_value?.toLocaleString() || 'N/A'}</span></div>
          </div>
        )}
      </div>

      {/* SVG Container */}
      <div className="relative w-full overflow-hidden" ref={containerRef} onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIndex(null)}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          
          {/* Price Gridlines */}
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
                <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1" />
                <rect
                  x={x - candleWidth / 2}
                  y={candleTop}
                  width={candleWidth}
                  height={candleBodyHeight}
                  fill={isBullish ? "#22c55e" : "#ef4444"}
                  stroke={color}
                  strokeWidth="0.5"
                  rx="0.5"
                />
              </g>
            );
          })}

          {/* Short SMA Polyline */}
          {shortSmaPoints && (
            <polyline
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              points={shortSmaPoints}
            />
          )}

          {/* Long SMA Polyline */}
          {longSmaPoints && (
            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              points={longSmaPoints}
            />
          )}

          {/* Buy & Sell Execution Markers */}
          {candles.map((c, i) => {
            const x = padding.left + i * candleGap + candleGap / 2;
            const isBuy = buyMap[c.date];
            const isSell = sellMap[c.date];

            if (isBuy) {
              const y = getY(c.low) + 16;
              return (
                <g key={`buy-${i}`}>
                  <polygon
                    points={`${x},${y - 8} ${x - 5},${y + 2} ${x + 5},${y + 2}`}
                    fill="#16a34a"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                  <text x={x} y={y + 12} fill="#15803d" fontSize="9" fontWeight="bold" textAnchor="middle">
                    BUY @ ₹{isBuy.price}
                  </text>
                </g>
              );
            }

            if (isSell) {
              const y = getY(c.high) - 16;
              return (
                <g key={`sell-${i}`}>
                  <polygon
                    points={`${x},${y + 8} ${x - 5},${y - 2} ${x + 5},${y - 2}`}
                    fill="#dc2626"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                  <text x={x} y={y - 6} fill="#b91c1c" fontSize="9" fontWeight="bold" textAnchor="middle">
                    SELL @ ₹{isSell.price}
                  </text>
                </g>
              );
            }

            return null;
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

          {/* X Axis Dates */}
          {candles.map((c, i) => {
            if (i % Math.ceil(candles.length / 7) === 0) {
              const x = padding.left + i * candleGap;
              return (
                <text key={`date-${i}`} x={x} y={height - 15} fill="#64748b" fontSize="10" textAnchor="middle">
                  {c.date}
                </text>
              );
            }
            return null;
          })}

        </svg>
      </div>

      <div className="mt-2 text-[11px] text-slate-400 text-center">
        Short SMA ({shortSmaPeriod}) crossover above Long SMA ({longSmaPeriod}) triggers Buy. Crossover below triggers Sell at next open.
      </div>
    </div>
  );
}
