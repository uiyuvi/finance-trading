import React, { useState, useEffect } from 'react';
import { User, Shield, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

export default function UserTab() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/profile');
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to fetch user profile.');
      }
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="varsity-card p-12 text-center text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
        <p className="text-sm font-medium">Fetching User Profile from Kite API...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="varsity-card p-6 bg-red-50 border-red-200 text-red-700 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-sm">Error Loading Profile</h3>
          <p className="text-xs mt-1">{error}</p>
          <button onClick={fetchProfile} className="mt-3 text-xs bg-red-600 text-white px-3 py-1 rounded font-medium">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">User Profile</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Displaying user account details retrieved directly via <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">kite.profile()</code>.
          </p>
        </div>
        <button
          onClick={fetchProfile}
          className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-md border border-slate-200 font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Profile</span>
        </button>
      </div>

      {/* Grid of the exact 4 required fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. User Name */}
        <div className="varsity-card p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            User Name
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {profile?.user_name || 'N/A'}
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Authenticated Zerodha Account</span>
          </div>
        </div>

        {/* 2. User ID */}
        <div className="varsity-card p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            User ID
          </div>
          <div className="text-2xl font-mono font-bold text-blue-700">
            {profile?.user_id || 'N/A'}
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-blue-500" />
            <span>Unique Client Code</span>
          </div>
        </div>

        {/* 3. Products */}
        <div className="varsity-card p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Enabled Products
          </div>
          <div className="flex flex-wrap gap-2">
            {profile?.products && profile.products.length > 0 ? (
              profile.products.map((prod) => (
                <span key={prod} className="varsity-badge varsity-badge-blue text-xs font-mono">
                  {prod}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">None enabled</span>
            )}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Includes product types allowed for order placement (e.g. CNC, MIS, NRML, CO, BO).
          </p>
        </div>

        {/* 4. Exchanges */}
        <div className="varsity-card p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Enabled Exchanges
          </div>
          <div className="flex flex-wrap gap-2">
            {profile?.exchanges && profile.exchanges.length > 0 ? (
              profile.exchanges.map((ex) => (
                <span key={ex} className="varsity-badge varsity-badge-green text-xs font-mono">
                  {ex}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">None enabled</span>
            )}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Market exchanges permitted for trading (e.g. NSE, BSE, NFO, BFO, MCX, CDS).
          </p>
        </div>

      </div>

    </div>
  );
}
