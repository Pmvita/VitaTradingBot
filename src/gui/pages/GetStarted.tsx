// Get Started screen with animated atom icon

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AtomIcon } from '../components/common/AtomIcon';
import { WalletConnectionModal } from '../components/wallet/WalletConnectionModal';
import './GetStarted.css';

interface GetStartedProps {
  onStarted?: () => void;
}

export const GetStarted: React.FC<GetStartedProps> = ({ onStarted }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const navigate = useNavigate();

  const handleAtomClick = () => {
    setShowOptions(true);
  };

  const handlePaperTrading = async () => {
    // Initialize paper trading mode with $1M USDT
    localStorage.setItem('trading-mode', 'paper');
    
    // Initialize paper trading executor with $1,000,000 USDT
    const { paperTradingExecutor } = await import('../../bot/execution/PaperTradingExecutor');
    const { PAPER_TRADING_INITIAL_CAPITAL } = await import('../../constants');
    paperTradingExecutor.initialize(PAPER_TRADING_INITIAL_CAPITAL, 'USDT');
    
    if (onStarted) {
      onStarted();
    }
    navigate('/dashboard');
  };

  const handleWalletConnect = () => {
    setShowWalletModal(true);
  };

  const handleWalletConnected = () => {
    setShowWalletModal(false);
    localStorage.setItem('trading-mode', 'live');
    if (onStarted) {
      onStarted();
    }
    navigate('/dashboard');
  };

  return (
    <div className="get-started">
      <div className="get-started-container">
        {!showOptions ? (
          <>
            <div className="get-started-header">
              <h1 className="app-title">VitaTradingBot</h1>
              <p className="app-subtitle">Professional automated trading platform</p>
            </div>

            <div className="atom-container" onClick={handleAtomClick}>
              <AtomIcon />
              <p className="click-hint">Click to begin</p>
            </div>
          </>
        ) : (
          <div className="options-container">
            <h2>Choose Your Mode</h2>
            <div className="options-grid">
              <div className="option-card" onClick={handleWalletConnect}>
                <div className="option-icon wallet-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </div>
                <h3>Connect Wallet</h3>
                <p>Connect your crypto wallet to start live trading</p>
                <div className="option-badge">Live Trading</div>
              </div>

              <div className="option-card" onClick={handlePaperTrading}>
                <div className="option-icon paper-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h3>Paper Trading</h3>
                <p>Practice with virtual funds - risk-free</p>
                <div className="option-badge">Demo Mode</div>
              </div>
            </div>

            <button
              className="back-button"
              onClick={() => setShowOptions(false)}
            >
              ← Back
            </button>
          </div>
        )}
      </div>

      {showWalletModal && (
        <WalletConnectionModal
          onClose={() => setShowWalletModal(false)}
          onConnected={handleWalletConnected}
        />
      )}
    </div>
  );
};

