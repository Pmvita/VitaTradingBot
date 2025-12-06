// Fund summary component showing total portfolio value

import React, { useState, useEffect } from 'react';
import { paperTradingExecutor } from '../../../bot/execution/PaperTradingExecutor';
import { CurrencyBalance } from '../../../types';
import './FundSummary.css';

export const FundSummary: React.FC = () => {
  const [totalUsdValue, setTotalUsdValue] = useState(0);
  const [balances, setBalances] = useState<CurrencyBalance[]>([]);

  useEffect(() => {
    const updateSummary = async () => {
      const allBalances = paperTradingExecutor.getAllBalances();
      setBalances(allBalances);
      const total = await paperTradingExecutor.getTotalUsdValue();
      setTotalUsdValue(total);
    };

    updateSummary();
    const interval = setInterval(updateSummary, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fund-summary">
      <div className="summary-header">
        <h3>Portfolio Summary</h3>
      </div>
      <div className="summary-content">
        <div className="total-value">
          <span className="label">Total Portfolio Value</span>
          <span className="value">${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="currency-count">
          <span className="label">Active Currencies</span>
          <span className="value">{balances.length}</span>
        </div>
      </div>
    </div>
  );
};

