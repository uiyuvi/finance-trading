import React from 'react';
import { BookOpen, LogOut, ShieldCheck, Zap } from 'lucide-react';

export default function Navbar({ userProfile, isDemo, onLogout }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            K
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 text-lg tracking-tight">Kite Connect</span>
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Varsity Module
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Interactive Learning Dashboard</p>
          </div>
        </div>

        {/* Right User & Logout Info */}
        <div className="flex items-center space-x-4">
          {isDemo ? (
            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs px-3 py-1 rounded-md font-semibold flex items-center gap-1.5 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-amber-600 fill-current" />
              <span>Sandbox Mode (Simulated Data)</span>
            </span>
          ) : (
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-3 py-1 rounded-md font-semibold flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>🟢 Live Mode (Zerodha API)</span>
            </span>
          )}

          {userProfile && (
            <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{userProfile.user_name}</p>
                <p className="text-xs text-slate-500 font-mono">ID: {userProfile.user_id}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 text-blue-700 flex items-center justify-center font-bold border border-slate-200 text-sm">
                {userProfile.user_name ? userProfile.user_name.charAt(0) : 'U'}
              </div>
            </div>
          )}

          <button
            onClick={onLogout}
            className="flex items-center space-x-1 text-slate-600 hover:text-red-600 hover:bg-red-50 text-sm font-medium px-3 py-1.5 rounded-md border border-slate-200 transition-colors"
            title="Log out session"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

      </div>
    </header>
  );
}
