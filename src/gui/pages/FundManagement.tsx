// Fund Management page for paper trading

import React, { useState, useEffect } from 'react';
import { paperTradingExecutor } from '../../bot/execution/PaperTradingExecutor';
import { CurrencyBalance } from '../../types';
import { FundSummary } from '../components/funds/FundSummary';
import { CurrencyBalanceCard } from '../components/funds/CurrencyBalanceCard';
import { CurrencyConverter } from '../components/funds/CurrencyConverter';
import { AllocationManager } from '../components/funds/AllocationManager';
import './FundManagement.css';

export const FundManagement: React.FC = () => {
  const [balances, setBalances] = useState<CurrencyBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const updateBalances = () => {
    const allBalances = paperTradingExecutor.getAllBalances();
    setBalances(allBalances);
    setLoading(false);
  };

  useEffect(() => {
    updateBalances();

    // Listen for balance updates
    const handleBalanceUpdate = () => {
      updateBalances();
    };

    window.addEventListener('balance-updated', handleBalanceUpdate);
    window.addEventListener('allocation-updated', handleBalanceUpdate);

    // Update balances periodically
    const interval = setInterval(updateBalances, 5000);

    return () => {
      window.removeEventListener('balance-updated', handleBalanceUpdate);
      window.removeEventListener('allocation-updated', handleBalanceUpdate);
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="fund-management loading">
        <div className="loading-spinner"></div>
        <p>Loading fund data...</p>
      </div>
    );
  }

  return (
    <div className="fund-management">
      <div className="fund-header">
        <h2>Fund Management</h2>
        <p className="subtitle">Manage your paper trading funds and currency allocations</p>
      </div>

      <div className="fund-content">
        <div className="fund-section">
          <FundSummary />
        </div>

        <div className="fund-section">
          <div className="section-header">
            <h3>Currency Balances</h3>
          </div>
          {balances.length === 0 ? (
            <div className="no-balances">
              <p>No currency balances found. Initialize paper trading to get started.</p>
            </div>
          ) : (
            <div className="balances-grid">
              {balances.map((balance) => (
                <CurrencyBalanceCard key={balance.currency} balance={balance} />
              ))}
            </div>
          )}
        </div>

        <div className="fund-section">
          <CurrencyConverter />
        </div>

        <div className="fund-section">
          <AllocationManager />
        </div>
      </div>
    </div>
  );
};

