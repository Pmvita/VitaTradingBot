// Header component

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings, Wallet, LogOut, ChevronDown } from 'lucide-react';
import { walletService } from '../../wallet/WalletService';
import { NotificationCenter } from '../components/notifications/NotificationCenter';
import './Header.css';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const walletMenuRef = useRef<HTMLDivElement>(null);
  const wallet = walletService.getCurrentWallet();
  
  // Check if in paper trading mode
  const tradingMode = localStorage.getItem('trading-mode');
  const isPaperTrading = tradingMode === 'paper';
  
  // Show wallet status only if in live trading mode and wallet is connected
  const showWalletStatus = !isPaperTrading && wallet;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (walletMenuRef.current && !walletMenuRef.current.contains(event.target as Node)) {
        setShowWalletMenu(false);
      }
    };

    if (showWalletMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showWalletMenu]);

  const handleSignOut = () => {
    setShowWalletMenu(false);
    
    // Clear all stored data FIRST
    localStorage.removeItem('vitaTradingBot-started');
    localStorage.removeItem('trading-mode');
    
    // Disconnect wallet if connected
    if (wallet) {
      walletService.disconnect();
    }
    
    // Navigate to get-started, then reload to reset all state
    // This ensures we're on the right route before reload
    navigate('/get-started', { replace: true });
    
    // Small delay to ensure navigation happens, then reload
    setTimeout(() => {
      window.location.reload();
    }, 50);
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="app-logo">VitaTradingBot</h1>
      </div>
      <div className="header-center">
        {showWalletStatus ? (
          <div 
            className={`wallet-status connected clickable ${showWalletMenu ? 'active' : ''}`}
            onClick={() => setShowWalletMenu(!showWalletMenu)}
          >
            <Wallet size={16} />
            <span>{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
            <span className="network-badge">{wallet.network}</span>
            <ChevronDown size={14} className="chevron" />
            {showWalletMenu && (
              <div className="wallet-menu" ref={walletMenuRef}>
                <button className="wallet-menu-item" onClick={handleSignOut}>
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div 
            className={`wallet-status disconnected clickable ${showWalletMenu ? 'active' : ''}`}
            onClick={() => setShowWalletMenu(!showWalletMenu)}
          >
            <Wallet size={16} />
            <span>{isPaperTrading ? 'Paper Trading Mode' : 'Not Connected'}</span>
            {isPaperTrading && (
              <span className="network-badge paper">Demo</span>
            )}
            <ChevronDown size={14} className="chevron" />
            {showWalletMenu && (
              <div className="wallet-menu" ref={walletMenuRef}>
                <button className="wallet-menu-item" onClick={handleSignOut}>
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="header-right">
        <button
          className="icon-button"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell size={20} />
          <span className="badge">3</span>
        </button>
        <button 
          className="icon-button"
          onClick={() => navigate('/settings')}
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>
      {showNotifications && (
        <NotificationCenter onClose={() => setShowNotifications(false)} />
      )}
    </header>
  );
};

