// Portfolio page with multi-currency support

import React, { useState, useEffect } from 'react';
import { PositionList } from '../components/portfolio/PositionList';
import { CurrencyBalanceCard } from '../components/funds/CurrencyBalanceCard';
import { FundSummary } from '../components/funds/FundSummary';
import { tradingBot } from '../../bot/TradingBot';
import { paperTradingExecutor } from '../../bot/execution/PaperTradingExecutor';
import { BotState, CurrencyBalance, Position } from '../../types';
import { TrendingUp, TrendingDown, PieChart, DollarSign } from 'lucide-react';
import './Portfolio.css';

export const Portfolio: React.FC = () => {
  const [botState, setBotState] = useState<BotState | null>(null);
  const [balances, setBalances] = useState<CurrencyBalance[]>([]);
  const [totalUsdValue, setTotalUsdValue] = useState(0);
  const [isPaperTrading, setIsPaperTrading] = useState(false);

  useEffect(() => {
    const tradingMode = localStorage.getItem('trading-mode');
    setIsPaperTrading(tradingMode === 'paper');

    const updateData = async () => {
      const state = tradingBot.getState();
      setBotState(state);

      if (isPaperTrading) {
        const allBalances = paperTradingExecutor.getAllBalances();
        setBalances(allBalances);
        const total = await paperTradingExecutor.getTotalUsdValue();
        setTotalUsdValue(total);
      }
    };

    updateData();
    const interval = setInterval(updateData, 2000); // Update every 2 seconds

    // Listen for balance updates
    const handleBalanceUpdate = () => {
      updateData();
    };
    window.addEventListener('balance-updated', handleBalanceUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('balance-updated', handleBalanceUpdate);
    };
  }, [isPaperTrading]);

  // Group positions by currency
  const positionsByCurrency = (positions: Position[]) => {
    const grouped: Record<string, Position[]> = {};
    positions.forEach((position) => {
      const currency = position.symbol.split('/')[0];
      if (!grouped[currency]) {
        grouped[currency] = [];
      }
      grouped[currency].push(position);
    });
    return grouped;
  };

  // Calculate total unrealized P&L
  const totalUnrealizedPnL = botState
    ? botState.positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0)
    : 0;

  // Calculate portfolio distribution
  const getPortfolioDistribution = () => {
    if (!isPaperTrading || balances.length === 0) return [];
    
    return balances.map((balance) => ({
      currency: balance.currency,
      percentage: totalUsdValue > 0 ? (balance.usdValue / totalUsdValue) * 100 : 0,
      usdValue: balance.usdValue,
    })).sort((a, b) => b.usdValue - a.usdValue);
  };

  const distribution = getPortfolioDistribution();

  if (!botState) {
    return (
      <div className="portfolio loading">
        <div className="loading-spinner"></div>
        <p>Loading portfolio data...</p>
      </div>
    );
  }

  const groupedPositions = positionsByCurrency(botState.positions);

  return (
    <div className="portfolio">
      <div className="portfolio-header">
        <div>
          <h2>Portfolio</h2>
          <p className="subtitle">Multi-currency portfolio overview</p>
        </div>
        {isPaperTrading && (
          <div className="portfolio-mode-badge">
            <span>Paper Trading Mode</span>
          </div>
        )}
      </div>

      {/* Portfolio Summary */}
      <div className="portfolio-summary-section">
        {isPaperTrading ? (
          <FundSummary />
        ) : (
          <div className="portfolio-summary-cards">
            <div className="summary-card">
              <div className="card-icon">
                <DollarSign size={24} />
              </div>
              <div className="card-content">
                <div className="card-label">Total Balance</div>
                <div className="card-value">${botState.balance.toFixed(2)}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">
                {totalUnrealizedPnL >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
              </div>
              <div className="card-content">
                <div className="card-label">Unrealized P&L</div>
                <div className={`card-value ${totalUnrealizedPnL >= 0 ? 'positive' : 'negative'}`}>
                  ${Math.abs(totalUnrealizedPnL).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">
                <PieChart size={24} />
              </div>
              <div className="card-content">
                <div className="card-label">Active Positions</div>
                <div className="card-value">{botState.positions.length}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">
                <TrendingUp size={24} />
              </div>
              <div className="card-content">
                <div className="card-label">Win Rate</div>
                <div className="card-value">{botState.winRate.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Currency Balances (Paper Trading) */}
      {isPaperTrading && balances.length > 0 && (
        <div className="portfolio-section">
          <div className="section-header">
            <h3>Currency Balances</h3>
            <span className="section-count">{balances.length} currencies</span>
          </div>
          <div className="balances-grid">
            {balances.map((balance) => (
              <CurrencyBalanceCard key={balance.currency} balance={balance} />
            ))}
          </div>
        </div>
      )}

      {/* Portfolio Distribution (Paper Trading) */}
      {isPaperTrading && distribution.length > 0 && (
        <div className="portfolio-section">
          <div className="section-header">
            <h3>Portfolio Distribution</h3>
          </div>
          <div className="distribution-chart">
            {distribution.map((item) => (
              <div key={item.currency} className="distribution-item">
                <div className="distribution-header">
                  <span className="currency">{item.currency}</span>
                  <span className="percentage">{item.percentage.toFixed(1)}%</span>
                </div>
                <div className="distribution-bar">
                  <div
                    className="distribution-fill"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <div className="distribution-value">
                  ${item.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positions by Currency */}
      <div className="portfolio-section">
        <div className="section-header">
          <h3>Open Positions</h3>
          <span className="section-count">{botState.positions.length} positions</span>
        </div>
        {botState.positions.length === 0 ? (
          <div className="empty-state">
            <p>No open positions</p>
            <span className="empty-hint">Start trading to see positions here</span>
          </div>
        ) : (
          <div className="positions-by-currency">
            {Object.entries(groupedPositions).map(([currency, positions]) => (
              <div key={currency} className="currency-positions-group">
                <div className="currency-group-header">
                  <span className="currency-label">{currency}</span>
                  <span className="position-count">{positions.length} position{positions.length !== 1 ? 's' : ''}</span>
                </div>
                <PositionList positions={positions} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Portfolio Statistics */}
      <div className="portfolio-section">
        <div className="section-header">
          <h3>Portfolio Statistics</h3>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Trades</div>
            <div className="stat-value">{botState.totalTrades}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Realized P&L</div>
            <div className={`stat-value ${botState.realizedPnL >= 0 ? 'positive' : 'negative'}`}>
              ${botState.realizedPnL.toFixed(2)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Unrealized P&L</div>
            <div className={`stat-value ${botState.unrealizedPnL >= 0 ? 'positive' : 'negative'}`}>
              ${botState.unrealizedPnL.toFixed(2)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total P&L</div>
            <div className={`stat-value ${botState.totalPnL >= 0 ? 'positive' : 'negative'}`}>
              ${botState.totalPnL.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
