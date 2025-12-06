// Currency balance card component

import React from 'react';
import { CurrencyBalance } from '../../../types';
import './CurrencyBalanceCard.css';

interface CurrencyBalanceCardProps {
  balance: CurrencyBalance;
}

export const CurrencyBalanceCard: React.FC<CurrencyBalanceCardProps> = ({ balance }) => {
  return (
    <div className="currency-balance-card">
      <div className="currency-header">
        <div className="currency-symbol">{balance.currency}</div>
        <div className="currency-usd-value">${balance.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      <div className="currency-amount">
        {balance.amount.toLocaleString('en-US', { 
          minimumFractionDigits: balance.currency === 'USDT' || balance.currency === 'USDC' ? 2 : 8,
          maximumFractionDigits: balance.currency === 'USDT' || balance.currency === 'USDC' ? 2 : 8
        })} {balance.currency}
      </div>
    </div>
  );
};

