import React, { useState, useEffect } from 'react';
import { Layers, Search, RefreshCw, Code, AlertCircle, Plus, X } from 'lucide-react';
import JsonView from '../components/JsonView';

const DEFAULT_SYMBOLS = ['NSE:INFY', 'NSE:RELIANCE', 'NSE:HDFCBANK', 'NFO:NIFTY26FUT'];

export default function SnapshotTab() {
  const [symbols, setSymbols] = useState(DEFAULT_SYMBOLS);
  const [inputSymbol, setInputSymbol] = useState('');
  const [snapshotData, setSnapshotData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'raw'

  const fetchSnapshot = async (symList = symbols) => {
    if (symList.length === 0) {
      setSnapshotData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: symList })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to fetch snapshot quote data.');
      }
      setSnapshotData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshot(symbols);
  }, []);

  const handleAddSymbol = (e) => {
    e.preventDefault();
    if (!inputSymbol.trim()) return;
    const formatted = inputSymbol.trim().toUpperCase();
    if (!symbols.includes(formatted)) {
      const newSymbols = [...symbols, formatted];
      setSymbols(newSymbols);
      fetchSnapshot(newSymbols);
    }
    setInputSymbol('');
  };

  const handleRemoveSymbol = (symToRemove) => {
    const newSymbols = symbols.filter(s => s !== symToRemove);
    setSymbols(newSymbols);
    fetchSnapshot(newSymbols);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & View Switcher */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Market Snapshot</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fetch real-time market quote snapshots via <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">kite.quote()</code>.
          </p>
        </div>

        {/* View Toggle & Refresh */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchSnapshot(symbols)}
            disabled={loading}
            className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-md border border-slate-200 font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Fetch Fresh Snapshot</span>
          </button>

          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'table' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Clean Data View
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1 ${
                viewMode === 'raw' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Formatted API Response</span>
            </button>
          </div>
        </div>
      </div>

      {/* Symbol Selection Bar */}
      <div className="varsity-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Selected Instruments ({symbols.length})
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {symbols.map((sym) => (
            <span
              key={sym}
              className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-md text-xs font-mono font-semibold"
            >
              <span>{sym}</span>
              <button
                onClick={() => handleRemoveSymbol(sym)}
                className="hover:bg-blue-200 p-0.5 rounded text-blue-600 hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <form onSubmit={handleAddSymbol} className="flex gap-2 pt-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="e.g. NSE:TATAMOTORS or NFO:NIFTY26JUL24500CE"
              value={inputSymbol}
              onChange={(e) => setInputSymbol(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="varsity-btn-primary text-xs py-1.5 px-3 flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Symbol</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Content Rendering */}
      {loading ? (
        <div className="varsity-card p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-sm font-medium">Fetching Quote Snapshot from Backend...</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="grid grid-cols-1 gap-6">
          {snapshotData?.quotes && Object.keys(snapshotData.quotes).length > 0 ? (
            Object.entries(snapshotData.quotes).map(([sym, q]) => (
              <div key={sym} className="varsity-card p-5">
                <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{sym}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Token: {q.instrument_token} • Updated: {q.timestamp}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-slate-900">
                      ₹{q.last_price?.toLocaleString()}
                    </div>
                    <div className={`text-xs font-semibold font-mono ${q.net_change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {q.net_change >= 0 ? '+' : ''}{q.net_change} ({q.change_percent ? (q.change_percent >= 0 ? '+' : '') + q.change_percent + '%' : ''})
                    </div>
                  </div>
                </div>

                {/* OHLCV Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-4 text-xs font-mono">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-[11px] text-slate-400 font-sans block">Open</span>
                    <span className="font-semibold text-slate-800">₹{q.open}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-[11px] text-slate-400 font-sans block">High</span>
                    <span className="font-semibold text-emerald-600">₹{q.high}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-[11px] text-slate-400 font-sans block">Low</span>
                    <span className="font-semibold text-red-600">₹{q.low}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-[11px] text-slate-400 font-sans block">Close</span>
                    <span className="font-semibold text-slate-800">₹{q.close}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-slate-400 font-sans block">Volume</span>
                    <span className="font-semibold text-slate-800">{q.volume?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Market Depth Table (Top 5 Bids / Asks) */}
                {q.depth && (q.depth.buy || q.depth.sell) && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <h4 className="text-[11px] font-semibold uppercase text-slate-400 mb-2">Market Depth (Best 5)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                      
                      {/* Bids */}
                      <div>
                        <div className="text-[11px] font-sans font-semibold text-emerald-700 mb-1">Bids (Buy Orders)</div>
                        <table className="w-full text-left bg-emerald-50/40 rounded border border-emerald-100">
                          <thead className="text-[10px] text-emerald-800 border-b border-emerald-100">
                            <tr><th className="p-1">Price</th><th className="p-1">Qty</th><th className="p-1">Orders</th></tr>
                          </thead>
                          <tbody>
                            {q.depth.buy?.map((b, idx) => (
                              <tr key={idx} className="border-b border-emerald-100/50">
                                <td className="p-1 text-emerald-700 font-semibold">₹{b.price}</td>
                                <td className="p-1 text-slate-700">{b.quantity}</td>
                                <td className="p-1 text-slate-500">{b.orders}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Asks */}
                      <div>
                        <div className="text-[11px] font-sans font-semibold text-red-700 mb-1">Asks (Sell Orders)</div>
                        <table className="w-full text-left bg-red-50/40 rounded border border-red-100">
                          <thead className="text-[10px] text-red-800 border-b border-red-100">
                            <tr><th className="p-1">Price</th><th className="p-1">Qty</th><th className="p-1">Orders</th></tr>
                          </thead>
                          <tbody>
                            {q.depth.sell?.map((s, idx) => (
                              <tr key={idx} className="border-b border-red-100/50">
                                <td className="p-1 text-red-700 font-semibold">₹{s.price}</td>
                                <td className="p-1 text-slate-700">{s.quantity}</td>
                                <td className="p-1 text-slate-500">{s.orders}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="varsity-card p-12 text-center text-slate-400">
              No snapshot data available. Add symbols above to query quotes.
            </div>
          )}
        </div>
      ) : (
        <JsonView data={snapshotData?.raw_response || {}} title="Formatted API Response (kite.quote())" />
      )}

    </div>
  );
}
