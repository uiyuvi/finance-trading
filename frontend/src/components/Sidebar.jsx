import React from 'react';
import { User, Database, Layers, Activity, LineChart, TrendingUp, Sliders } from 'lucide-react';

const TABS = [
  { id: 'user', label: 'User', icon: User, desc: 'Profile & Account Capabilities' },
  { id: 'instruments', label: 'Instruments', icon: Database, desc: 'Search & Explorer Universe' },
  { id: 'snapshot', label: 'Snapshot', icon: Layers, desc: 'Multi-Symbol Quotes' },
  { id: 'realtime', label: 'Realtime', icon: Activity, desc: 'WebSocket Live Tick Stream' },
  { id: 'historical', label: 'Historical', icon: LineChart, desc: 'Candlestick Chart & OHLCV' },
  { id: 'sma_backtest', label: 'SMA Backtest', icon: TrendingUp, desc: '10/40 Moving Avg Crossover' },
  { id: 'optimization', label: 'Optimization', icon: Sliders, desc: 'SL & TP Risk Controls' },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div>
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Learning Modules
        </div>
        <nav className="mt-2 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className="text-[11px] text-slate-400 font-normal leading-none mt-0.5">{tab.desc}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-8 p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-xs text-slate-600">
        <p className="font-semibold text-blue-900 mb-1">Zerodha Varsity Context</p>
        <p className="leading-relaxed">
          This dashboard translates Kite Connect SDK methods into transparent UI views for API learning.
        </p>
      </div>
    </aside>
  );
}
