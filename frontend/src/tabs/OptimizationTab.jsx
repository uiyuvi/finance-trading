import React, { useState, useEffect, useRef } from 'react';
import { Sliders, Play, RefreshCw, Code, ShieldAlert, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import SmaChart from '../components/SmaChart';
import JsonView from '../components/JsonView';

export default function OptimizationTab() {
  const [symbol, setSymbol] = useState('NSE:NIFTYBEES');
  const [fromDate, setFromDate] = useState('2025-01-01');
  const [toDate, setToDate] = useState('2026-07-25');
  const [shortSma, setShortSma] = useState(10);
  const [longSma, setLongSma] = useState(40);
  const [stopLossPct, setStopLossPct] = useState(1.0);
  const [takeProfitPct, setTakeProfitPct] = useState(5.0);
  const [initialCapital, setInitialCapital] = useState(500000);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'log' | 'raw'

  // Ref to cache results for identical parameters
  const cacheRef = useRef({});

  const getCacheKey = () => {
    return `${symbol}_${fromDate}_${toDate}_${shortSma}_${longSma}_${stopLossPct}_${takeProfitPct}_${initialCapital}`;
  };

  const runOptimization = async (e) => {
    if (e) e.preventDefault();
    setError(null);

    // Validation
    const sPeriod = parseInt(shortSma);
    const lPeriod = parseInt(longSma);
    const sl = parseFloat(stopLossPct);
    const tp = parseFloat(takeProfitPct);

    if (isNaN(sPeriod) || isNaN(lPeriod) || sPeriod >= lPeriod) {
      setError("Short SMA period must be strictly less than Long SMA period.");
      return;
    }
    if (isNaN(sl) || sl < 0 || isNaN(tp) || tp < 0) {
      setError("Stop-loss % and Take-profit % must be non-negative numbers.");
      return;
    }

    const key = getCacheKey();
    if (cacheRef.current[key]) {
      console.log("Returning cached Optimization results.");
      setData(cacheRef.current[key]);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/backtest/optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbol,
          from_date: fromDate,
          to_date: toDate,
          short_sma: sPeriod,
          long_sma: lPeriod,
          stop_loss_pct: sl,
          take_profit_pct: tp,
          initial_capital: parseFloat(initialCapital)
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.detail || "Optimization backtest calculation failed.");
      }

      cacheRef.current[key] = json;
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runOptimization();
  }, []);

  const metrics = data?.metrics;
  const riskMeta = data?.risk_metadata;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <Sliders className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">SMA Strategy Risk Optimization</h2>
            {data?.data_source && (
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                data.data_source === 'ZERODHA_LIVE_API' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {data.data_source === 'ZERODHA_LIVE_API' ? '🟢 Zerodha Live API' : '⚡ Simulated Sandbox'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Extends SMA Backtest with <span className="font-semibold text-red-600">Stop-Loss %</span> and <span className="font-semibold text-emerald-600">Take-Profit %</span> risk controls. Built directly on top of the SMA engine.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'chart' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            OHLC & SMA Chart
          </button>
          <button
            onClick={() => setViewMode('log')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'log' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Trade Log & Exit Reasons
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1 ${
              viewMode === 'raw' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Raw API Response</span>
          </button>
        </div>
      </div>

      {data?.warning_note && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start space-x-2">
          <span className="font-bold shrink-0">ℹ️ Notice:</span>
          <span>{data.warning_note}</span>
        </div>
      )}

      {/* Input Parameters Bar */}
      <form onSubmit={runOptimization} className="varsity-card p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          
          {/* 1. Symbol */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Trading Symbol
            </label>
            <input
              type="text"
              required
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="e.g. NSE:NIFTYBEES"
              className="w-full py-1.5 px-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* 2. From Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              From Date
            </label>
            <input
              type="date"
              required
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full py-1.5 px-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* 3. To Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              To Date
            </label>
            <input
              type="date"
              required
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full py-1.5 px-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* 4. Short SMA */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Short SMA
            </label>
            <input
              type="number"
              required
              min="2"
              max="100"
              value={shortSma}
              onChange={(e) => setShortSma(e.target.value)}
              className="w-full py-1.5 px-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 font-mono text-blue-700 font-bold"
            />
          </div>

          {/* 5. Long SMA */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Long SMA
            </label>
            <input
              type="number"
              required
              min="5"
              max="200"
              value={longSma}
              onChange={(e) => setLongSma(e.target.value)}
              className="w-full py-1.5 px-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 font-mono text-amber-700 font-bold"
            />
          </div>

          {/* 6. Stop Loss % */}
          <div>
            <label className="block text-[11px] font-semibold text-red-600 uppercase mb-1 flex items-center gap-1">
              Stop-Loss %
            </label>
            <input
              type="number"
              required
              step="0.1"
              min="0"
              max="50"
              value={stopLossPct}
              onChange={(e) => setStopLossPct(e.target.value)}
              className="w-full py-1.5 px-2 border border-red-300 rounded text-xs focus:ring-1 focus:ring-red-500 font-mono text-red-700 font-bold bg-red-50/40"
            />
          </div>

          {/* 7. Take Profit % */}
          <div>
            <label className="block text-[11px] font-semibold text-emerald-600 uppercase mb-1 flex items-center gap-1">
              Take-Profit %
            </label>
            <input
              type="number"
              required
              step="0.1"
              min="0"
              max="100"
              value={takeProfitPct}
              onChange={(e) => setTakeProfitPct(e.target.value)}
              className="w-full py-1.5 px-2 border border-emerald-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 font-mono text-emerald-700 font-bold bg-emerald-50/40"
            />
          </div>

          {/* 8. Initial Capital */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Capital (₹)
            </label>
            <input
              type="number"
              required
              step="1000"
              value={initialCapital}
              onChange={(e) => setInitialCapital(e.target.value)}
              className="w-full py-1.5 px-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            If both Stop-Loss and Take-Profit boundary prices are touched in the same daily candle, Stop-Loss is applied first.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="varsity-btn-primary text-xs py-2 px-5 flex items-center space-x-1.5 shadow-sm"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${loading ? 'animate-spin' : ''}`} />
            <span>Run Optimization</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards Summary */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          
          <div className="varsity-card p-4">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block">Final Value</span>
            <span className="text-xl font-bold font-mono text-slate-900">
              ₹{metrics.final_portfolio_value?.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Start: ₹{metrics.initial_capital?.toLocaleString()}</span>
          </div>

          <div className="varsity-card p-4">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block">Total P&L</span>
            <span className={`text-xl font-bold font-mono ${metrics.total_pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {metrics.total_pnl >= 0 ? '+' : ''}₹{metrics.total_pnl?.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Net Gain/Loss</span>
          </div>

          <div className="varsity-card p-4">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block">Total Return</span>
            <span className={`text-xl font-bold font-mono ${metrics.total_return_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {metrics.total_return_pct >= 0 ? '+' : ''}{metrics.total_return_pct}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">ROI %</span>
          </div>

          <div className="varsity-card p-4">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block">Win Rate</span>
            <span className="text-xl font-bold font-mono text-blue-700">
              {metrics.win_rate}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              {metrics.winning_trades} W / {metrics.losing_trades} L
            </span>
          </div>

          <div className="varsity-card p-4">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block">Exit Reasons</span>
            <div className="flex items-center space-x-1.5 mt-1 text-[11px] font-mono font-bold">
              <span className="text-red-600" title="Stop Loss exits">SL:{riskMeta?.stop_loss_exits || 0}</span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-600" title="Take Profit exits">TP:{riskMeta?.take_profit_exits || 0}</span>
              <span className="text-slate-300">|</span>
              <span className="text-blue-600" title="SMA Crossover exits">SMA:{riskMeta?.sma_cross_exits || 0}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Risk Breakdown</span>
          </div>

          <div className="varsity-card p-4">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block">Current Position</span>
            <span className={`varsity-badge ${metrics.position_status === 'LONG' ? 'varsity-badge-green' : 'varsity-badge-blue'} text-xs mt-1`}>
              {metrics.position_status}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Portfolio Allocation</span>
          </div>

        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="varsity-card p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-sm font-medium">Running Strategy Risk Optimization...</p>
        </div>
      ) : viewMode === 'chart' ? (
        <SmaChart
          candles={data?.candles || []}
          buyMarkers={data?.buy_markers || []}
          sellMarkers={data?.sell_markers || []}
          shortSmaPeriod={shortSma}
          longSmaPeriod={longSma}
        />
      ) : viewMode === 'log' ? (
        <div className="varsity-card overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 flex justify-between items-center">
            <span>Trade Execution & Exit Reasons ({data?.trade_log?.length || 0} Trades)</span>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="text-red-600 font-medium">Stop Loss: {riskMeta?.stop_loss_exits || 0}</span>
              <span className="text-emerald-600 font-medium">Take Profit: {riskMeta?.take_profit_exits || 0}</span>
              <span className="text-blue-600 font-medium">SMA Cross: {riskMeta?.sma_cross_exits || 0}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Buy Date</th>
                  <th className="p-3">Buy Price</th>
                  <th className="p-3">Exit Date</th>
                  <th className="p-3">Exit Price</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Trade P&L (₹)</th>
                  <th className="p-3">Return %</th>
                  <th className="p-3">Exit Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {data?.trade_log && data.trade_log.length > 0 ? (
                  data.trade_log.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-sans text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-900 font-sans">{t.entry_date}</td>
                      <td className="p-3">₹{t.entry_price}</td>
                      <td className="p-3 font-semibold text-slate-900 font-sans">{t.exit_date}</td>
                      <td className="p-3">₹{t.exit_price}</td>
                      <td className="p-3">{t.quantity}</td>
                      <td className={`p-3 font-semibold ${t.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.pnl >= 0 ? '+' : ''}₹{t.pnl?.toLocaleString()}
                      </td>
                      <td className={`p-3 font-semibold ${t.pnl_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.pnl_pct >= 0 ? '+' : ''}{t.pnl_pct}%
                      </td>
                      <td className="p-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          t.exit_reason === 'Stop Loss'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : t.exit_reason === 'Take Profit'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {t.exit_reason}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 font-sans">
                      No completed trades found during this period with selected risk controls.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <JsonView data={data?.raw_response || {}} title="Formatted Optimization Response (POST /api/backtest/optimization)" />
      )}

    </div>
  );
}
