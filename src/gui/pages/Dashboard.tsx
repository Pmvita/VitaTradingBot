// Main dashboard page with real-time P&L display

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tradingBot } from '../../bot/TradingBot';
import { paperTradingExecutor } from '../../bot/execution/PaperTradingExecutor';
import { BotState, CurrencyBalance } from '../../types';
import { PnLDisplay } from '../components/trading/PnLDisplay';
import { PortfolioSummary } from '../components/portfolio/PortfolioSummary';
import { PositionList } from '../components/portfolio/PositionList';
import { RecentTrades } from '../components/orders/RecentTrades';
import { CurrencyBalanceCard } from '../components/funds/CurrencyBalanceCard';
import { Wallet, ArrowRight } from 'lucide-react';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [botState, setBotState] = useState<BotState | null>(null);
  const [isPaperTrading, setIsPaperTrading] = useState(false);
  const [balances, setBalances] = useState<CurrencyBalance[]>([]);
  const [totalUsdValue, setTotalUsdValue] = useState(0);

  useEffect(() => {
    const tradingMode = localStorage.getItem('trading-mode');
    setIsPaperTrading(tradingMode === 'paper');

    // Update bot state every second when bot is running
    const updateData = async () => {
      const state = tradingBot.getState();
      setBotState(state);

      if (tradingMode === 'paper') {
        const allBalances = paperTradingExecutor.getAllBalances();
        setBalances(allBalances);
        const total = await paperTradingExecutor.getTotalUsdValue();
        setTotalUsdValue(total);
      }
    };

    updateData();
    const interval = setInterval(updateData, 2000);

    // Listen for balance updates
    const handleBalanceUpdate = () => {
      updateData();
    };
    window.addEventListener('balance-updated', handleBalanceUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('balance-updated', handleBalanceUpdate);
    };
  }, []);

  if (!botState) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Trading Dashboard</h2>
        <div className="bot-status">
          <span className={`status-indicator ${botState.status.toLowerCase()}`}>
            {botState.status === 'RUNNING' ? '●' : '○'}
          </span>
          <span>{botState.status}</span>
          {botState.uptime && (
            <span className="uptime">
              Uptime: {formatUptime(botState.uptime)}
            </span>
          )}
        </div>
      </div>

      {/* Real-Time P&L Display - Critical Feature */}
      <PnLDisplay botState={botState} />

      {/* Multi-Currency Balances (Paper Trading) */}
      {isPaperTrading && balances.length > 0 && (
        <div className="dashboard-section currency-balances-section">
          <div className="section-header-with-link">
            <h3>Currency Balances</h3>
            <button
              className="link-button"
              onClick={() => navigate('/funds')}
            >
              <Wallet size={16} />
              Manage Funds
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="balances-preview">
            {balances.slice(0, 4).map((balance) => (
              <CurrencyBalanceCard key={balance.currency} balance={balance} />
            ))}
            {balances.length > 4 && (
              <div className="more-currencies" onClick={() => navigate('/funds')}>
                +{balances.length - 4} more
              </div>
            )}
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <PortfolioSummary botState={botState} />
        </div>

        <div className="dashboard-section">
          <h3>Open Positions</h3>
          <PositionList positions={botState.positions} />
        </div>

        <div className="dashboard-section">
          <h3>Recent Trades</h3>
          <RecentTrades limit={10} />
        </div>
      </div>
    </div>
  );
};

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

