import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

import UserTab from '../tabs/UserTab';
import InstrumentsTab from '../tabs/InstrumentsTab';
import SnapshotTab from '../tabs/SnapshotTab';
import RealtimeTab from '../tabs/RealtimeTab';
import HistoricalTab from '../tabs/HistoricalTab';
import SmaBacktestTab from '../tabs/SmaBacktestTab';
import OptimizationTab from '../tabs/OptimizationTab';

export default function Dashboard({ userProfile, isDemo, onLogout }) {
  const [activeTab, setActiveTab] = useState('user');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'user':
        return <UserTab />;
      case 'instruments':
        return <InstrumentsTab />;
      case 'snapshot':
        return <SnapshotTab />;
      case 'realtime':
        return <RealtimeTab />;
      case 'historical':
        return <HistoricalTab />;
      case 'sma_backtest':
        return <SmaBacktestTab />;
      case 'optimization':
        return <OptimizationTab />;
      default:
        return <UserTab />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar userProfile={userProfile} isDemo={isDemo} onLogout={onLogout} />
      
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
}
