// Allocation manager component for per-currency allocation settings

import React, { useState, useEffect } from 'react';
import { paperTradingExecutor } from '../../../bot/execution/PaperTradingExecutor';
import { CurrencyAllocation } from '../../../types';
import { SUPPORTED_CURRENCIES } from '../../../constants';
import { Lock, Unlock } from 'lucide-react';
import './AllocationManager.css';

export const AllocationManager: React.FC = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('BTC');
  const [allocationType, setAllocationType] = useState<'fixed' | 'percentage'>('fixed');
  const [allocationAmount, setAllocationAmount] = useState<string>('');
  const [allocations, setAllocations] = useState<Map<string, CurrencyAllocation>>(new Map());
  const [totalUsdValue, setTotalUsdValue] = useState(0);

  useEffect(() => {
    const updateAllocations = async () => {
      const total = await paperTradingExecutor.getTotalUsdValue();
      setTotalUsdValue(total);
      
      // Load existing allocations
      const newAllocations = new Map<string, CurrencyAllocation>();
      for (const currency of SUPPORTED_CURRENCIES) {
        const allocation = paperTradingExecutor.getAllocation(currency);
        if (allocation) {
          newAllocations.set(currency, allocation);
        }
      }
      setAllocations(newAllocations);
    };

    updateAllocations();
    const interval = setInterval(updateAllocations, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSetAllocation = () => {
    if (!allocationAmount || parseFloat(allocationAmount) <= 0) {
      return;
    }

    const allocation: CurrencyAllocation = {
      currency: selectedCurrency,
      lockedAmount: parseFloat(allocationAmount),
      lockedType: allocationType,
      maxPositions: 1, // One position per currency
    };

    paperTradingExecutor.setAllocation(selectedCurrency, allocation);
    
    // Update local state
    const newAllocations = new Map(allocations);
    newAllocations.set(selectedCurrency, allocation);
    setAllocations(newAllocations);
    setAllocationAmount('');

    window.dispatchEvent(new CustomEvent('allocation-updated'));
  };

  const handleRemoveAllocation = (currency: string) => {
    const newAllocations = new Map(allocations);
    newAllocations.delete(currency);
    setAllocations(newAllocations);
    // Note: PaperTradingExecutor doesn't have removeAllocation, so we set it to allow all
    paperTradingExecutor.setAllocation(currency, {
      currency,
      lockedAmount: 0,
      lockedType: 'fixed',
      maxPositions: 1,
    });
  };

  const getLockedAmount = (allocation: CurrencyAllocation): number => {
    if (allocation.lockedType === 'fixed') {
      return allocation.lockedAmount;
    } else {
      return (totalUsdValue * allocation.lockedAmount) / 100;
    }
  };

  return (
    <div className="allocation-manager">
      <div className="manager-header">
        <h3>Currency Allocations</h3>
        <p className="subtitle">Lock funds per currency for trading</p>
      </div>

      <div className="allocation-form">
        <div className="form-row">
          <div className="form-group">
            <label>Currency</label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="currency-select"
            >
              {SUPPORTED_CURRENCIES.map((curr) => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Allocation Type</label>
            <select
              value={allocationType}
              onChange={(e) => setAllocationType(e.target.value as 'fixed' | 'percentage')}
              className="type-select"
            >
              <option value="fixed">Fixed USD Amount</option>
              <option value="percentage">Percentage of Portfolio</option>
            </select>
          </div>

          <div className="form-group">
            <label>{allocationType === 'fixed' ? 'Amount (USD)' : 'Percentage (%)'}</label>
            <input
              type="number"
              value={allocationAmount}
              onChange={(e) => setAllocationAmount(e.target.value)}
              placeholder={allocationType === 'fixed' ? '10000' : '20'}
              className="amount-input"
              step="any"
              min="0"
            />
          </div>

          <button
            className="set-button"
            onClick={handleSetAllocation}
            disabled={!allocationAmount || parseFloat(allocationAmount) <= 0}
          >
            <Lock size={16} />
            Set Allocation
          </button>
        </div>
      </div>

      <div className="allocations-list">
        <h4>Active Allocations</h4>
        {Array.from(allocations.values()).length === 0 ? (
          <div className="no-allocations">No allocations set</div>
        ) : (
          <div className="allocations-grid">
            {Array.from(allocations.values()).map((allocation) => (
              <div key={allocation.currency} className="allocation-item">
                <div className="allocation-header">
                  <span className="currency">{allocation.currency}</span>
                  <button
                    className="remove-button"
                    onClick={() => handleRemoveAllocation(allocation.currency)}
                    title="Remove allocation"
                  >
                    <Unlock size={14} />
                  </button>
                </div>
                <div className="allocation-details">
                  <div className="detail-row">
                    <span className="label">Type:</span>
                    <span className="value">{allocation.lockedType === 'fixed' ? 'Fixed USD' : 'Percentage'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Locked:</span>
                    <span className="value">
                      {allocation.lockedType === 'fixed'
                        ? `$${allocation.lockedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `${allocation.lockedAmount}% ($${getLockedAmount(allocation).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

