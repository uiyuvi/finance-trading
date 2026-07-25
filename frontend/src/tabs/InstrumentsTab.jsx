import React, { useState, useEffect } from 'react';
import { Search, Filter, Database, Code, RefreshCw } from 'lucide-react';
import JsonView from '../components/JsonView';

export default function InstrumentsTab() {
  const [exchange, setExchange] = useState('ALL');
  const [instrumentType, setInstrumentType] = useState('ALL');
  const [underlying, setUnderlying] = useState('ALL');
  const [expiry, setExpiry] = useState('ALL');
  const [search, setSearch] = useState('');
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'raw'

  const fetchInstruments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (exchange !== 'ALL') params.append('exchange', exchange);
      if (instrumentType !== 'ALL') params.append('instrument_type', instrumentType);
      if (underlying !== 'ALL') params.append('underlying', underlying);
      if (expiry !== 'ALL') params.append('expiry', expiry);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/instruments?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstruments();
  }, [exchange, instrumentType, underlying, expiry, search]);

  const isDerivativeSelected = ['FUT', 'CE', 'PE'].includes(instrumentType);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & View Switcher */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Instruments Explorer</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Searchable universe loaded via <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">kite.instruments()</code> with combined derivatives mapping.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'table' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clean Table View
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

      {/* Filter Bar */}
      <div className="varsity-card p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          
          {/* 1. Search Stock/Symbol */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Symbol / Name
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="e.g. INFY, NIFTY"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 2. Exchange Filter (combining NFO under NSE, BFO under BSE) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Exchange
            </label>
            <select
              value={exchange}
              onChange={(e) => setExchange(e.target.value)}
              className="w-full py-1.5 px-2 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Exchanges</option>
              <option value="NSE">NSE (Incl. NFO Derivatives)</option>
              <option value="BSE">BSE (Incl. BFO Derivatives)</option>
              <option value="MCX">MCX (Commodities)</option>
            </select>
          </div>

          {/* 3. Instrument Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Instrument Type
            </label>
            <select
              value={instrumentType}
              onChange={(e) => setInstrumentType(e.target.value)}
              className="w-full py-1.5 px-2 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="EQ">Equity (EQ)</option>
              <option value="FUT">Futures (FUT)</option>
              <option value="CE">Call Option (CE)</option>
              <option value="PE">Put Option (PE)</option>
            </select>
          </div>

          {/* 4. Underlying Dropdown (focused on F&O when derivatives selected) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              F&O Underlying
            </label>
            <select
              value={underlying}
              onChange={(e) => setUnderlying(e.target.value)}
              className={`w-full py-1.5 px-2 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-blue-500 ${
                isDerivativeSelected ? 'border-blue-400 bg-blue-50/30' : ''
              }`}
            >
              <option value="ALL">All Underlyings</option>
              {data?.fo_underlyings?.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* 5. Expiry Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Expiry Date
            </label>
            <select
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full py-1.5 px-2 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Expiries</option>
              {data?.expiries?.map((ex) => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Counter Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Showing <span className="font-semibold text-slate-800">{data?.showing_count || 0}</span> of <span className="font-semibold text-slate-800">{data?.total_count || 0}</span> instruments
          </div>
          {(exchange !== 'ALL' || instrumentType !== 'ALL' || underlying !== 'ALL' || expiry !== 'ALL' || search) && (
            <button
              onClick={() => { setExchange('ALL'); setInstrumentType('ALL'); setUnderlying('ALL'); setExpiry('ALL'); setSearch(''); }}
              className="text-blue-600 hover:underline text-xs"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="varsity-card p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-sm font-medium">Filtering Kite Instruments...</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="varsity-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Trading Symbol</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Exchange</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Instrument Token</th>
                  <th className="p-3">Strike</th>
                  <th className="p-3">Expiry</th>
                  <th className="p-3">Lot Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {data?.instruments?.length > 0 ? (
                  data.instruments.map((inst) => (
                    <tr key={inst.instrument_token} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900 font-sans">{inst.tradingsymbol}</td>
                      <td className="p-3 font-sans text-slate-600">{inst.name}</td>
                      <td className="p-3">
                        <span className={`varsity-badge ${inst.exchange.includes('NFO') || inst.exchange === 'NSE' ? 'varsity-badge-blue' : 'varsity-badge-green'}`}>
                          {inst.exchange}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-blue-700">{inst.instrument_type}</td>
                      <td className="p-3 text-slate-500">{inst.instrument_token}</td>
                      <td className="p-3">{inst.strike ? inst.strike : '-'}</td>
                      <td className="p-3 text-slate-500 font-sans">{inst.expiry ? inst.expiry : '-'}</td>
                      <td className="p-3">{inst.lot_size}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                      No matching instruments found for selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <JsonView data={data?.raw_sample || []} title="Raw API Response Sample (kite.instruments())" />
      )}

    </div>
  );
}
