import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState({ authenticated: false, isDemo: false, profile: null });
  const [checkingSession, setCheckingSession] = useState(true);

  // Check saved backend session on startup
  useEffect(() => {
    const checkBackendSession = async () => {
      try {
        const res = await fetch('/api/session');
        const data = await res.json();
        if (data.authenticated) {
          setSession({
            authenticated: true,
            isDemo: data.is_demo || false,
            profile: data.profile
          });
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setCheckingSession(false);
      }
    };

    checkBackendSession();
  }, []);

  const handleLoginSuccess = (profile, isDemo = false) => {
    setSession({
      authenticated: true,
      isDemo: isDemo,
      profile: profile
    });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setSession({ authenticated: false, isDemo: false, profile: null });
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-slate-200">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-slate-800">Checking Zerodha Kite Session...</h2>
          <p className="text-xs text-slate-500 mt-1">Verifying backend session status in session.json</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {session.authenticated ? (
        <Dashboard
          userProfile={session.profile}
          isDemo={session.isDemo}
          onLogout={handleLogout}
        />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}
