import React, { useState } from 'react';
import { Key, Lock, ShieldCheck, ArrowRight, BookOpen, AlertCircle, Zap, CheckCircle2 } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [requestToken, setRequestToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey.trim(),
          api_secret: apiSecret.trim(),
          request_token: requestToken.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      onLoginSuccess(data.profile, data.is_demo);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: 'demo',
          api_secret: 'demo',
          request_token: 'demo'
        })
      });
      const data = await res.json();
      onLoginSuccess(data.profile, true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-slate-200">
        
        {/* Left Hero Panel */}
        <div className="md:col-span-5 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 p-8 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md border border-blue-400">
                K
              </div>
              <div>
                <h1 className="font-bold text-xl tracking-tight leading-tight">Zerodha Kite</h1>
                <p className="text-xs text-blue-200 font-medium">Varsity Learning Dashboard</p>
              </div>
            </div>

            <div className="space-y-4 my-8">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Local Backend Session</h3>
                  <p className="text-xs text-blue-200">Access tokens generated via Kite Connect Python SDK are securely saved server-side in session.json.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Zero Token Exposure</h3>
                  <p className="text-xs text-blue-200">API secrets and request tokens are immediately discarded and never saved or exposed to the browser.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Full Module Explorer</h3>
                  <p className="text-xs text-blue-200">Explore User Profile, Instruments, Quote Snapshots, Live WebSocket Ticks, and Historical OHLCV Candles.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-blue-800/80 text-xs text-blue-300 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Built for Zerodha Varsity Learning</span>
          </div>
        </div>

        {/* Right Login Card */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Kite Connect Login</h2>
            <p className="text-sm text-slate-500 mt-1">Enter your API credentials to establish a local backend session.</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                API Key
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 9y3x8abc123"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                API Secret
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="e.g. xyz9876543210secret"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Request Token
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. req_token_abc123"
                  value={requestToken}
                  onChange={(e) => setRequestToken(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Request tokens are generated during Zerodha login redirect.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full varsity-btn-primary flex items-center justify-center space-x-2 py-2.5 font-semibold text-sm mt-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating with Kite Connect...</span>
              ) : (
                <>
                  <span>Generate Session & Enter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Sandbox Option */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500 mb-3">Testing without active live API credentials?</p>
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2 px-4 rounded-md border border-slate-300 flex items-center justify-center space-x-2 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Explore Dashboard in Demo Sandbox Mode</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
