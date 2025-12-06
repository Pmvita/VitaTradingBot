// Portfolio summary cards with multi-currency support

import React, { useState, useEffect } from 'react';
import { BotState, CurrencyBalance } from '../../../types';
import { paperTradingExecutor } from '../../../bot/execution/PaperTradingExecutor';
import './PortfolioSummary.css';

interface PortfolioSummaryProps {
  botState: BotState;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ botState }) => {
  const [isPaperTrading, setIsPaperTrading] = useState(false);
  const [totalUsdValue, setTotalUsdValue] = useState(0);
  const [currencyCount, setCurrencyCount] = useState(0);

  useEffect(() => {
    const tradingMode = localStorage.getItem('trading-mode');
    const isPaper = tradingMode === 'paper';
    setIsPaperTrading(isPaper);

    if (isPaper) {
      const updateSummary = async () => {
        const balances = paperTradingExecutor.getAllBalances();
        setCurrencyCount(balances.length);
        const total = await paperTradingExecutor.getTotalUsdValue();
        setTotalUsdValue(total);
      };

      updateSummary();
      const interval = setInterval(updateSummary, 5000);

      // Listen for balance updates
      const handleBalanceUpdate = () => {
        updateSummary();
      };
      window.addEventListener('balance-updated', handleBalanceUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener('balance-updated', handleBalanceUpdate);
      };
    }
  }, []);

  const displayBalance = isPaperTrading ? totalUsdValue : botState.balance;

  return (
    <div className="portfolio-summary">
      <div className="summary-card">
        <div className="card-label">Total Balance</div>
        <div className="card-value">${displayBalance.toFixed(2)}</div>
        {isPaperTrading && currencyCount > 0 && (
          <div className="card-subtitle">{currencyCount} currencies</div>
        )}
      </div>
      <div className="summary-card">
        <div className="card-label">Today P&L</div>
        <div className={`card-value ${botState.totalPnL >= 0 ? 'positive' : 'negative'}`}>
          ${botState.totalPnL.toFixed(2)}
        </div>
        <div className="card-change">
          {displayBalance > 0
            ? `(${((botState.totalPnL / displayBalance) * 100).toFixed(2)}%)`
            : '(0.00%)'}
        </div>
      </div>
      <div className="summary-card">
        <div className="card-label">Win Rate</div>
        <div className="card-value">{botState.winRate.toFixed(1)}%</div>
      </div>
      <div className="summary-card">
        <div className="card-label">Total Trades</div>
        <div className="card-value">{botState.totalTrades}</div>
      </div>
    </div>
  );
};

