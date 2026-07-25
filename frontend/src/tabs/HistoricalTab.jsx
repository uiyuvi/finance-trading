import React, { useState, useEffect } from 'react';
import { LineChart, Calendar, Clock, RefreshCw, Code, CheckSquare, Square } from 'lucide-react';
import CandlestickChart from '../components/CandlestickChart';
import JsonView from '../components/JsonView';

const SAMPLE_INSTRUMENTS = [
  { token: 256265, label: 'NSE:INFY (Infosys)' },
  { token: 738561, label: 'NSE:RELIANCE (Reliance Ind)' },
  { token: 341249, label: 'NSE:HDFCBANK (HDFC Bank)' },
  { token: 8958210, label: 'NFO:NIFTY26FUT (Nifty Futures)' }
];

export default function HistoricalTab() {
  const [instrumentToken, setInstrumentToken] = useState(256265);
  const [interval, setInterval] = useState('day');
  const [fromDate, setFromDate] = useState('2026-06-01');
  const [toDate, setToDate] = useState('2026-07-25');
  const [continuous, setContinuous] = useState(false);
  const [oi, setOi] = useState(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'table' | 'raw'

  const fetchHistorical = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/historical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instrument_token: parseInt(instrumentToken),
          from_date: fromDate,
          to_date: toDate,
          interval: interval,
          continuous: continuous,
          oi: oi
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || 'Failed to fetch historical candles.');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorical();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <LineChart className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Historical Candles & Chart</h2>
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
            Historical OHLCV candle data retrieved via <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">kite.historical_data()</code>.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'chart' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            OHLCV Chart
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'table' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 10 Rows Table
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1 ${
              viewMode === 'raw' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Full API Response</span>
          </button>
        </div>
      </div>

      {data?.warning_note && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start space-x-2">
          <span className="font-bold shrink-0">ℹ️ Notice:</span>
          <span>{data.warning_note}</span>
        </div>
      )}

      {/* Control Form Bar */}
      <div className="varsity-card p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* 1. Instrument Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Select Instrument
            </label>
            <select
              value={instrumentToken}
              onChange={(e) => setInstrumentToken(e.target.value)}
              className="w-full py-2 px-3 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-blue-500"
            >
              {SAMPLE_INSTRUMENTS.map((inst) => (
                <option key={inst.token} value={inst.token}>{inst.label}</option>
              ))}
            </select>
          </div>

          {/* 2. Interval Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Time Interval
            </label>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="w-full py-2 px-3 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-blue-500 font-mono"
            >
              <option value="minute">1 Minute</option>
              <option value="3minute">3 Minute</option>
              <option value="5minute">5 Minute</option>
              <option value="15minute">15 Minute</option>
              <option value="60minute">60 Minute</option>
              <option value="day">Day</option>
            </select>
          </div>

          {/* 3. From Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full py-1.5 px-3 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* 4. To Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full py-1.5 px-3 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>

        </div>

        {/* Checkbox Options & Fetch Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={continuous}
                onChange={(e) => setContinuous(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium">Continuous Mode (Futures)</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={oi}
                onChange={(e) => setOi(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium">Include Open Interest (OI)</span>
            </label>
          </div>

          <button
            onClick={fetchHistorical}
            disabled={loading}
            className="varsity-btn-primary text-xs py-2 px-4 flex items-center space-x-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Fetch Historical Candles</span>
          </button>
        </div>

      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Main View Area */}
      {loading ? (
        <div className="varsity-card p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-sm font-medium">Fetching Historical Candles from Kite API...</p>
        </div>
      ) : viewMode === 'chart' ? (
        <CandlestickChart candles={data?.candles || []} />
      ) : viewMode === 'table' ? (
        <div className="varsity-card overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 flex justify-between">
            <span>Last 10 Historical Candles Table</span>
            <span className="text-slate-400 font-mono">Total Candles: {data?.total_candles}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Timestamp / Date</th>
                  <th className="p-3">Open</th>
                  <th className="p-3">High</th>
                  <th className="p-3">Low</th>
                  <th className="p-3">Close</th>
                  <th className="p-3">Volume</th>
                  {oi && <th className="p-3">Open Interest</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {data?.last_10_rows?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900 font-sans">{row.date}</td>
                    <td className="p-3">₹{row.open}</td>
                    <td className="p-3 text-emerald-600 font-semibold">₹{row.high}</td>
                    <td className="p-3 text-red-600 font-semibold">₹{row.low}</td>
                    <td className="p-3 font-semibold">₹{row.close}</td>
                    <td className="p-3">{row.volume ? row.volume.toLocaleString() : '-'}</td>
                    {oi && <td className="p-3 text-blue-700">{row.oi ? row.oi.toLocaleString() : '-'}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <JsonView data={data?.raw_response || {}} title="Full Formatted API Response (kite.historical_data())" />
      )}

    </div>
  );
}
