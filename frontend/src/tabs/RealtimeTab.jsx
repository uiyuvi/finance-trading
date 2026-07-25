import React, { useState, useEffect, useRef } from 'react';
import { Activity, Play, Square, Plus, X, Code, Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import JsonView from '../components/JsonView';

const PRESET_INSTRUMENTS = [
  { token: 256265, symbol: 'NSE:INFY' },
  { token: 738561, symbol: 'NSE:RELIANCE' },
  { token: 8958210, symbol: 'NFO:NIFTY26FUT' },
  { token: 341249, symbol: 'NSE:HDFCBANK' }
];

export default function RealtimeTab() {
  const [instruments, setInstruments] = useState(PRESET_INSTRUMENTS);
  const [inputToken, setInputToken] = useState('');
  const [inputSymbol, setInputSymbol] = useState('');
  
  const [streamStatus, setStreamStatus] = useState('disconnected'); // disconnected, connecting, connected, stopped, reconnecting
  const [liveTicks, setLiveTicks] = useState([]);
  const [rawTicks, setRawTicks] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [viewMode, setViewMode] = useState('clean'); // 'clean' | 'raw'

  const wsRef = useRef(null);

  // Initialize WebSocket connection to FastAPI backend
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/realtime/stream`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket Connected to Backend Ticker Endpoint');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'status') {
          setStreamStatus(msg.status);
          if (msg.error) setErrorMsg(msg.error);
        } else if (msg.type === 'ticks') {
          if (msg.ticks && msg.ticks.length > 0) {
            setLiveTicks(msg.ticks.map(t => t.clean));
            setRawTicks(msg.ticks.map(t => t.raw));
          }
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    ws.onerror = (err) => {
      setStreamStatus('reconnecting');
      setErrorMsg('WebSocket connection error');
    };

    ws.onclose = () => {
      setStreamStatus('disconnected');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const handleStartStream = async () => {
    setErrorMsg(null);
    try {
      const res = await fetch('/api/realtime/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruments })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to start stream.');
      setStreamStatus('connected');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleStopStream = async () => {
    try {
      await fetch('/api/realtime/stop', { method: 'POST' });
      setStreamStatus('stopped');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleAddInstrument = (e) => {
    e.preventDefault();
    if (!inputToken || !inputSymbol) return;
    const tokenNum = parseInt(inputToken);
    if (isNaN(tokenNum)) return;

    const formattedSymbol = inputSymbol.trim().toUpperCase();
    if (!instruments.some(i => i.token === tokenNum)) {
      const newInsts = [...instruments, { token: tokenNum, symbol: formattedSymbol }];
      setInstruments(newInsts);
      if (streamStatus === 'connected') {
        fetch('/api/realtime/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instruments: newInsts })
        });
      }
    }
    setInputToken('');
    setInputSymbol('');
  };

  const handleRemoveInstrument = (tokenToRemove) => {
    const newInsts = instruments.filter(i => i.token !== tokenToRemove);
    setInstruments(newInsts);
    if (streamStatus === 'connected') {
      fetch('/api/realtime/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruments: newInsts })
      });
    }
  };

  const renderStatusBadge = () => {
    switch (streamStatus) {
      case 'connected':
        return (
          <span className="varsity-badge varsity-badge-green text-xs flex items-center gap-1.5 px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>WebSocket Streaming Live (KiteTicker)</span>
          </span>
        );
      case 'connecting':
      case 'reconnecting':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
            <span>{streamStatus === 'connecting' ? 'Connecting Stream...' : 'Reconnecting...'}</span>
          </span>
        );
      case 'stopped':
        return (
          <span className="bg-slate-100 text-slate-700 border border-slate-300 text-xs flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold">
            <Square className="w-3 h-3 text-slate-500" />
            <span>Stream Stopped</span>
          </span>
        );
      default:
        return (
          <span className="varsity-badge varsity-badge-red text-xs flex items-center gap-1.5 px-3 py-1">
            <WifiOff className="w-3 h-3" />
            <span>Disconnected</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Realtime WebSocket Stream</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Live tick stream powered by backend <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">KiteTicker</code> WebSocket.
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center space-x-3">
          {renderStatusBadge()}
        </div>
      </div>

      {/* Controller Card */}
      <div className="varsity-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            {streamStatus === 'connected' ? (
              <button
                onClick={handleStopStream}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2 rounded-md flex items-center space-x-1.5 shadow-sm transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Stream</span>
              </button>
            ) : (
              <button
                onClick={handleStartStream}
                className="varsity-btn-primary text-xs px-4 py-2 flex items-center space-x-1.5 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Stream</span>
              </button>
            )}

            <span className="text-xs text-slate-500">
              Subscribed to <strong className="text-slate-800 font-mono">{instruments.length}</strong> instruments
            </span>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('clean')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'clean' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Clean Tick View
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center space-x-1 ${
                viewMode === 'raw' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Raw Tick Response</span>
            </button>
          </div>
        </div>

        {/* Instruments list */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-2">
            Active Subscriptions
          </label>
          <div className="flex flex-wrap gap-2">
            {instruments.map((inst) => (
              <span
                key={inst.token}
                className="inline-flex items-center space-x-2 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-md text-xs font-mono"
              >
                <span className="font-semibold text-slate-800">{inst.symbol}</span>
                <span className="text-slate-400 text-[10px]">({inst.token})</span>
                <button
                  onClick={() => handleRemoveInstrument(inst.token)}
                  className="hover:bg-slate-200 p-0.5 rounded text-slate-500 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Add Instrument Form */}
        <form onSubmit={handleAddInstrument} className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <input
            type="text"
            placeholder="Symbol (e.g. NSE:TCS)"
            value={inputSymbol}
            onChange={(e) => setInputSymbol(e.target.value)}
            className="py-1.5 px-3 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 w-44"
          />
          <input
            type="number"
            placeholder="Token (e.g. 3861249)"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            className="py-1.5 px-3 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 w-40 font-mono"
          />
          <button
            type="submit"
            className="bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs px-3 py-1.5 rounded flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Instrument</span>
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Ticks Stream Output */}
      {viewMode === 'clean' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {liveTicks.length > 0 ? (
            liveTicks.map((tick) => (
              <div key={tick.instrument_token} className="varsity-card p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm">{tick.tradingsymbol}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{tick.timestamp}</span>
                </div>
                
                <div className="text-xl font-bold font-mono text-slate-900">
                  ₹{tick.last_price?.toFixed(2)}
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs font-mono">
                  <span className={`font-semibold ${tick.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {tick.change >= 0 ? '+' : ''}{tick.change} ({tick.change_percent}%)
                  </span>
                  <span className="text-slate-400 font-sans text-[11px]">Vol: {tick.volume?.toLocaleString()}</span>
                </div>

                <div className="mt-2 text-[10px] text-slate-400 font-mono flex justify-between">
                  <span>Last Qty: {tick.last_quantity}</span>
                  <span>Token: {tick.instrument_token}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full varsity-card p-12 text-center text-slate-400">
              {streamStatus === 'connected'
                ? 'Waiting for incoming ticks...'
                : 'Stream is offline. Click "Start Stream" above to connect.'}
            </div>
          )}
        </div>
      ) : (
        <JsonView data={rawTicks} title="Live Raw Tick Payload (KiteTicker)" />
      )}

    </div>
  );
}
