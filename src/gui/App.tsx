// Main React application entry point

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { GetStarted } from './pages/GetStarted';
import { Dashboard } from './pages/Dashboard';
import { Trading } from './pages/Trading';
import { Portfolio } from './pages/Portfolio';
import { Trades } from './pages/Trades';
import { Backtesting } from './pages/Backtesting';
import { Settings } from './pages/Settings';
import { Wallet } from './pages/Wallet';
import { FundManagement } from './pages/FundManagement';
import { walletService } from '../wallet/WalletService';
import { AtomTransition } from './components/common/AtomTransition';
import './styles/global.css';

// Inner component to access location for transitions
const AppRoutes: React.FC<{ hasStarted: boolean; onStarted: () => void }> = ({
  hasStarted,
  onStarted,
}) => {
  const location = useLocation();
  const [showTransition, setShowTransition] = useState(false);
  const [prevPath, setPrevPath] = useState(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPath) {
      setShowTransition(true);
      setPrevPath(location.pathname);
    }
  }, [location.pathname, prevPath]);

  return (
    <>
      <AtomTransition
        show={showTransition}
        onComplete={() => setShowTransition(false)}
        duration={1000}
      />
      <Routes>
        <Route
          path="/get-started"
          element={
            hasStarted ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <GetStarted onStarted={onStarted} />
            )
          }
        />
        <Route
          path="/*"
          element={
            hasStarted ? (
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/trading" element={<Trading />} />
                  <Route path="/portfolio" element={<Portfolio />} />
                  <Route path="/trades" element={<Trades />} />
                  <Route path="/backtesting" element={<Backtesting />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/funds" element={<FundManagement />} />
                </Routes>
              </MainLayout>
            ) : (
              <Navigate to="/get-started" replace />
            )
          }
        />
      </Routes>
    </>
  );
};

function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if user has already connected wallet or started
    const checkStatus = () => {
      const wallet = walletService.getCurrentWallet();
      const started = localStorage.getItem('vitaTradingBot-started') === 'true';
      
      if (wallet || started) {
        setHasStarted(true);
      } else {
        setHasStarted(false);
      }
      setIsInitialized(true);
    };

    checkStatus();

    // Listen for sign out event
    const handleSignOut = () => {
      setHasStarted(false);
      // Navigate will happen after reload
    };

    // Listen for storage changes (for sign out from other tabs)
    const handleStorageChange = () => {
      checkStatus();
    };

    window.addEventListener('signout', handleSignOut);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('signout', handleSignOut);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleStarted = () => {
    setHasStarted(true);
    localStorage.setItem('vitaTradingBot-started', 'true');
  };

  if (!isInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <AtomTransition show={true} message="Loading..." />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes hasStarted={hasStarted} onStarted={handleStarted} />
    </BrowserRouter>
  );
}

export default App;

